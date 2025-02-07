const {nip19} = require('nostr-tools');
const {activeUsers} = require('../services/ws');
const {get} = require('../services/redis');
const {getNpubs} = require('../nostr/nostr');
const {getRelayConfigs, grantPubkeyToRelay, key_relaynonusers, listAllowedPubkeys, revokePubkeyFromRelay, revokePubkeyFromRelays} = require('./relayACL');
const {jamHost} = require('../config');
const CLEANUP_INTERVAL = 15 * 60 * 1000; // Every 15 minutes, revoke pubkeys that have disconnected
const key_relayusers = 'relayaccess/users';         // users that login to rooms

const revokeDisconnectedUsers = async () => {
    // start a background process
    setInterval(async () => {
        console.log(`[revokeDisconnectedUsers] checking for users where relay acl should be revoked`);
        let users = activeUsers();
        try {
            let granted = await get(key_relayusers);
            for (let grantee of granted) {
                let f = false;
                for (let user of users) {
                    let npubs = await getNpubs([user]);
                    for (let npub of npubs) {
                        let pubkey = nip19.decode(npub).data;
                        if (grantee == pubkey) {
                            f = true;
                            break;
                        }
                    }
                    if (f) break;
                }
                if (!f) {
                    console.log(`[revokeDisconnectedUsers] removing ${grantee} as no longer active`);
                    await revokePubkeyFromRelays(true, grantee);
                }
            }
        } catch (e) {
            console.log(`[revokeDisconnectedUsers] Error ${e}`)
        }
    }, CLEANUP_INTERVAL);
}

const removeDuplicatePubkeys = async () => {
    console.log(`[removeDuplicatePubkeys] Checking for duplicates`);
    try {
        let relayGrants = {} // to avoid duplicates, we list current pubkeys for the relay
        let relayConfigs = getRelayConfigs();
        let roomPubkeys = await get(key_relaynonusers);
        for (let relayConfig of relayConfigs) {
            let pubkeys = [];
            if(!relayGrants.hasOwnProperty(relayConfig.relay)) {
                pubkeys = await listAllowedPubkeys(relayConfig);
                relayGrants[relayConfig.relay] = pubkeys;
            }
            let uniquePubkeys = [];
            let dupePubkeys = [];
            for (let pubkey of pubkeys) {
                if (uniquePubkeys.includes(pubkey)) {
                    // its a dupe!
                    if (!dupePubkeys.includes(pubkey)) dupePubkeys.push(pubkey);
                } else {
                    uniquePubkeys.push(pubkey);
                }
            }
            // Process duplicates
            if (dupePubkeys.length > 0) console.log(`[removeDuplicatePubkeys] ${relayConfig.relay} has ${dupePubkeys.length} pubkeys that have been duplicated`);
            for (let pubkey of dupePubkeys) {
                console.log(`[removeDuplicatePubkeys] ${relayConfig.relay} has duplicate pubkey ${pubkey}. Remove and Regranting`);
                // user or room
                let grantReason = `${jamHost} user`;
                let isUser = true;
                for (let roomPubkey of roomPubkeys) {
                    if (roomPubkey != pubkey) continue;
                    grantReason = `${jamHost} room`;
                    isUser = false;
                    break;
                }
                // remove (assumes remote removes all instances)
                await revokePubkeyFromRelay(pubkey, relayConfig);
                // re-grant
                await grantPubkeyToRelay(pubkey, relayConfig, grantReason);
            }
        }
    } catch (e) {
        console.log(`[removeDuplicatePubkeys] Error ${e}`);
    }
    console.log(`[removeDuplicatePubkeys] Resolved duplicates`);
}

module.exports = {
    removeDuplicatePubkeys,
    revokeDisconnectedUsers,
}