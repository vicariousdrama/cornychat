const {jamHost, liveActivitiesUpdateInterval} = require('../config');
const {set, get, list} = require('./redis');
const {deleteLiveActivity, getLiveActivities, publishLiveActivity, publishRoomActive, getScheduledEvents} = require('../nostr/nostr');
const {activeUsersInRoom} = require('./ws');
const CHECK_INTERVAL = 1 * 60 * 1000; // We check new rooms and live event end every minute
const pmd = true;

const liveEventUpdater = async () => {

    let runCounter = 0;
    let activeRoomTimesAnnounced = {};
    let liveActivities = undefined;
    let activeRoomTimes = {};

    try {
        activeRoomTimes = await get('server/liveActivities');
        if (activeRoomTimes == undefined) activeRoomTimes = {};

        // delete any prior activities on startup
        console.log(`[liveEventUpdater] checking cache of prior live rooms on startup, and ending older events`);
        try {
            liveActivities = await getLiveActivities();
        } catch (e) {
            console.log(`[liveEventUpdater] error caching initial live rooms on startup: ${e}`);
        }
        if (liveActivities) {
            for(let relayUrl of Object.keys(liveActivities)) {
                let relayActivities = liveActivities[relayUrl];
                if (pmd) console.log(`[liveEventUpdater] processing ${relayActivities.length} events on relay ${relayUrl}`);
                for (let oldLiveActivity of relayActivities) {
                    let eventId = oldLiveActivity.id;
                    let status = undefined;
                    let dTag = undefined;
                    let rTag = undefined;
                    let lTag = undefined;
                    let endTime = undefined;
                    if (!oldLiveActivity.tags) continue;
                    for (let tag of oldLiveActivity.tags) {
                        if (tag == undefined || tag.length < 2) continue;
                        if (tag[0] == 'status') status = tag[1];
                        if (tag[0] == 'd') dTag = tag[1];
                        if (tag[0] == 'r') rTag = tag[1];
                        if (tag[0] == 'l' && tag[1] == jamHost) lTag = tag[1];
                        if (tag[0] == 'ends') endTime = tag[1];
                    }
                    if (!dTag) {
                        if (pmd) console.log(`[liveEventUpdater] unable to end or delete live activity without d tag: ${JSON.stringify(oldLiveActivity)}`);
                        continue;
                    }
                    if (!rTag) {
                        if (pmd) console.log(`[liveEventUpdater] unable to end or delete live activity without r tag to identity room id: ${JSON.stringify(oldLiveActivity)}`);
                        continue;
                    }
                    if (!lTag) {
                        if (pmd) console.log(`[liveEventUpdater] skipping live activity that is not from this host: ${JSON.stringify(oldLiveActivity)}`);
                        continue;                    
                    }
                    if (!status) {
                        if (pmd) console.log(`[liveEventUpdater] unable to end or delete live activity without status tag: ${JSON.stringify(oldLiveActivity)}`);
                        continue;                    
                    }
                    let dtt = `${dTag}`;
                    let key = rTag.split('/').slice(-1)[0];
                    if (status == 'ended') {
                        if (pmd) console.log(`[liveEventUpdater] event is already ended`);
                        // remove it if older then 1 days
                        if (endTime) {
                            if (Math.floor(endTime) < (Math.floor(Date.now() / 1000) - (1 * 24 * 60 * 60))) {
                                if (pmd) console.log(`[liveEventUpdater] deleting event that is older than 1 day`);
                                let dla = await deleteLiveActivity(key, dtt, eventId);
                            } else {
                                if (pmd) console.log(`[liveEventUpdater] skipping delete. time is ${Math.floor(Date.now() / 1000)}, and ends is ${Math.floor(endTime)}`);
                            }
                        } else {
                            if (pmd) console.log(`[liveEventUpdater] skipping delete. it's ended, but no ends time is set`);
                        }
                    } else if (status == 'live') {
                        let roomKey = `rooms/${key}`;
                        let roomInfo = await get(roomKey);
                        if (!roomInfo || roomInfo == undefined) {
                            if (pmd) console.log(`[liveEventUpdater] ignoring event for room ${key} as it doesnt exist here`);
                            continue;
                        } 

                        // reload into local tracking
                        if (!activeRoomTimes.hasOwnProperty(key)) {
                            if (pmd) console.log(`[liveEventUpdater] tracking as active room ${key} with dTag: ${dTag}`);
                            activeRoomTimes[key] = Math.floor(dtt);
                            activeRoomTimesAnnounced[key] = Math.floor(dtt);
                        } else {
                            // mark older as ended
                            dtt = dtt > activeRoomTimes[key] ? activeRoomTimes[key] : dtt;
                            if (pmd) console.log(`[liveEventUpdater] ending older event for room ${key} and dtt ${dtt} on ${relayUrl}`);
                            let userInfo = [];
                            if (pmd) console.log(`[liveEventUpdater] event to be replaced on ${relayUrl}`, JSON.stringify(oldLiveActivity));
                            let pla = await publishLiveActivity(key, dtt, roomInfo, userInfo, 'ended', [relayUrl]);
                        }
                    }
                }
            }
        }

    } catch(error) {
        console.log(`[liveEventUpdater] error on startup: ${error}`);
    }

    // start a background process
    setInterval(async () => {
        if (pmd) console.log(`[liveEventUpdater] Checking for live rooms`);

        try {
            // Increment this count number
            runCounter = runCounter + 1;

            let roomsWithUsers = [];

            // Same basic logic from room list router to get the potential rooms
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
                    if (pmd) console.log(`[liveEventUpdater] room is no longer live activity, or is private or closed`);
                    if (activeRoomTimes.hasOwnProperty(roomId)) {
                        let dttr = activeRoomTimes[roomId];
                        if (isPrivate) {
                            let pla = await publishLiveActivity(roomId, dttr, roomInfo, userInfo, 'ended', undefined);
                        } else if (isClosed) {
                            let pla = await publishLiveActivity(roomId, dttr, roomInfo, userInfo, 'ended', undefined);
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
                    // Publish as live only on specific frequency
                    if ((runCounter % liveActivitiesUpdateInterval == 1) || (isnew)) {
                        if (pmd) console.log(`[liveEventUpdater] about to ${(isnew ? 'create new' : 'update')} live activity for ${roomId}`);
                        let pla = await publishLiveActivity(roomId, dttr, roomInfo, userInfo, 'live', undefined);
                    }
                }

                if (!isPrivate && !isClosed) {
                    // Announce as kind 1 event via main server bot if new, or its been more than an hour since last announce
                    if (pmd) console.log(`[liveEventUpdater] checking if need to publish room ${roomId} as active`);
                    if (activeRoomTimesAnnounced.hasOwnProperty(roomId)) announceit = (activeRoomTimesAnnounced[roomId] < three_hours_ago);
                    if (announceit) {
                        activeRoomTimesAnnounced[roomId] = dtt;
                        if (pmd) console.log(`[liveEventUpdater] publishing ${roomId} as active in kind 1 note`);
                        let pk1 = await publishRoomActive(roomId, dttr, roomInfo, userInfo, isnew);
                    } else {
                        if (pmd) console.log(`[liveEventUpdater] skipping announcement for ${roomId}, was previously published at ${activeRoomTimesAnnounced[roomId]}`);
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
                        if (pmd) console.log(`[liveEventUpdater] ending live activity for ${key}`);
                        let pla = await publishLiveActivity(key, dtt, roomInfo, userInfo, 'ended', undefined);
                    })();
                }
            })
            for (let k of activeRoomsToRemove) {
                delete activeRoomTimes[k];
            }

            // save activeRooms live activity tracking state (so we can reload on restarts)
            const ok = await set('server/liveActivities', activeRoomTimes);

        } catch(error) {
            console.log(`[liveEventUpdater] error checking for live rooms: ${error}`);
        }

    }, CHECK_INTERVAL);
};

module.exports = {liveEventUpdater};
