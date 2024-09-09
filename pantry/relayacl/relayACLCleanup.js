const {nip19} = require('nostr-tools');
const {activeUsers} = require('../services/ws');
const {get} = require('../services/redis');
const {getNpubs} = require('../nostr/nostr');
const {revokePubkeyFromRelays} = require('./relayACL');
const CLEANUP_INTERVAL = 15 * 60 * 1000; // Every 15 minutes, revoke pubkeys that have disconnected
const key_relayusers = 'relayaccess/users';         // users that login to rooms

const revokeDisconnectedUsers = async () => {
    // start a background process
    setInterval(async () => {
        console.log(`Checking for users where relay acl should be revoked`);
        let users = activeUsers();
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
                console.log(`- removing ${grantee} as no longer active`);
                await revokePubkeyFromRelays(true, grantee);
            }
        }
    }, CLEANUP_INTERVAL);
}

module.exports = {
    revokeDisconnectedUsers,
}