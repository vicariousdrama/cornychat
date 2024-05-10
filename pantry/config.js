require('dotenv').config();

const jamHost = process.env.JAM_HOST || 'beta.jam.systems';
const local = process.env.LOCAL;
const restrictRoomCreation = !!process.env.JAM_RESTRICT_ROOM_CREATION;
const serverAdminId = process.env.JAM_SERVER_ADMIN_ID;
const serverNsec = process.env.SERVER_NSEC;
const recordFileLocationPath =
  process.env.RECORD_FILE_LOCATION_PATH || './records';
const hlsFileLocationPath = process.env.HLS_FILE_LOCATION_PATH || './hls';
const recordFileRetentionDays = process.env.RECORD_FILE_RETENTION_DAYS
  ? parseInt(process.env.RECORD_FILE_RETENTION_DAYS)
  : 10;
const adFileLocationPath = process.env.AD_FILE_LOCATION_PATH || '/pantry/adimages'; // square ads for enter room page
const adFileLocationPath2 = process.env.AD_FILE_LOCATION_PATH2 || '/pantry/adimages2'; // mobile ads: 320x50 for text chat
const adEnabled = !!process.env.ADS ?? true;

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
  adFileLocationPath,
  adFileLocationPath2,
};
