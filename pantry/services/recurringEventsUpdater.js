const {recurringEventsUpdateInterval} = require('../config');
const {del, get, set, list} = require('./redis');
const {publishNostrSchedule} = require('../nostr/nostr');
const RECURRING_CHECK_INTERVAL = recurringEventsUpdateInterval * 60 * 1000;

const recurringEventsUpdater = async () => {

    // start a background process for recurring events udpating
    setInterval(async () => {
        console.log(`[recurringEventsUpdater] checking rooms for scheduled events that are recurring`);
        let currentDate = Math.floor(Date.now() / 1000);
        let scheduledRoomKeys = undefined;
        try {
            scheduledRoomKeys = await list('scheduledRoom/*');
        } catch(error) {
            console.log(`[recurringEventsUpdater] error listing scheduledRoom/*: ${error}`);
        }
        if (scheduledRoomKeys) {
            for (let scheduledRoomInfoKey of scheduledRoomKeys) {
                try {
                    console.log(`[recurringEventsUpdater] checking info for ${scheduledRoomInfoKey}`);
                    let scheduledRoomInfo = await get(scheduledRoomInfoKey);
                    if (!scheduledRoomInfo) continue;
                    if (!scheduledRoomInfo.start) continue;
                    if (!scheduledRoomInfo.end) continue;
                    if (!scheduledRoomInfo.repeat) continue;
                    if (scheduledRoomInfo.repeat == 'none') continue;
                    if (scheduledRoomInfo.start > currentDate) continue;
                    if (scheduledRoomInfo.end > currentDate) continue;
                    if (scheduledRoomInfo.repeat != 'daily' && scheduledRoomInfo.repeat != 'weekly' && scheduledRoomInfo.repeat != 'monthly') continue;
                    // ok, we need to do an update, lets get current room info
                    let roomId = scheduledRoomInfoKey.split('/')[1];
                    let roomInfo = await get(`rooms/${roomId}`);
                    // If the room has no schedule, then delete the scheduled room info
                    if (!roomInfo.schedule) {
                        console.log(`[recurringEventsUpdater] room ${roomId} no longer has a schedule. removing key ${scheduledRoomInfoKey}`);
                        await del(scheduledRoomInfoKey);
                        continue;
                    }
                    // Calculate the next scheduled event
                    let newSchedule = {...roomInfo.schedule};
                    console.log(JSON.stringify(newSchedule));
                    let eventDuration = newSchedule.endUnixTime - newSchedule.startUnixTime;
                    if (newSchedule.repeat == 'never') {
                        console.log(`[recurringEventsUpdater] room ${roomId} scheduled event does not repeat. removing key ${scheduledRoomInfoKey}`);
                        await del(scheduledRoomInfoKey);
                        continue;
                    } else if (newSchedule.repeat == 'daily') {
                        while (newSchedule.startUnixTime < currentDate) newSchedule.startUnixTime += 86400;
                    } else if (newSchedule.repeat == 'weekly') {
                        while (newSchedule.startUnixTime < currentDate) newSchedule.startUnixTime += (7 * 86400);
                    } else if (newSchedule.repeat == 'biweekly') {
                        while (newSchedule.startUnixTime < currentDate) newSchedule.startUnixTime += (14 * 86400);
                    } else if (newSchedule.repeat == 'monthly') {
                        while (newSchedule.startUnixTime < currentDate) {
                            let d = new Date(newSchedule.startUnixTime * 1000);
                            let e = new Date(d.setMonth(d.getMonth() + 1));
                            newSchedule.startUnixTime = (e.getTime() / 1000);
                        }
                    } else if (newSchedule.repeat == 'yearly') {
                        while (newSchedule.startUnixTime < currentDate) {
                            let d = new Date(newSchedule.startUnixTime * 1000);
                            let e = new Date(d.setMonth(d.getMonth() + 12));
                            newSchedule.startUnixTime = (e.getTime() / 1000);
                        }
                    } else {
                        console.log(`[recurringEventsUpdater] room ${roomId} scheduled event repeat value is ${newSchedule.repeat}. There is no present support to set the new time.`);
                        continue;
                    }
                    let sdate = new Date(newSchedule.startUnixTime * 1000);
                    newSchedule.startdate = sdate.toISOString().split('T')[0];
                    newSchedule.starttime = sdate.toISOString().split('T')[1].substring(0,5);
                    newSchedule.endUnixTime = newSchedule.startUnixTime + eventDuration;
                    let edate = new Date(newSchedule.endUnixTime * 1000);
                    newSchedule.enddate = edate.toISOString().split('T')[0];
                    newSchedule.endtime = edate.toISOString().split('T')[1].substring(0,5);
                    // Make sure it changed
                    if (newSchedule.startUnixTime == roomInfo.schedule.startUnixTime) {
                        console.log(`[recurringEventsUpdater] room ${roomId} scheduled start date remains the same.`);
                        continue;
                    }
                    console.log(`[recurringEventsUpdater] ${newSchedule.repeat} scheduled event updated to new start time ${newSchedule.startUnixTime}`);
                    // Update the room
                    roomInfo.schedule = newSchedule;
                    let roomSaved = await set(`rooms/${roomId}`, roomInfo);
                    // Publish to nostr (and this will update the scheduledRoom/roomId key)
                    let newSchedulePublished = await publishNostrSchedule(roomId, newSchedule, roomInfo.moderators, roomInfo.logoURI);
                } catch (e) {
                    console.log(`[recurringEventsUpdater] error updating recurring scheduled event for ${scheduledRoomInfoKey}: ${e}`);
                }
            }
        }
    }, RECURRING_CHECK_INTERVAL);
};

module.exports = {
    recurringEventsUpdater,
};
