const {jamHost, serverNsec} = require('../config');
const {get} = require('../services/redis');
const {nip19, getPublicKey, finalizeEvent} = require('nostr-tools');
const {RelayPool} = require('nostr-relaypool');

const pool = new RelayPool();
const relaysToUse = [
    'wss://nos.lol',
    'wss://relay.damus.io',
    'wss://nostr-pub.wellorder.net',
    'wss://nostr.mutinywallet.com',
    'wss://relay.snort.social',
    'wss://relay.primal.net',
];

function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}
  
const deleteNostrSchedule = async (roomId) => {
    const eventUUID = `cornychat-${roomId}`;
    const sk = nip19.decode(serverNsec).data;
    const pk = getPublicKey(sk);
    const aTagValue = `a:${pk}:${eventUUID}`;

    console.log(`updating event ${eventUUID} as no longer scheduled`)
    const cleanseEvent = finalizeEvent({
        created_at: Math.floor(Date.now() / 1000),
        kind: 31923,
        tags: [
            ["d", eventUUID],
            ["deleted", "deleted"],
            ["title", "Deleted Event"],
            ["start", `0`],
            ["end", `0`],
        ],
        content: 'This event is no longer scheduled',
    }, sk);
    pool.publish(cleanseEvent, relaysToUse);
    await sleep(100);
    console.log(`deleting event ${eventUUID}`)
    const deleteEvent = finalizeEvent({
        created_at: Math.floor(Date.now() / 1000),
        kind: 5,
        tags: [["a", aTagValue]],
        content: 'This event is no longer scheduled',
    }, sk);
    pool.publish(deleteEvent, relaysToUse);
}

const publishNostrSchedule = async (roomId, schedule, moderatorids, logoURI) => {

    // Validate
    console.log("Validating schedule to be posted");
    // - must have a schedule
    if (schedule == undefined) return;
    // - must have an npub
    if (schedule.setByNpub == undefined) return;
    if (schedule.setByNpub == '') return;

    console.log("Preparing schedule to publish for room", roomId);
    const scheduledByPubkey = nip19.decode(schedule.setByNpub).data;
    const eventUUID = `cornychat-${roomId}`;
    const roomUrl = `https://${jamHost}/${roomId}`;
    const title = schedule?.title ?? `Corny Chat: ${roomId}`;
    const content = (schedule?.summary ?? `This event is scheduled on Corny Chat in room: ${roomId}`) + `\n\n${roomUrl}`;
    const timezone = schedule?.timezone ?? 'Europe/London';
    const tags = [
        ["d", eventUUID],
        ["title", title],
        ["name", title],                         // deprecated, but Flockstr depends on
        ["start", `${schedule?.startUnixTime}`],
        ["end", `${schedule?.endUnixTime}`],
        ["start_tzid", timezone],
        ["end_tzid", timezone],
        ["location", roomUrl],
        ["about", content],                      // Undocumented Flockstr tag
        ["image", logoURI],                      // Undocumented Flockstr tag
        ["t", "cornychat"],
        ["t", "audiospace"],                     // Need to document all these tags for sanity
        ["r", roomUrl],
        ["p", scheduledByPubkey, "", "host"],
    ]
    const includedPubkeys = [scheduledByPubkey];
    for (let moderatorid of moderatorids) {
        const info = await get('identities/' + moderatorid);
        if (info?.identities) {
            for (let ident of info.identities) {
                if ('nostr' == (ident.type || '')) {
                    let modNpub = ident.id || '';
                    let modPubkey = nip19.decode(modNpub).data;
                    if (!includedPubkeys.includes(modPubkey)) {
                        includedPubkeys.push(modPubkey);
                        tags.push(["p",modPubkey,"","moderator"]);
                    }
                }
            }
        }
    }
    const sk = nip19.decode(serverNsec).data;
    const event = finalizeEvent({
        created_at: Math.floor(Date.now() / 1000),
        kind: 31923,
        tags: tags,
        content: content,
    }, sk);
    console.log('Event to be published', JSON.stringify(event));
    pool.publish(event, relaysToUse);
}

