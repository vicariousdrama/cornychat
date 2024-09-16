require('dotenv').config();

const jamHost = process.env.JAM_HOST || 'beta.jam.systems';
const local = process.env.LOCAL;
const restrictRoomCreation = !!process.env.JAM_RESTRICT_ROOM_CREATION;
const serverAdminId = process.env.JAM_SERVER_ADMIN_ID;
const serverNsec = process.env.SERVER_NSEC || '';
const recordFileLocationPath = process.env.RECORD_FILE_LOCATION_PATH || './records';
const hlsFileLocationPath = process.env.HLS_FILE_LOCATION_PATH || './hls';
const recordFileRetentionDays = process.env.RECORD_FILE_RETENTION_DAYS ? parseInt(process.env.RECORD_FILE_RETENTION_DAYS) : 10;
const adEnabled = !!process.env.ADS ?? true;
const squareAdFileLocationPath = process.env.SQUARE_AD_FILE_LOCATION_PATH || '/pantry/adimages'; // square ads for enter room page
const chatAdFileLocationPath = process.env.CHAT_AD_FILE_LOCATION_PATH || '/pantry/adimages2'; // mobile ads: 320x50 for text chat
const relaysACL = process.env.RELAYS_ACL || '';
const relaysGeneral = process.env.RELAYS_GENERAL || 'wss://relay.damus.io,wss://nos.lol,wss://nostr-pub.wellorder.net,wss://relay.snort.social';
const relaysZapGoals = process.env.RELAYS_ZAPGOALS || 'wss://relay.damus.io,wss://nos.lol,wss://nostr-pub.wellorder.net,wss://relay.snort.social';

module.exports = {
  serverAdminId,
  serverNsec,
  jamHost,
  local,
  restrictRoomCreation,
  hlsFileLocationPath,
  recordFileLocationPath,
  recordFileRetentionDays,
  adEnabled,
  squareAdFileLocationPath,
  chatAdFileLocationPath,
  relaysACL,
  relaysGeneral,
  relaysZapGoals,
};
