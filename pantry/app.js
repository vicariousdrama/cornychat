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
//const roomKeyRouter = require('./routes/roomKey');
const liveRoomRouter = require('./routes/liveRoom');
const recordingsRouter = require('./routes/recordings');
const {adEnabled, hlsFileLocationPath} = require('./config');

const roomListRouter = require('./routes/roomListRouter');
const scheduledEventsRouter = require('./routes/scheduledEventsRouter');
const staticRoomsRouter = require('./routes/staticRoomsRouter');
const staticEventsRouter = require('./routes/staticEventsRouter');
const roomModeratorsRouter = require('./routes/roomModerators');
const nip05Router = require('./routes/nip05Router');
const squareAdRouter = require('./routes/adRouterSquare');
const chatAdRouter = require('./routes/adRouterChat');
const adReportRouter = require('./routes/adReportRouter');
const userRoomRouter = require('./routes/userRoomsRouter');
const oldRoomsRouter = require('./routes/oldRoomsRouter');
const oldIdentitiesRouter = require('./routes/oldIdentitiesRouter');
const nip53Router = require('./routes/nip53Router');
const zapGoalRouter = require('./routes/zapGoalRouter');

const app = express();

app.use(logger('dev'));
app.use(cors());
app.use(express.json({limit: '500kb'}));
app.use(ssr);

app.use('/', indexRouter);
app.use('/metrics', metricsRouter);
app.use('/activity', activityRouter);

app.use('/stream/hls', express.static(hlsFileLocationPath));

app.use('/api/v1/', controller('rooms', roomAuthenticator,
    id => id,
    () => 'room-info'
  )
);
//app.use('/api/v1/rooms/:id/roomKey', roomKeyRouter);
app.use('/api/v1/rooms/:id/live', liveRoomRouter);
app.use('/api/v1/rooms/:id/recordings.zip', recordingsRouter);
app.use('/api/v1/rooms/:id/moderators', roomModeratorsRouter);
app.use('/api/v1/rooms/:id/nip53', nip53Router);

app.use('/api/v1/', controller('identities', identityAuthenticator));

app.use('/api/v1/admin/', adminRouter);

app.use('/api/v1/roomlist/', roomListRouter);
app.use('/api/v1/scheduledevents/', scheduledEventsRouter);
app.use('/api/v1/staticrooms/', staticRoomsRouter);
app.use('/api/v1/staticevents/', staticEventsRouter);

app.use('/.well-known/nostr.json', nip05Router);

if(adEnabled) {
  app.use('/api/v1/aimg/:id', squareAdRouter);
  app.use('/api/v1/cimg/', chatAdRouter);
  app.use('/api/v1/cimg/:roomId/:adId', chatAdRouter);
}
app.use('/api/v1/adr/:year/:month', adReportRouter);
app.use('/api/v1/userrooms/', userRoomRouter);
app.use('/api/v1/oldrooms/', oldRoomsRouter);
app.use('/api/v1/oldidentities/', oldIdentitiesRouter);
app.use('/api/v1/zapgoal/:id', zapGoalRouter);

module.exports = app;
