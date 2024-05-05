const {set, get, list} = require('./redis');
const {deleteLiveActivity, publishLiveActivity} = require('../nostr/nostr');
const {activeUsersInRoom} = require('./ws');
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

const liveeventUpdater = async () => {

    let activeRoomTimes = await get('server/liveActivities');
    if (activeRoomTimes == undefined) activeRoomTimes = {};

    // delete any prior activities on startup
    console.log(`Checking cache of prior live rooms on startup`);
    let activeRoomsToRemove = [];
    Object.keys(activeRoomTimes).forEach(key => {
        console.log(`Deleting prior live activity for room ${key}`);
        let dtt = activeRoomTimes[key];
        (async() => {let dla = await deleteLiveActivity(key, dtt);});
        activeRoomsToRemove.push(key);
    })
    for (let k of activeRoomsToRemove) {
        delete activeRoomTimes[k];
    }

    // start a background process
    setInterval(async () => {
        console.log(`Checking for live rooms`);

        let roomsWithUsers = [];

        // Same basic logic from room list router to get the potential rooms
        let rooms = [];    
        let roomIds = [];
        // current hour
        let dt = new Date();
        let dtt = dt.getTime();
        let dti = dt.toISOString();
        let dts = dti.replaceAll('-','').replace('T','').slice(0,10);
        let k = `usagetracking/${dts}/`;
        let currentHourKeys = await list (k);
        if (currentHourKeys != undefined) {
            for (let currentHourKey of currentHourKeys) {
                let roomId = currentHourKey.split('/').slice(-1)[0];
                roomIds.push(roomId);
            }
        }
        // previous hour
        dt.setTime(dt.getTime() - (60 * 60 * 1000));
        dti = dt.toISOString();
        dts = dti.replaceAll('-','').replace('T','').slice(0,10);
        k = `usagetracking/${dts}/`;
        let previousHourKeys = await list (k);
        if (previousHourKeys != undefined) {
            for (let previousHourKey of previousHourKeys) {
                let roomId = previousHourKey.split('/').slice(-1)[0];
                if (!roomIds.includes(roomId)) roomIds.push(roomId);
            }
        }

        for(let roomId of roomIds) {
            let peerIds = activeUsersInRoom(roomId);
            let userCount = peerIds.length;
            if (userCount == 0) continue;
            roomsWithUsers.push(roomId);
            let userInfo = await Promise.all(peerIds.map(id => get(`identities/${id}`)));
            let roomKey = "rooms/" + roomId;
            let roomInfo = await get(roomKey);
            
            console.log(`roomInfo: `, roomInfo);

            let isClosed = roomInfo?.closed ?? false;
            let isPrivate = roomInfo?.isPrivate ?? false;
            let isLiveActivityAnnounced = roomInfo?.isLiveActivityAnnounced ?? false;
            if ((!isLiveActivityAnnounced) || isPrivate || isClosed) {
                if (activeRoomTimes.hasOwnProperty(roomId)) {
                    let dttr = activeRoomTimes[roomId];
                    if (isPrivate) {
                        let pla = await publishLiveActivity(roomId, dttr, roomInfo, userInfo, 'ended');
                        let dla = await deleteLiveActivity(roomId, dttr);
                    } else if (isClosed) {
                        let pla = await publishLiveActivity(roomId, dttr, roomInfo, userInfo, 'ended');
                    }
                    // Done. lets close it out
                    delete activeRoomTimes[roomId];
                }
            } else {
                let dttr = dtt;
                if (activeRoomTimes.hasOwnProperty(roomId)) {
                    // Updating existing live activity, use existing start time
                    dttr = activeRoomTimes[roomId];
                    // TODO: Announce as kind 1 event via main server bot if its been more than an hour since last announce?
                } else {
                    // Creating new live activity, assign the time
                    activeRoomTimes[roomId] = dtt;
                    // TODO: Announce as a kind 1 event via the main server bot
                }
                let pla = await publishLiveActivity(roomId, dttr, roomInfo, userInfo, 'live');
            }
        };

        // End those that no longer have users
        let activeRoomsToRemove = [];
        Object.keys(activeRoomTimes).forEach(key => {
            if (!roomsWithUsers.includes(key)) {
                activeRoomsToRemove.push(key);
                let dtt = activeRoomTimes[key];
                // TODO: publish as ended ?    
                (async() => {let dla = await deleteLiveActivity(key, dtt);});
            }
        })
        for (let k of activeRoomsToRemove) {
            delete activeRoomTimes[k];
        }

        // save activeRooms live activity tracking state (so we can reload on restarts)
        const ok = await set('server/liveActivities', activeRoomTimes);

    }, UPDATE_INTERVAL);
};

module.exports = {liveeventUpdater};