const getScheduledEvents = async () => {
    return new Promise(async (res, rej) => {
        try {
            // Look for any calendar time event with the tag 'audiospace' to be implementation agnostic
            // This allows other services like Nostr Nests to publish scheduled events if they want to
            // be included on the schedule
            //const filter = [{kinds: [31923], '#t':['audiospace']}]; 
            const filter = [{kinds: [5,31923]}];

            let events = [];
            let currentTime = Math.floor(Date.now() / 1000);
            let daySeconds = 86400; // 24 * 60 * 60
            let hourSeconds = 3600;
            let maxTime = currentTime + (7 * daySeconds);
            let waitForEvents = 2500; // 2.5 seconds
            let matchedEvents = [];

            setTimeout(() => {
                let deletedAudiospaces = [];
                // Build deleted event list. Some relays do not acknowledge delete types, and some do,
                // so we do a best effort to track deleted calendar events here
                for (let event of events) {
                    if (event.kind != 5) continue;
                    const eventTags = event.tags;
                    for (let eventTag of eventTags) {
                        if (eventTag.length < 2) continue;
                        if (eventTag[0] == 'a') {
                            let v = eventTag[1];
                            if (!v.startsWith('31923:')) continue;
                            let deletedTime = event.created_at;
                            let aTagParts = v.split(':');
                            if (aTagParts.length != 3) continue;
                            deletedAudiospaces.push({deleted: deletedTime, a: v, kind: 31923, pubkey: aTagParts[1], d: aTagParts[2]});
                        }
                    }
                }
                // Build events within range, that aren't deleted
                for (let event of events) {
                    if (event.kind != 31923) continue;
                    const eventTags = event.tags;                    
                    let isDeleted = false;
                    let endTime = undefined;
                    let image = 'https://cornychat.com/img/cornychat-app-icon.jpg';
                    let location = undefined;
                    let startTime = undefined;
                    let title = undefined;
                    let isAudioSpace = false;
                    let dTag = undefined;
                    for (let eventTag of eventTags) {
                        if (eventTag.length < 2) continue;
                        if (eventTag[0] == 'end') {
                            try {
                                endTime = parseInt(eventTag[1]);
                            } catch(error) { continue; }
                        }
                        if (eventTag[0] == 'start') {
                            try {
                                startTime = parseInt(eventTag[1]);
                            } catch(error) {
                                continue;
                            }
                        }
                        if (eventTag[0] == 't' && eventTag[1] == 'audiospace') { isAudioSpace = true; }
                        if (eventTag[0] == 'location')  { location = eventTag[1]; }
                        if (eventTag[0] == 'title')     { title = eventTag[1]; }
                        if (eventTag[0] == 'image')     { image = eventTag[1]; }
                        if (eventTag[0] == 'deleted')   { isDeleted = true; }
                        if (eventTag[0] == 'd')         { dTag = eventTag[1]; }
                    }
                    // Check for deleted
                    if (!dTag) continue;
                    for (let das of deletedAudiospaces) {
                        if (das.deletedTime < event.created_at) continue; // deleted before creation is ok
                        if (das.kind != event.kind) continue; // must be same kind to be deleted
                        if (das.pubkey != event.pubkey) continue; // must be same user to be deleted
                        if (das.d == dTag) isDeleted = true;
                    }
                    if (isDeleted) {
                        console.log('skipping event that was deleted');
                        continue;
                    }
                    // Reject based on erroneous time
                    if (startTime == undefined) continue;               // must have a time
                    if (endTime == undefined) continue;                 // must have a time
                    if (startTime > endTime) continue;                  // must begin before ending
                    if (endTime - startTime > daySeconds) continue;     // exclude events lasting more than 1 day
                    if ((startTime < currentTime) && (endTime + hourSeconds < currentTime)) continue;
                    if (startTime > maxTime) continue;                  // must start within 1 week
                    // check for required fields
                    if (!isAudioSpace) continue;
                    if (!(title && location && startTime && endTime)) {
                        console.log('skipping event that is missing one of title, location, startTime, endTime');
                        continue;
                    }
                    console.log(`adding a matched event: ${title} (${location} starting ${startTime})`);
                    // all good to include
                    let matchedEvent = {
                        startTime,
                        endTime,
                        image,
                        location,
                        title,
                    }
                    matchedEvents.push(matchedEvent);
                }

                // sort by the startTime so sooner/current ones are first
                if (matchedEvents.length > 0) {
                    matchedEvents.sort((a,b) => (a.startTime > b.startTime) ? 1 : ((b.startTime > a.startTime) ? -1 : 0));
                }

                // return it
                res(matchedEvents);

            }, waitForEvents);

            pool.subscribe(
                filter,
                relaysToUse,
                (event, onEose, url) => {
                    events.push(event);
                },
                undefined,
                undefined,
                {
                    unsubscribeOnEose: true,
                    allowDuplicateEvents: false,
                    allowOlderEvents: false,
                }
            );
        } catch (error) {
            rej(undefined);
            console.log('There was an error while fetching scheduled events: ', error);
        }
    });
}

module.exports = {
    deleteNostrSchedule,
    getScheduledEvents,
    publishNostrSchedule,
};
