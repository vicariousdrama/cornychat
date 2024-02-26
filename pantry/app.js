const express = require('express');
const cors = require('cors');
const logger = require('morgan');

const {ssr} = require('./ssr');

require('./services/initDb')();

const indexRouter = require('./routes/index');
const metricsRouter = require('./routes/metrics');
const activityRouter = require('./routes/activity');
const adminRouter = require('./routes/admin');
const roomListRouter = require('./routes/roomListRouter');
const staticRoomsRouter = require('./routes/staticRoomsRouter');
const staticEventsRouter = require('./routes/staticEventsRouter');
const roomModeratorsRouter = require('./routes/roomModerators');

const {roomAuthenticator, identityAuthenticator} = require('./auth');
const {controller} = require('./routes/controller');
const roomKeyRouter = require('./routes/roomKey');
const liveRoomRouter = require('./routes/liveRoom');
const recordingsRouter = require('./routes/recordings');
const privateKeysRouter = require('./routes/privateKeys');
const signEventRouter = require('./routes/signEvent');
const app = express();

app.use(logger('dev'));
app.use(cors());
app.use(express.json({limit: '500kb'}));
app.use(ssr);

app.use('/', indexRouter);
app.use('/metrics', metricsRouter);
app.use('/activity', activityRouter);

app.use(
  '/api/v1/',
  controller(
    'rooms',
    roomAuthenticator,
    id => id,
    () => 'room-info'
  )
);
app.use('/api/v1/rooms/:id/roomKey', roomKeyRouter);
app.use('/api/v1/rooms/:id/live', liveRoomRouter);
app.use('/api/v1/rooms/:id/recordings.zip', recordingsRouter);
app.use('/api/v1/rooms/:id/privatekeys', privateKeysRouter);
app.use('/api/v1/rooms/:id/sign', signEventRouter);
app.use('/api/v1/rooms/:id/moderators', roomModeratorsRouter);

app.use('/api/v1/', controller('identities', identityAuthenticator));

app.use('/api/v1/admin/', adminRouter);

app.use('/api/v1/roomlist/', roomListRouter);
app.use('/api/v1/staticrooms/', staticRoomsRouter);
app.use('/api/v1/staticevents/', staticEventsRouter);

module.exports = app;
