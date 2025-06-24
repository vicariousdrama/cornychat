const express = require('express');
const cors = require('cors');
const logger = require('morgan');

const {ssr} = require('./ssr');

require('./services/initDb')();

const indexRouter = require('./routes/index');
const metricsRouter = require('./routes/metrics');
const activityRouter = require('./routes/activity');
const adminRouter = require('./routes/admin');

const {roomAuthenticator, identityAuthenticator} = require('./auth');
const {controller} = require('./routes/controller');
const liveRoomRouter = require('./routes/liveRoom');
const recordingsRouter = require('./routes/recordings');
const {
  adEnabled,
  gifSearchEnabled,
  hlsFileLocationPath,
  subscriptionsEnabled,
} = require('./config');

const adReportRouter = require('./routes/adReportRouter');
const chatAdRouter = require('./routes/adRouterChat');
const clickyPointsRouter = require('./routes/clickyPointsRouter');
const envRouter = require('./routes/envRouter');
const highScoresRouter = require('./routes/highScoresRouter');
const imagePickerRouter = require('./routes/imagePickerRouter');
const motdRouter = require('./routes/motdRouter');
const nip05Router = require('./routes/nip05Router');
const nip53Router = require('./routes/nip53Router');
const oldRoomsRouter = require('./routes/oldRoomsRouter');
const oldIdentitiesRouter = require('./routes/oldIdentitiesRouter');
const permanentRoomsRouter = require('./routes/permanentRoomsRouter');
const roomListRouter = require('./routes/roomListRouter');
const roomMemberRouter = require('./routes/roomMemberRouter');
const roomModeratorsRouter = require('./routes/roomModerators');
const scheduledEventsRouter = require('./routes/scheduledEventsRouter');
const squareAdRouter = require('./routes/adRouterSquare');
const staticEventsRouter = require('./routes/staticEventsRouter');
const staticRoomsRouter = require('./routes/staticRoomsRouter');
const subscriptionRouter = require('./routes/subscriptionRouter');
const userRoomRouter = require('./routes/userRoomsRouter');
const zapGoalRouter = require('./routes/zapGoalRouter');

const app = express();

app.use(logger('dev'));
app.use(cors());
app.use(express.json({limit: '500kb'}));
app.use(ssr);

app.use('/', indexRouter);
app.use('/activity', activityRouter);
app.use('/metrics', metricsRouter);
app.use('/stream/hls', express.static(hlsFileLocationPath));

app.use(
  '/api/v1/',
  controller(
    'rooms',
    roomAuthenticator,
    id => id,
    () => 'room-info'
  )
);
app.use('/api/v1/', controller('identities', identityAuthenticator));

if (adEnabled) {
  app.use('/api/v1/aimg/:id', squareAdRouter);
  app.use('/api/v1/cimg/', chatAdRouter);
  app.use('/api/v1/cimg/:roomId/:adId', chatAdRouter);
}

if (gifSearchEnabled) {
  app.use('/api/v1/imagepicker/', imagePickerRouter);
}

if (subscriptionsEnabled) {
  app.use('/api/v1/subscription/', subscriptionRouter);
}

app.use('/api/v1/admin/', adminRouter);
app.use('/api/v1/adr/:year/:month', adReportRouter);
app.use('/api/v1/clickypts/', clickyPointsRouter);
//app.use('/api/v1/env/:n/:v', envRouter);
app.use('/api/v1/highscores/', highScoresRouter);
app.use('/api/v1/motd/', motdRouter);
app.use('/api/v1/oldidentities/', oldIdentitiesRouter);
app.use('/api/v1/oldrooms/', oldRoomsRouter);
app.use('/api/v1/permanentrooms/', permanentRoomsRouter);
app.use('/api/v1/roomlist/', roomListRouter);
app.use('/api/v1/rooms/:id/live', liveRoomRouter);
app.use('/api/v1/rooms/:id/recordings.zip', recordingsRouter);
app.use('/api/v1/rooms/:id/member', roomMemberRouter);
app.use('/api/v1/rooms/:id/moderators', roomModeratorsRouter);
app.use('/api/v1/rooms/:id/nip53', nip53Router);
app.use('/api/v1/scheduledevents/', scheduledEventsRouter);
app.use('/api/v1/staticrooms/', staticRoomsRouter);
app.use('/api/v1/staticevents/', staticEventsRouter);
app.use('/api/v1/userrooms/', userRoomRouter);
app.use('/api/v1/zapgoal/:id', zapGoalRouter);

app.use('/.well-known/nostr.json', nip05Router);

module.exports = app;
