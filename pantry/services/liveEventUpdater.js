const {set, get, list} = require('./redis');
const {deleteLiveActivity, getLiveActivities, publishLiveActivity, publishRoomActive, getScheduledEvents} = require('../nostr/nostr');
const {activeUsersInRoom} = require('./ws');
//const {getPublicKey} = require('nostr-tools');
const UPDATE_INTERVAL = 1 * 60 * 1000; // We check new rooms and live event end every minute
const pmd = false;

const liveEventUpdater = async () => {

    let runCounter = 0;

    let activeRoomTimes = await get('server/liveActivities');
    if (activeRoomTimes == undefined) activeRoomTimes = {};
    let activeRoomTimesAnnounced = {};

    // delete any prior activities on startup
    console.log(`Checking cache of prior live rooms on startup, and ending older events`);
    let liveActivities = await getLiveActivities() 
    if (liveActivities) {
        for (let oldLiveActivity of liveActivities) {
            let status = 'live';
            let dTag = undefined;
            let rTag = undefined;
            if (!oldLiveActivity.tags) continue;
            for (let tag of oldLiveActivity.tags) {
                if (tag == undefined || tag.length < 2) continue;
                if (tag[0] == 'status') activityStatus = tag[1];
                if (tag[0] == 'd') dTag = tag[1];
                if (tag[0] == 'r') rTag = tag[1];
            }
            if (!dTag) {
                if (pmd) console.log(`Unable to end or delete live activity without d tag: ${JSON.stringify(oldLiveActivity)}`);
                continue;
            }
            if (!rTag) {
                if (pmd) console.log(`Unable to end or delete live activity without r tag to identity room id: ${JSON.stringify(oldLiveActivity)}`);
                continue;
            }
            let dtt = `${dTag}`;
            let key = rTag.split('/').slice(-1)[0];
            if (status == 'ended') {
                // remove it
                //let dla = await deleteLiveActivity(key, dtt);
            } else {
                // reload into local tracking
                if (!activeRoomTimes.hasOwnProperty(key)) {
                    activeRoomTimes[key] = Math.floor(dtt);
                    activeRoomTimesAnnounced[key] = Math.floor(dtt);
                } else {
                    // mark older as ended
                    dtt = dtt > activeRoomTimes[key] ? activeRoomTimes[key] : dtt;
                    let roomKey = `rooms/${key}`;
                    let roomInfo = await get(roomKey);
                    let userInfo = [];
                    let pla = await publishLiveActivity(key, dtt, roomInfo, userInfo, 'ended');
                }
            }
        }
    }

    // start a background process
    setInterval(async () => {
        if (pmd) console.log(`Checking for live rooms`);

        // Increment this count number
        runCounter = runCounter + 1;

        let roomsWithUsers = [];

        // Same basic logic from room list router to get the potential rooms
        let rooms = [];    
        let roomIds = [];
        // current hour
        let dt = new Date();
        let dtt = dt.getTime();
        let three_hours_ago = dtt - (3*60*60*1000);
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
            
            //console.log(`roomInfo: `, roomInfo);
            let dttr = dtt;
            let isnew = (!activeRoomTimes.hasOwnProperty(roomId));
            let announceit = true;
            let isClosed = roomInfo?.closed ?? false;
            let isPrivate = roomInfo?.isPrivate ?? false;
            let isLiveActivityAnnounced = roomInfo?.isLiveActivityAnnounced ?? false;
            if ((!isLiveActivityAnnounced) || isPrivate || isClosed) {
                if (activeRoomTimes.hasOwnProperty(roomId)) {
                    let dttr = activeRoomTimes[roomId];
                    if (isPrivate) {
                        let pla = await publishLiveActivity(roomId, dttr, roomInfo, userInfo, 'ended');
                        //let dla = await deleteLiveActivity(roomId, dttr);
                    } else if (isClosed) {
                        let pla = await publishLiveActivity(roomId, dttr, roomInfo, userInfo, 'ended');
                    }
                    // Done. lets close it out
                    delete activeRoomTimes[roomId];
                    if (activeRoomTimesAnnounced.hasOwnProperty(roomId)) {
                        delete activeRoomTimesAnnounced[roomId];
                    }
                }
            } else {
                if (!isnew) {
                    // Updating existing live activity, use existing start time
                    dttr = activeRoomTimes[roomId];
                } else {
                    // Creating new live activity, assign the time
                    activeRoomTimes[roomId] = dtt;
                }
                // Publish as live only once per twenty minutes
                if ((runCounter % 20 == 1) || (isnew)) {
                    let pla = await publishLiveActivity(roomId, dttr, roomInfo, userInfo, 'live');
                }
            }

            if (!isPrivate && !isClosed) {
                // Announce as kind 1 event via main server bot if new, or its been more than an hour since last announce
                if (pmd) console.log(`..checking if need to publish room ${roomId} as active`);
                if (activeRoomTimesAnnounced.hasOwnProperty(roomId)) announceit = (activeRoomTimesAnnounced[roomId] < three_hours_ago);
                if (announceit) {
                    activeRoomTimesAnnounced[roomId] = dtt;
                    if (pmd) console.log(`..publishing ${roomId} as active in kind 1 note`);
                    let pk1 = await publishRoomActive(roomId, dttr, roomInfo, userInfo, isnew);
                } else {
                    if (pmd) console.log(`..skipping, was previously published at ${activeRoomTimesAnnounced[roomId]}`);
                }
            }
        };

        // End those that no longer have users
        let activeRoomsToRemove = [];
        Object.keys(activeRoomTimes).forEach(key => {
            if (!roomsWithUsers.includes(key)) {
                activeRoomsToRemove.push(key);
                (async() => {
                    let dtt = activeRoomTimes[key];
                    let userInfo = [];
                    let roomKey = `rooms/${key}`;
                    let roomInfo = await get(roomKey);
                    let pla = await publishLiveActivity(key, dtt, roomInfo, userInfo, 'ended');
                    //let dla = await deleteLiveActivity(key, dtt);
                })();
            }
        })
        for (let k of activeRoomsToRemove) {
            delete activeRoomTimes[k];
        }

        // save activeRooms live activity tracking state (so we can reload on restarts)
        const ok = await set('server/liveActivities', activeRoomTimes);

    }, UPDATE_INTERVAL);
};

module.exports = {liveEventUpdater};
