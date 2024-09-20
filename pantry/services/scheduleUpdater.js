const {scheduledEventsUpdateInterval} = require('../config');
const {set} = require('./redis');
const {getScheduledEvents} = require('../nostr/nostr');
const SCHEDULED_CHECK_INTERVAL = scheduledEventsUpdateInterval * 60 * 1000;

const scheduleUpdater = async () => {

    console.log(`[scheduleUpdater] caching scheduled audiospace events from relays`);
    try {
        let scheduledEvents = await getScheduledEvents();
        if (scheduledEvents) {
            if (scheduledEvents.length > 0) {
                const ok = await set('server/scheduledEvents', scheduledEvents);
            }
            console.log(`[scheduleUpdater] ${scheduledEvents.length} scheduled events cached from relays`)
        } else {
            console.log(`[scheduleUpdater] no scheduled audiospace events found on relays`);
        }
    } catch (e) {
        console.log(`[scheduleUpdater] error caching initial scheduled events: ${e}`);
    }

    // start a background process for scheduled events rebuilding
    setInterval(async () => {
        console.log(`[scheduleUpdater] updating list of upcoming events`);
        try {
            let scheduledEvents = await getScheduledEvents();
            if (scheduledEvents) {
                if (scheduledEvents.length > 0) {
                    const ok = await set('server/scheduledEvents', scheduledEvents);
                }
                console.log(`[scheduleUpdater] ${scheduledEvents.length} scheduled events cached from relays`)
            } else {
                console.log(`[scheduleUpdater] no scheduled events found on relays`);
            }
        } catch (e) {
            console.log(`[scheduleUpdater] error updating caching of scheduled events: ${e}`);
        }
    
    }, SCHEDULED_CHECK_INTERVAL);
};

module.exports = {scheduleUpdater};
