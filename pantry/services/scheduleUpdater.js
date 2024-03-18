const {set} = require('./redis');
const {getScheduledEvents} = require('../nostr/nostr');
const UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes

const scheduleUpdater = async () => {

    console.log(`Caching scheduled audiospace events from relays`);
    let scheduledEvents = await getScheduledEvents();
    if (scheduledEvents) {
        if (scheduledEvents.length > 0) {
            const ok = await set('server/scheduledEvents', scheduledEvents);
        }
        console.log(`Scheduled events cached from relays`)
    } else {
        console.log(`No scheduled audiospace events found on relays`);
    }

    // start a background process
    setInterval(async () => {
        console.log(`Updating list of upcoming audiospace events`);
        let scheduledEvents = await getScheduledEvents();
        if (scheduledEvents) {
            if (scheduledEvents.length > 0) {
                const ok = await set('server/scheduledEvents', scheduledEvents);
            }
            console.log(`Scheduled events cached from relays`)
        } else {
            console.log(`No scheduled audiospace events found on relays`);
        }
    }, UPDATE_INTERVAL);
};

module.exports = {scheduleUpdater};
