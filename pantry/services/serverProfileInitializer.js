const {jamHost} = require('../config');
const {updateNostrProfileForServer} = require('../nostr/nostr');

const serverProfileInitializer = async () => {
    let serverNsec = process.env.SERVER_NSEC || '';
    if (serverNsec.length > 0) {
        let name = process.env.SERVER_NAME || '';
        let description = process.env.SERVER_PROFILE_ABOUT || `This bot periodically posts open audio spaces for ${jamHost}`;
        let logoURI = process.env.SERVER_PROFILE_PICTURE || `https://${jamHost}/img/cornychat-app-icon-512.png`;
        let backgroundURI = process.env.SERVER_PROFILE_BANNER || `https://${jamHost}/img/cornychat-banner.png`;
        let lud16 = process.env.SERVER_PROFILE_LUD16 || 'cornychatdev@satsilo.com';
        let nip05 = process.env.SERVER_PROFILE_NIP05 || `announcebot@${jamHost}`;
        let result = await updateNostrProfileForServer(name, description, logoURI, backgroundURI, lud16, nip05);
    }
};

module.exports = {serverProfileInitializer};
