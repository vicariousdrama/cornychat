require('dotenv').config();

// BASE FEATURES
const jamHost = process.env.JAM_HOST || 'beta.jam.systems';
const local = process.env.LOCAL;
const restrictRoomCreation = !!process.env.JAM_RESTRICT_ROOM_CREATION;
const serverAdminId = process.env.JAM_SERVER_ADMIN_ID;
const recordFileLocationPath =
  process.env.RECORD_FILE_LOCATION_PATH || './records';
const hlsFileLocationPath = process.env.HLS_FILE_LOCATION_PATH || './hls';
const recordFileRetentionDays = process.env.RECORD_FILE_RETENTION_DAYS
  ? parseInt(process.env.RECORD_FILE_RETENTION_DAYS)
  : 10;

// NOSTR BOT IDENTITY
const serverNsec = process.env.SERVER_NSEC || '';

// ADS
const adEnabled = !!process.env.ADS ?? true;
const squareAdFileLocationPath =
  process.env.SQUARE_AD_FILE_LOCATION_PATH || '/pantry/adimages'; // square ads for enter room page
const chatAdFileLocationPath =
  process.env.CHAT_AD_FILE_LOCATION_PATH || '/pantry/adimages2'; // mobile ads: 320x50 for text chat

// NOSTR RELAY MANAGEMENT
const relaysACL = process.env.RELAYS_ACL || '';
const relaysGeneral =
  process.env.RELAYS_GENERAL ||
  'wss://relay.damus.io,wss://nos.lol,wss://nostr-pub.wellorder.net,wss://relay.snort.social';
const relaysZapGoals =
  process.env.RELAYS_ZAPGOALS ||
  'wss://relay.damus.io,wss://nos.lol,wss://nostr-pub.wellorder.net,wss://relay.snort.social';
const relaysPoolPerWrite = process.env.RELAYS_POOL_PER_WRITE ?? true;

// LIVE ACTIVITIES AND SCHEDULED EVENTS
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

// SUBSCRIPTIONS
const lnbitsHost = process.env.LNBITS_HOST ?? '';
const subscriptionsEnabled = process.env.SUBSCRIPTIONS_ENABLED ?? false;

// GIF BUDDY
const gifSearchEnabled = process.env.GIF_SEARCH_ENABLED ?? false;
const gifSearchEndpoint =
  process.env.GIF_SEARCH_ENDPOINT ?? 'https://gifbuddy.lol/api/search_gifs';
const gifSearchApiKey = process.env.GIF_SEARCH_APIKEY ?? '';

// GAMES AND HIGHSCORE
const gameEnabled = process.env.GAME ?? false;
const gameScoreUpdateInterval = process.env.GAME_SCORE_UPDATE_INTERVAL
  ? parseInt(process.env.GAME_SCORE_UPDATE_INTERVAL)
  : 1; // hours

module.exports = {
  adEnabled,
  chatAdFileLocationPath,
  gameEnabled,
  gameScoreUpdateInterval,
  gifSearchApiKey,
  gifSearchEnabled,
  gifSearchEndpoint,
  hlsFileLocationPath,
  jamHost,
  liveActivitiesUpdateInterval,
  lnbitsHost,
  local,
  recordFileLocationPath,
  recordFileRetentionDays,
  relaysACL,
  relaysGeneral,
  relaysZapGoals,
  relaysPoolPerWrite,
  recurringEventsUpdateInterval,
  restrictRoomCreation,
  scheduledEventsUpdateInterval,
  serverAdminId,
  serverNsec,
  serverZapGoalUpdateInterval,
  squareAdFileLocationPath,
  subscriptionsEnabled,
};
