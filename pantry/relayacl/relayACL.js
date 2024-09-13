const fetch = require('node-fetch');
const fetchCookie = require('fetch-cookie');
const {CookieJar} = require('tough-cookie'); // depends on punycode
const {nip19, getPublicKey, finalizeEvent} = require('nostr-tools');
const {serverNsec} = require('../config');
const {set, get} = require('../services/redis');

const pmd = false;

// Where referenced
// - when server starts, revoke any ACL granted for user
// - periodic background check removes grants for disconnected users
// - when a room is marked as public, live activity or scheduled event in room auth, allow it to write its events
// - when a user connects, if have nostr identity, update ACL to include in profile, and track in redis
// - when a user updates identity, remove old and grant new

// Helper for the following endpoints for Cloud Fodder's Relay Tools
//
// utils
//  GET /api/auth/callback/credentials
//      - finalizes login to relay to get a cookie token to use in api calls    
//  GET /api/auth/logintoken
//      - request a login token challenge
//  GET /api/auth/csrf
//      - retrieve a cross site request forgery token
//
// pubkeys
//  POST /api/relay/{relayID}/allowlistpubkey
//      - grant/add a pubkey to the relay acl allow list
//  GET /api/sconfig/relays/{relayId}
//      - retrieve config of relay which yields allow_list, block_list, owner, moderators, etc.
//      https://relay.tools/api/sconfig/relays/cm0is16uu003l1n6ztjxuzvxw
//  DELETE /api/relay/{relayId}/allowlistpubkey?pubkey={pubkey}
//      - removes a pubkey from a relay acl allow list

const key_relayusers = 'relayaccess/users';         // users that login to rooms
const key_relaynonusers = 'relayaccess/nonusers';   // service pubkey, room pubkey, nwc providers (lnbits, getalby, etc)

let relaysToUse = undefined;
let relayCookies = [];
const getRelayConfigs = function() {
    if (!relaysToUse) {
        relaysToUse = [];
        Object.keys(process.env).forEach(env => {
            if (env.startsWith('RELAYS_ACL')) {
                if (env.length == 'RELAYS_ACL_N'.length) {
                    let endpoint = process.env[`${env}_ENDPOINT`];
                    let id = process.env[`${env}_ID`];
                    let relay = process.env[env];
                    if (pmd) console.log(`registering relay acl configuration: {relay: ${relay}, endpoint: ${endpoint}, relayId: ${id}}`);
                    if (endpoint && endpoint != '' && id && id != '' && relay && relay != '') {
                        relaysToUse.push({
                            relay: relay,
                            id: id,
                            endpoint: endpoint
                        });
                    }
                }
            }
        });
    }
    return relaysToUse;
}

// ----------------------------------------------------------------------------------------------------------------
// GRANT

const grantPubkeyToRelays = async(isUser, pubkey, reason) => {
    let alwaysGrant = false;
    let relayConfigs = getRelayConfigs();
    let rediskey = isUser ? key_relayusers : key_relaynonusers
    let relayPubkeyEntries = await get(rediskey);
    if (!relayPubkeyEntries) relayPubkeyEntries = [];
    let relayGrants = {} // to avoid duplicates, we list current pubkeys for the relay
    if (alwaysGrant || !relayPubkeyEntries.includes(pubkey)) {
        for (let relayConfig of relayConfigs) {
            if(!relayGrants.hasOwnProperty(relayConfig.relay)) {
                relayGrants[relayConfig.relay] = await listAllowedPubkeys(relayConfig);
            }
            if(!relayGrants.hasOwnProperty(relayConfig.relay) || !relayGrants[relayConfig.relay].includes(pubkey)) {
                await grantPubkeyToRelay(pubkey, relayConfig, reason);
                if(!relayGrants.hasOwnProperty(relayConfig.relay)) relayGrants[relayConfig.relay] = [];
                relayGrants[relayConfig.relay].push(pubkey);
            }
        }
        relayPubkeyEntries.push(pubkey);
        await set(rediskey, relayPubkeyEntries);
    }
}
const grantPubkeyToRelay = async(pubkey, relayConfig, reason) => {
    // Determine base url
    let baseUrl = `https://${relayConfig.endpoint}`;
    if (pmd) console.log(`- granting ${pubkey} to ${relayConfig.relay}`);
    // Ensure logged in
    let fetchWithCookies = await getFetchWithCookieForRelay(relayConfig);
    if (fetchWithCookies) {
        // Setup and perform request
        try {
            let url = `${baseUrl}/api/relay/${relayConfig.id}/allowlistpubkey`;
            let data = JSON.stringify({pubkey:pubkey,reason:reason});
            let res = await fetchWithCookies(url, {
                method:'POST',
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                },
                body: data
            });
        } catch(error) {
            console.log(`Unable to grant pubkey to relay ${relayConfig.id}`);
            console.log(error);
        }
    }
}

