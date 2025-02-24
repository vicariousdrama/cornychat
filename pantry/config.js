require('dotenv').config();

const jamHost = process.env.JAM_HOST || 'beta.jam.systems';
const local = process.env.LOCAL;
const restrictRoomCreation = !!process.env.JAM_RESTRICT_ROOM_CREATION;
const serverAdminId = process.env.JAM_SERVER_ADMIN_ID;
const serverNsec = process.env.SERVER_NSEC || '';
const recordFileLocationPath =
  process.env.RECORD_FILE_LOCATION_PATH || './records';
const hlsFileLocationPath = process.env.HLS_FILE_LOCATION_PATH || './hls';
const recordFileRetentionDays = process.env.RECORD_FILE_RETENTION_DAYS
  ? parseInt(process.env.RECORD_FILE_RETENTION_DAYS)
  : 10;
const adEnabled = !!process.env.ADS ?? true;
const squareAdFileLocationPath =
  process.env.SQUARE_AD_FILE_LOCATION_PATH || '/pantry/adimages'; // square ads for enter room page
const chatAdFileLocationPath =
  process.env.CHAT_AD_FILE_LOCATION_PATH || '/pantry/adimages2'; // mobile ads: 320x50 for text chat
const relaysACL = process.env.RELAYS_ACL || '';
const relaysGeneral =
  process.env.RELAYS_GENERAL ||
  'wss://relay.damus.io,wss://nos.lol,wss://nostr-pub.wellorder.net,wss://relay.snort.social';
const relaysZapGoals =
  process.env.RELAYS_ZAPGOALS ||
  'wss://relay.damus.io,wss://nos.lol,wss://nostr-pub.wellorder.net,wss://relay.snort.social';
const relaysPoolPerWrite = process.env.RELAYS_POOL_PER_WRITE ?? true;
const liveActivitiesUpdateInterval = process.env.LIVE_ACTIVITIES_UPDATE_INTERVAL
  ? parseInt(process.env.LIVE_ACTIVITIES_UPDATE_INTERVAL)
  : 10; // minutes
const recurringEventsUpdateInterval = process.env
  .RECURRING_EVENTS_UPDATE_INTERVAL
  ? parseInt(process.env.RECURRING_EVENTS_UPDATE_INTERVAL)
  : 30; // minutes
const scheduledEventsUpdateInterval = process.env
  .SCHEDULED_EVENTS_UPDATE_INTERVAL
  ? parseInt(process.env.SCHEDULED_EVENTS_UPDATE_INTERVAL)
  : 30; // minutes
const serverZapGoalUpdateInterval = process.env.SERVER_ZAP_GOAL_UPDATE_INTERVAL
  ? parseInt(process.env.SERVER_ZAP_GOAL_UPDATE_INTERVAL)
  : 1; // hours
const subscriptionsEnabled = process.env.SUBSCRIPTIONS_ENABLED ?? false;
const gifSearchEnabled = process.env.GIF_SEARCH_ENABLED ?? false;
const gifSearchEndpoint =
  process.env.GIF_SEARCH_ENDPOINT ?? 'https://gifbuddy.lol/api/search_gifs';
const gifSearchApiKey = process.env.GIF_SEARCH_APIKEY ?? '';

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
  relaysPoolPerWrite,
  liveActivitiesUpdateInterval,
  recurringEventsUpdateInterval,
  scheduledEventsUpdateInterval,
  serverZapGoalUpdateInterval,
  subscriptionsEnabled,
  gifSearchEnabled,
  gifSearchEndpoint,
  gifSearchApiKey,
};