// ----------------------------------------------------------------------------------------------------------------
// LIST

const listAllAllowedPubkeys = async() => {
    let relayConfigs = getRelayConfigs();
    let pubkeys = [];
    for (let relayConfig of relayConfigs) {
        let relayPubkeys = await listAllowedPubkeys(relayConfig);
        for (let p of relayPubkeys) {
            if (!pubkeys.includes(p)) pubkeys.push(p);
        }
    }
    return pubkeys;
}

const listAllowedPubkeys = async(relayConfig) => {
    let allowedPubkeys = [];
    // Determine base url
    let baseUrl = `https://${relayConfig.endpoint}`;
    if (pmd) console.log(`- listing pubkeys allowed for ${baseUrl}`);
    // Setup and perform request
    try {
        let url = `${baseUrl}/api/sconfig/relays/${relayConfig.id}`;
        let res = await fetch(url, {
            method:'GET',
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch(error) {
        console.log(`Unable to list allowed pubkeys for ${relayConfig.id}`);
        console.log(error);
    }
    return allowedPubkeys;
}

// ----------------------------------------------------------------------------------------------------------------
// REVOKE

const revokeAllUserPubkeys = async () => {
    let relayConfigs = getRelayConfigs();
    let relayPubkeyEntries = await get(key_relayusers);
    if (!relayPubkeyEntries) relayPubkeyEntries = [];
    if (relayPubkeyEntries == undefined) relayPubkeyEntries = [];
    for (let pubkey of relayPubkeyEntries) {
        for (let relayConfig of relayConfigs) {
            await revokePubkeyFromRelay(pubkey, relayConfig);
        }
    }
    const ok = await set(key_relayusers, []);
}

const revokePubkeyFromRelays = async(isUser, pubkey) => {
    let alwaysRevoke = true;
    let relayConfigs = getRelayConfigs();
    let rediskey = isUser ? key_relayusers : key_relaynonusers
    let relayPubkeyEntries = await get(rediskey);
    if (!relayPubkeyEntries) relayPubkeyEntries = [];
    if (alwaysRevoke || relayPubkeyEntries.includes(pubkey)) {
        for (let relayConfig of relayConfigs) {
            await revokePubkeyFromRelay(pubkey, relayConfig);
        }
        let newPubkeyEntries = []
        for (let pubkeyEntry of relayPubkeyEntries) {
            if (pubkeyEntry != pubkey) {
                newPubkeyEntries.push(pubkeyEntry);
            }
        }
        await set(rediskey, newPubkeyEntries);
    }
}
const revokePubkeyFromRelay = async(pubkey, relayConfig) => {
    // Determine base url
    let baseUrl = `https://${relayConfig.endpoint}`;
    if (pmd) console.log(`- revoking ${pubkey} from ${relayConfig.relay}`);
    // Ensure logged in
    let fetchWithCookies = await getFetchWithCookieForRelay(relayConfig);
    if (fetchWithCookies) {
        // Setup and perform request
        try {
            let url = `${baseUrl}/api/relay/${relayConfig.id}/allowlistpubkey?pubkey=${pubkey}`;
            let res = await fetchWithCookies(url, {
                method:'DELETE',
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                }
            });
        } catch(error) {
            console.log(`Unable to revoke pubkey from relay ${relayConfig.id}`);
            console.log(error);
        }
    }
}

// ----------------------------------------------------------------------------------------------------------------
// utilities to perform nostr authenticated login and csrf for cookiejar

const getRelayLoginToken = async(fetchWithCookies, baseUrl) => {
    let ret = '';
    let url = `${baseUrl}/api/auth/logintoken`;
    try {
        let res = await fetchWithCookies(url, {method:'GET',headers:{Accept:'application/json'}});
        if (res.status < 400) {
            let jsonBody = await res.json();
            ret = jsonBody.token;
        }
    } catch(error) {
        console.log(`Unable to get relay token when calling ${url}`);
        console.log(error);
    }
    return ret;
}
const getRelayCSRFToken = async(fetchWithCookies, baseUrl) => {
    let ret = '';
    let url = `${baseUrl}/api/auth/csrf`;
    try {
        let res = await fetchWithCookies(url, {method:'GET',headers:{Accept:'application/json'}});
        if (res.status < 400) {
            let jsonBody = await res.json();
            ret = jsonBody.csrfToken;
        }
    } catch(error) {
        console.log(`Unable to get CSRF token when calling ${url}`);
        console.log(error);
    }
    return ret;
}
const getFetchWithCookieForRelay = async(relayConfig) => {
    let doLogin = !relayCookies.includes(relayConfig.relay);
    if (!doLogin) {
        let cookieExpiryTime = 1 * 60 * 60 * 1000; // an hour
        let timeset = relayCookies[relayConfig.relay].timeset;
        if ((timeset + cookieExpiryTime) < Math.floor(Date.now() / 1000)) {
            doLogin = true;
        }
    }
    if (doLogin) await loginToRelay(relayConfig);
    let rco = relayCookies[relayConfig.relay];
    if (rco) {
        if (pmd) console.log(`*** relay cookie for ${relayConfig.relay} = ${JSON.stringify(rco.cookieJar)}`);
        return rco.fetchWithCookies;
    } else {
        console.log("ERROR: Unable to get relay cookie");
        return undefined;
    }
}
const loginToRelay = async(relayConfig) => {
    relayCookies[relayConfig.relay] = {timeset: Math.floor(Date.now() / 1000), fetchWithCookies: undefined, cookieJar: new CookieJar()}
    relayCookies[relayConfig.relay].fetchWithCookies = fetchCookie(fetch, relayCookies[relayConfig.relay].cookieJar);

    // Determine base url
    let baseUrl = `https://${relayConfig.endpoint}`;
    // Get login token
    let loginToken = await getRelayLoginToken(relayCookies[relayConfig.relay].fetchWithCookies, baseUrl);
    // Sign a nostr event with the token challenge
    if (serverNsec.length == 0) return false;
    const sk = nip19.decode(serverNsec).data;
    const pk = getPublicKey(sk);
    const event = finalizeEvent({
        created_at: Math.floor(Date.now() / 1000),
        kind: 27235,
        tags: [], // Note: Cloud's cookie cutter is passing nil here in go which should be invalid
        content: loginToken,
    }, sk);
    // Get CSRF
    let csrfToken = await getRelayCSRFToken(relayCookies[relayConfig.relay].fetchWithCookies, baseUrl);
    // Post form data for login
    try
    {
        let url = `${baseUrl}/api/auth/callback/credentials`;
        let data = new URLSearchParams();
        data.append("kind", String(event.kind));
        data.append("content", String(event.content));
        data.append("created_at", String(event.created_at));
        data.append("pubkey", event.pubkey);
        data.append("sig", event.sig);
        data.append("id", event.id);
        data.append("csrfToken", csrfToken);
        data.append("callbackUrl", baseUrl);
        data.append("json", "true");
        let res = await relayCookies[relayConfig.relay].fetchWithCookies(url, {
            method:'POST',
            credentials: 'include',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: data.toString()
        });
        if (res.status < 400) {
            let cookieHeader = res.headers.get('Set-Cookie');
        }
    } catch(error) {
        console.log(`Unable to login to relay ${baseUrl}`);
        console.log(error);
    }
}

module.exports = {
    grantPubkeyToRelays,
    grantPubkeyToRelay,
    listAllAllowedPubkeys,
    listAllowedPubkeys,
    revokeAllUserPubkeys,
    revokePubkeyFromRelays,
    revokePubkeyFromRelay,
};