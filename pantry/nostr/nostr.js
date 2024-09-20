const {jamHost, serverNsec, relaysGeneral, relaysZapGoals} = require('../config');
const {get, set} = require('../services/redis');
const {nip19, getPublicKey, finalizeEvent, generateSecretKey, validateEvent, verifyEvent} = require('nostr-tools');
const {RelayPool} = require('nostr-relaypool');
const {rawTimeZones} = require('@vvo/tzdb');
const {grantPubkeyToRelays} = require('../relayacl/relayACL');

const pmd = true;
const poolOptions = {autoReconnect:true}
const writepool = new RelayPool(undefined,poolOptions);
const newpoolPerWrite = false;

const relaysToUse = relaysGeneral.split(',');

function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function getRelayPool() {
    return (newpoolPerWrite ? new RelayPool(undefined,poolOptions) : writepool);
}
function doneRelayPool(p) {
    if (newpoolPerWrite) p.close();
}
const publishEvent = async (pool,event,relays) => {
    if (pmd) console.log(`[publishEvent] publishing to relays ${JSON.stringify(relays)}\n${JSON.stringify(event)}`);
    let publishEventResults = await pool.publish(event, relays);
    if(pool.errorsAndNotices && pool.errorsAndNotices.length > 0) console.log(`[publishEvent] pool errors and notices: ${JSON.stringify(pool.errorsAndNotices)}`);
}

const deleteNostrSchedule = async (roomId, oldScheduledStart) => {
    try {
        if (serverNsec.length == 0) return;
        if (pmd) console.log("[deleteNostrSchedule] removing schedule for room ", roomId, ", old start: ", oldScheduledStart);
        const localwritepool = getRelayPool();
        let eventUUID = `${jamHost}-${roomId}`;
        if (oldScheduledStart) {
            eventUUID = `${eventUUID}-${oldScheduledStart}`;
        }
        const sk = nip19.decode(serverNsec).data;
        const pk = getPublicKey(sk);
        const kind = 31923;
        const aTagValue = `${kind}:${pk}:${eventUUID}`;
        const timestamp = Math.floor(Date.now() / 1000);
        console.log(`[deleteNostrSchedule] updating event ${aTagValue} of room ${roomId} as no longer scheduled`)
        const cleanseEvent = finalizeEvent({
            created_at: timestamp,
            kind: kind,
            tags: [
                ["d", eventUUID],
                ["L", "com.cornychat"],
                ["l", "deleted"],
                ["expiration", `${timestamp}`],
                ["title", "Deleted Event"],
                ["start", `0`],
                ["end", `0`],
            ],
            content: 'This event is no longer scheduled',
        }, sk);
        await publishEvent(localwritepool, cleanseEvent, relaysToUse);
        await sleep(100);

        console.log(`[deleteNostrSchedule] deleting event ${eventUUID}`)
        const deleteEvent = finalizeEvent({
            created_at: timestamp,
            kind: 5,
            tags: [["a", aTagValue]],
            content: 'This event is no longer scheduled',
        }, sk);
        await publishEvent(localwritepool, deleteEvent, relaysToUse);
        await sleep(100);

        // eject from server/scheduledEvents
        let ejectedEntry = await ejectServerSchedule({startTime: oldScheduledStart, location: `https://${jamHost}/${roomId}`});

        const kind1content = `The previously scheduled event for this audiospace room has been deleted.`;
        const kind1event = finalizeEvent({
            created_at: timestamp,
            kind: 1,
            tags: [],
            content: kind1content,
        }, sk);
        await publishEvent(localwritepool, kind1event, relaysToUse);
        await sleep(100);
        doneRelayPool(localwritepool);
    } catch(error) {
        console.log(`[deleteNostrSchedule] error: ${error}`);
    }
}

const getScheduledEvents = async () => {
    return new Promise(async (res, rej) => {
        const localpool = new RelayPool(undefined,poolOptions);
        try {
            // Look for any calendar time event with the tag 'audiospace' to be implementation agnostic
            // This allows other services like Nostr Nests to publish scheduled events if they want to
            // be included on the schedule
            //const filter = [{kinds: [31923], '#t':['audiospace']}]; 
            const timestamp = Math.floor(Date.now() / 1000);
            let calendarEvents = [];
            let daySeconds = 86400; // 24 * 60 * 60
            let hourSeconds = 3600;
            let maxTime = timestamp + (30 * daySeconds);
            let daysago30 = timestamp - (daySeconds * 30);
            let daysago1 = timestamp - (daySeconds * 1);
            let waitForEvents = 5000; // 5 seconds
            let matchedEvents = [];
            let deleteEvents = [];
            let liveActivitiesEvents = [];
            let scheduledEventLimit = 12;
            let audioSpaceCount = 0;
            const calendarFilter = [{kinds: [31923], limit: 5000, since: daysago30}];
            const deleteFilter = [{kinds: [5], limit: 5000, since: daysago30}];
            const liveactivitiesFilter = [{kinds: [30311], limit: 5000, since: daysago1}];

            setTimeout(() => {
                let deletedAudiospaces = [];
                // Build deleted event list. Some relays do not acknowledge delete types, and some do,
                // so we do a best effort to track deleted calendar events here
                for (let event of deleteEvents) {
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
                console.log('[getScheduledEvents] number of audiospace calendar events: ', calendarEvents.length);
                for (let event of calendarEvents) {
                    if (event.kind != 31923) continue;
                    const eventTags = event.tags;                    
                    let isDeleted = false;
                    let endTime = undefined;
                    let image = '/favicon.png';    // default image, TODO: externalize
                    let location = undefined;
                    let startTime = undefined;
                    let title = undefined;
                    let isAudioSpace = false;
                    let dTag = undefined;
                    for (let eventTag of eventTags) {
                        if (eventTag.length < 2) continue;
                        if (eventTag[0] == 'end' && eventTag[1].length > 0) {
                            try {
                                endTime = parseInt(eventTag[1]);
                            } catch(error) { continue; }
                        }
                        if (eventTag[0] == 'start' && eventTag[1].length > 0) {
                            try {
                                startTime = parseInt(eventTag[1]);
                            } catch(error) {
                                continue;
                            }
                        }
                        if (eventTag[0] == 't' && eventTag[1] == 'audiospace') { isAudioSpace = true; } // backwards compatible, can remove after 20240401
                        if (eventTag[0] == 'l' && eventTag[1] == 'audiospace') { isAudioSpace = true; }
                        if (eventTag[0] == 'location' && eventTag[1].length > 0)  { location = eventTag[1]; }
                        if (eventTag[0] == 'title' && eventTag[1].length > 0)     { title = eventTag[1]; }
                        if (eventTag[0] == 'image' && eventTag[1].length > 0)     { image = eventTag[1]; }
                        if (eventTag[0] == 'deleted' && eventTag[1].length > 0)   { isDeleted = true; } // backwards compatible, can remove after 20240401
                        if (eventTag[0] == 'expiration' && eventTag[1].length > 0) {
                            try {
                                let expirationTime = parseInt(eventTag[1]);
                                if (expirationTime < timestamp) {
                                    isDeleted = ture;
                                }
                            } catch(error) { continue; }
                        }
                        if (eventTag[0] == 'd' && eventTag[1].length > 0)         { dTag = eventTag[1]; }
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
                        //console.log('[getScheduledEvents] skipping event that was deleted');
                        continue;
                    }
                    // Reject based on erroneous time
                    if (startTime == undefined) {
                        if (pmd) console.log('[getScheduledEvents] skipping event that has no start time');
                        continue;               // must have a time
                    }
                    if (endTime == undefined) {
                        if (pmd) console.log('[getScheduledEvents] skipping event that has no end time');
                        continue;                 // must have a time
                    }
                    if (startTime > endTime) {
                        if (pmd) console.log('[getScheduledEvents] skipping event that starts after it ends');
                        continue;                  // must begin before ending
                    }
                    if (endTime - startTime > daySeconds) {
                        if (pmd) console.log('[getScheduledEvents] skipping event that lasts more than 1 day')
                        continue;     // exclude events lasting more than 1 day
                    }
                    if ((startTime < timestamp) && (endTime + hourSeconds < timestamp)) {
                        //console.log('[getScheduledEvents] skipping event that has ended more than an hour ago');
                        continue;
                    }
                    if (startTime > maxTime) {
                        if (pmd) console.log('[getScheduledEvents] skipping event that starts more than a week from now');
                        continue;                  // must start within 1 week
                    }
                    // check for required fields
                    if (!isAudioSpace) {
                        continue;
                    }
                    if (!(title && location && startTime && endTime)) {
                        if (pmd) console.log('[getScheduledEvents] skipping event that is missing one of title, location, startTime, endTime');
                        continue;
                    }
                    console.log(`[getScheduledEvents] adding a scheduled event: ${title} (${location} starting ${startTime})`);
                    // all good to include
                    let matchedEvent = {
                        startTime,
                        endTime,
                        image,
                        location,
                        title,
                    }
                    audioSpaceCount += 1;
                    matchedEvents.push(matchedEvent);
                }

                // sort by the startTime so sooner/current ones are first
                if (matchedEvents.length > 0) {
                    matchedEvents.sort((a,b) => (a.startTime > b.startTime) ? 1 : ((b.startTime > a.startTime) ? -1 : 0));
                }

                // if we have less than scheduledEventLimit events, bring in other types from live activities
                if (matchedEvents.length < scheduledEventLimit) {
                    console.log("[getScheduledEvents] checking live activities for planned events");
                    let plannedActivities = [];
                    for (let event of liveActivitiesEvents) {
                        if (event.kind != 30311) continue;
                        const eventTags = event.tags;
                        let isDeleted = false;
                        let endTime = undefined;
                        let image = undefined;
                        let location = undefined;
                        let startTime = undefined;
                        let title = undefined;
                        let dTag = undefined;
                        let service = undefined;
                        let status = undefined;
                        for (let eventTag of eventTags) {
                            if (eventTag.length < 2) continue;
                            if (eventTag[0] == 'service' && eventTag[1].length > 0) {
                                service = eventTag[1];
                            }
                            if (eventTag[0] == 'starts' && eventTag[1].length > 0) {
                                try {
                                    startTime = parseInt(eventTag[1]);
                                    //endTime = startTime + (hourSeconds * 2); // assume 2 hour length
                                    endTime = timestamp + (hourSeconds * 2); // assume it ends in 2 hours unless denoted otherwise
                                } catch(error) {
                                    continue;
                                }
                            }
                            if (eventTag[0] == 'ends' && eventTag[1].length > 0) {
                                try {
                                    endTime = parseInt(eventTag[1]);
                                } catch(error) {
                                    continue;
                                }
                            }
                            if (eventTag[0] == 'streaming' && eventTag[1].length > 0) {
                                if (eventTag[1].startsWith('https://')) {
                                    location = eventTag[1]; 
                                }
                            }
                            if (eventTag[0] == 'title' && eventTag[1].length > 0)     { title = eventTag[1]; }
                            if (eventTag[0] == 'image' && eventTag[1].length > 0)     { image = eventTag[1]; }
                            if (eventTag[0] == 'deleted' && eventTag[1].length > 0)   { isDeleted = true; }
                            if (eventTag[0] == 'd' && eventTag[1].length > 0)         { dTag = eventTag[1]; }
                            if (eventTag[0] == 'status' && eventTag[1].length > 0)    { status = eventTag[1]; }
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
                            //console.log(`[getScheduledEvents] skipping activity ${dTag} that was deleted`);
                            continue;
                        }
                        // Check for ended
                        if (status && status == 'ended') {
                            continue;
                        }
                        // Must have service tag
                        if (service == undefined) {
                            //console.log(`[getScheduledEvents] skipping activity ${dTag} that has no service`);
                            continue;
                        }
                        // SPECIAL FIX FOR NOSTRNESTS: Set location if service is nostrnests
                        if (service == 'https://nostrnests.com') {
                            //location = `https://nostrnests.com/api/v1/live/${dTag}/live.m3u8`;
                            if (image == undefined) {
                                image = 'https://nostrnests.com/favicon.png';
                            }
                            let nostrnestsRelays = [ 'wss://relay.snort.social/', 'wss://nos.lol/', 'wss://relay.damus.io/', 'wss://nostr.land/' ];
                            let naddr1 = nip19.naddrEncode({identifier:dTag,pubkey:event.pubkey,kind:event.kind,relays:nostrnestsRelays});
                            location = `https://nostrnests.com/${naddr1}`;
                        }
                        // SPECIAL FIX FOR ZAP.STREAM: Set location if service is zap.stream
                        if (service == 'https://api.zap.stream/api/nostr') {
                            //location = `https://data.zap.stream/stream/${dTag}.m3u8`;
                            if (image == undefined) {
                                image = 'https://zap.stream/logo.png';
                            }
                            let naddr1 = nip19.naddrEncode({identifier:dTag,pubkey:event.pubkey,kind:event.kind});
                            location = `https://zap.stream/${naddr1}`;
                        }
                        // Set image to default if not yet set
                        if (image == undefined) {
                            image = `${service}/favicon.png`;
                        }
                        // Reject based on erroneous time
                        if (startTime == undefined) {
                            //console.log(`[getScheduledEvents] skipping event ${dTag} that has no start time`);
                            continue;               // must have a time
                        }
                        if (endTime == undefined) {
                            //console.log(`[getScheduledEvents] skipping event ${dTag} that has no end time`);
                            continue;                 // must have a time
                        }
                        if (startTime > endTime) {
                            //console.log(`[getScheduledEvents] skipping event ${dTag} that starts after it ends`);
                            continue;                  // must begin before ending
                        }
                        if (endTime - startTime > daySeconds) {
                            //console.log(`[getScheduledEvents] skipping event ${dTag} that lasts more than 1 day`);
                            continue;     // exclude events lasting more than 1 day
                        }
                        if ((startTime < timestamp) && (endTime + hourSeconds < timestamp)) {
                            //console.log(`skipping event ${dTag} that has ended more than an hour ago`);
                            continue;
                        }
                        if (startTime > maxTime) {
                            //console.log(`[getScheduledEvents] skipping event ${dTag} that starts more than a week from now`);
                            continue;                  // must start within 1 week
                        }
                        // check for required fields
                        if (!(title && location && startTime && endTime)) {
                            //console.log(`[getScheduledEvents] skipping event ${dTag} that is missing one of title, location, startTime, endTime`);
                            continue;
                        }
                        console.log(`[getScheduledEvents] adding a live activity event: ${title} (${location} starting ${startTime})`);
                        // all good to include
                        let plannedActivity = {
                            startTime,
                            endTime,
                            image,
                            location,
                            title,
                        }
                        plannedActivities.push(plannedActivity);
                    }
                    
                    plannedActivities.sort((a,b) => (a.startTime > b.startTime) ? 1 : ((b.startTime > a.startTime) ? -1 : 0));
                    for(let sortedActivity of plannedActivities) {
                        if (matchedEvents.length < scheduledEventLimit) {
                            matchedEvents.push(sortedActivity);
                        } else {
                            break;
                        }
                    }
                    matchedEvents.sort((a,b) => (a.startTime > b.startTime) ? 1 : ((b.startTime > a.startTime) ? -1 : 0));
                }
                localpool.close();

                // remove multiple (subsequent) entries with same location
                let filteredEvents = filterEventsByLocation(matchedEvents);

                // return it
                res(filteredEvents);

            }, waitForEvents);

            let options = {unsubscribeOnEose: true, allowDuplicateEvents: false, allowOlderEvents: false};
            localpool.subscribe(calendarFilter, relaysToUse, (event, onEose, url) => {calendarEvents.push(event)}, undefined, undefined, options);
            localpool.subscribe(deleteFilter, relaysToUse, (event, onEose, url) => {deleteEvents.push(event)}, undefined, undefined, options);
            localpool.subscribe(liveactivitiesFilter, relaysToUse, (event, onEose, url) => {liveActivitiesEvents.push(event)}, undefined, undefined, options);
        } catch (error) {
            localpool.close();
            rej(undefined);
            console.log('[getScheduledEvents] There was an error while fetching scheduled events: ', error);
        }
    });
}

const publishNostrSchedule = async (roomId, schedule, moderatorids, logoURI) => {
    // Validate
    // - must have a schedule
    if (schedule == undefined) return;
    // - must have an npub
    if (!schedule.setByNpub || schedule.setByNpub == '' || schedule.setByNpub.length != 63) return;

    console.log("[publishNostrSchedule] Preparing schedule to publish for room", roomId);
    const localwritepool = getRelayPool();
    const scheduledByPubkey = nip19.decode(schedule.setByNpub).data;
    const eventUUID = `${jamHost}-${roomId}-${schedule?.startUnixTime}`;
    const roomUrl = `https://${jamHost}/${roomId}`;
    const title = schedule?.title ?? `Corny Chat: ${roomId}`;
    const content = (schedule?.summary ?? `This event is scheduled on Corny Chat in room: ${roomId}`) + `\n\n${roomUrl}`;
    const timezone = schedule?.timezone ?? 'Europe/London';
    const labelNamespace = "com.cornychat";      // Other instances SHOULD NOT change this
    const tags = [
        ["d", eventUUID],
        ["title", title],
        ["name", title],                         // deprecated, but Flockstr depends on
        ["start", `${schedule?.startUnixTime}`],
        ["end", `${schedule?.endUnixTime}`],
        ["start_tzid", timezone],
        ["end_tzid", timezone],
        ["location", roomUrl],
//        ["about", content],                      // Undocumented Flockstr tag (remove once Flockstr is updated)
        ["summary", content],                    // short description of event, replaces deprecated/undocumented Flockstr tag about
        ["image", logoURI],                      // Undocumented Flockstr tag
        ["L", labelNamespace],                   // Need to document all these tags for sanity
        ["l", jamHost, labelNamespace],
        ["l", "audiospace", labelNamespace],
        ["r", roomUrl],
        ["p", scheduledByPubkey, "", "host"],
    ]
    const includedPubkeys = [scheduledByPubkey];
    for (let moderatorid of moderatorids) {
        const info = await get('identities/' + moderatorid);
        if (info?.identities) {
            for (let ident of info.identities) {
                if ('nostr' == (ident.type || '')) {
                    try {
                        let modNpub = ident.id || '';
                        let modPubkey = nip19.decode(modNpub).data;
                        if (!includedPubkeys.includes(modPubkey)) {
                            includedPubkeys.push(modPubkey);
                            tags.push(["p",modPubkey,"","moderator"]);
                        }
                    } catch(err) { /*ignore*/ }
                }
            }
        }
    }
    if (serverNsec.length > 0) {
        const sk = nip19.decode(serverNsec).data;
        const event = finalizeEvent({
            created_at: Math.floor(Date.now() / 1000),
            kind: 31923,
            tags: tags,
            content: content,
        }, sk);
        await publishEvent(localwritepool, event, relaysToUse);
        await sleep(100);
    }

    // capture the scheduling as active
    let scheduledRoomSet = await set(`scheduledRoom/${roomId}`, {repeat: schedule.repeat, start: schedule?.startUnixTime, end: schedule?.endUnixTime});
    // inject into server/scheduledEvents
    let injectedSchedule = await injectServerSchedule({startTime: schedule?.startUnixTime, endTime: schedule?.endUnixTime, image: logoURI, location: roomUrl, title: title});

    console.log("[publishNostrSchedule] Preparing kind 1 to publish event from room");
    let roomNsec = await getRoomNSEC(roomId, true);
    let roomSk = nip19.decode(roomNsec).data;
    let timeZoneName = "Europe/London"; // Intl.DateTimeFormat().resolvedOptions().timeZone; // Europe/London
    let timeZoneOffset = 0;
    let timeZoneAbbrev = 'UTC';
    for(let r =0; r < rawTimeZones.length; r++) {
        if(rawTimeZones[r].name == timeZoneName) {
            timeZoneOffset = rawTimeZones[r].rawOffsetInMinutes * -60;
            timeZoneAbbrev = rawTimeZones[r].abbreviation;
        }
    }
    let edate = new Date(schedule?.startUnixTime * 1000);
    let dateOptions = { weekday: 'long', month: 'long', day: 'numeric' }; 
    let humanDate = new Intl.DateTimeFormat('en-us',dateOptions).format(edate);
    let timeOptions = { timeStyle: 'short'};
    let humanTime = new Intl.DateTimeFormat('en-us',timeOptions).format(edate);
    let summary = schedule?.summary ?? '';
    const kind1content = `The next scheduled event for this audiospace room is on ${humanDate} at ${humanTime} (${timeZoneAbbrev})\n\n${title}\n\n${summary}\n\nin\n${roomUrl}`;
    const kind1event = finalizeEvent({
        created_at: Math.floor(Date.now() / 1000),
        kind: 1,
        tags: [
            ["L", labelNamespace],
            ["l", jamHost, labelNamespace],
            ["l", "audiospace", labelNamespace],
            ["r", roomUrl],
            ["t", "audiospace"],
        ],
        content: kind1content,
    }, roomSk);
    await publishEvent(localwritepool, kind1event, relaysToUse);
    await sleep(100);
    doneRelayPool(localwritepool);
}

const injectServerSchedule = async(eventInfo) => {
    // Injects an event into the server scheduled events immediately instead of waiting for the background rebuild process
    try {
        let key = 'server/scheduledEvents'
        let serverEvents = await get(key);
        serverEvents.push(eventInfo);
        let newServerEvents = filterEventsByLocation(serverEvents);
        await set(key, newServerEvents);
        return true;
    } catch(error) {
        console.log(`[injectServerSchedule] error: ${error}`);
        return false;
    }
}
const ejectServerSchedule = async(eventInfo) => {
    // Ejects an event from server scheduled events immediately instead of waiting for the background rebuild process
    // - requires location and startTime
    let removed = false;
    try {
        let key = 'server/scheduledEvents'
        let serverEvents = await get(key);
        let newServerEvents = [];
        for (let serverEvent of serverEvents) {
            if(serverEvent.location == eventInfo.location && serverEvent.startTime == eventInfo.startTime) {
                removed = true;
                continue;
            }
            newServerEvents.push(serverEvent);
        }
        newServerEvents = filterEventsByLocation(newServerEvents);
        await set(key, newServerEvents);
    } catch(error) {
        console.log(`[ejectServerSchedule] error: ${error}`);
    }
    return removed;
}

const filterEventsByLocation = (events) => {
    let seenLocations = [];
    let filteredEvents = [];
    events.sort((a,b) => (a.startTime > b.startTime) ? 1 : ((b.startTime > a.startTime) ? -1 : 0));
    for (let event of events) {
        let startDayNumber = Math.floor(event.startTime / 86400);
        let seenLocation = `${event.location}-${startDayNumber}`;
        if (seenLocations.includes(seenLocation)) {
            console.log(`[filterEventsByLocation] filtering matched event with same location: ${event.title} (${event.location} starting ${event.startTime})`);
            continue;
        }
        filteredEvents.push(event);
        seenLocations.push(seenLocation);
    }
    filteredEvents.sort((a,b) => (a.startTime > b.startTime) ? 1 : ((b.startTime > a.startTime) ? -1 : 0));
    return filteredEvents;
}

const getRoomNSEC = async(roomId, create=false) => {
    let nostrroomkey = 'nostrroomkey/' + roomId;
    let roomNsec = await get(nostrroomkey);
    if (create && (roomNsec == undefined || roomNsec == null)) {
        let roomSk = generateSecretKey();
        roomNsec = nip19.nsecEncode(roomSk);
        await set(nostrroomkey, roomNsec);
    }
    return roomNsec;
}

const updateNostrProfile = async (roomId, name, description, logoURI, backgroundURI, lud16) => {
    if (pmd) console.log("[updateNostrProfile] Updating room profile");
    const localwritepool = getRelayPool();
    let roomNsec = await getRoomNSEC(roomId, true);
    let roomSk = nip19.decode(roomNsec).data;
    let profileObj = {nip05: `${roomId}-room@${jamHost}`}
    if ((name ?? '').length > 0) profileObj.name = name;
    if ((description ?? '').length > 0) profileObj.about = description;
    if ((logoURI ?? '').length > 0) profileObj.picture = logoURI;
    if ((backgroundURI ?? '').length > 0) profileObj.banner = backgroundURI;
    if ((lud16 ?? '').length > 0) profileObj.lud16 = lud16;
    let content = JSON.stringify(profileObj);
    const event = finalizeEvent({
        created_at: Math.floor(Date.now() / 1000),
        kind: 0,
        tags: [],
        content: content,
    }, roomSk);

    await publishEvent(localwritepool, event, relaysToUse);
    await sleep(100);
    doneRelayPool(localwritepool);
}

const updateNostrProfileForServer = async (name, description, logoURI, backgroundURI, lud16, nip05) => {
    if (serverNsec.length == 0) return;
    if (pmd) console.log("[updateNostrProfileForServer] Updating server profile from env");
    const localwritepool = getRelayPool();
    const sk = nip19.decode(serverNsec).data;
    let profileObj = {nip05: nip05}
    if ((name ?? '').length > 0) profileObj.name = name;
    if ((description ?? '').length > 0) profileObj.about = description;
    if ((logoURI ?? '').length > 0) profileObj.picture = logoURI;
    if ((backgroundURI ?? '').length > 0) profileObj.banner = backgroundURI;
    if ((lud16 ?? '').length > 0) profileObj.lud16 = lud16;
    let content = JSON.stringify(profileObj);
    const event = finalizeEvent({
        created_at: Math.floor(Date.now() / 1000),
        kind: 0,
        tags: [],
        content: content,
    }, sk);
    await publishEvent(localwritepool, event, relaysToUse);
    await sleep(100);
    doneRelayPool(localwritepool);
}

const deleteLiveActivity = async (roomId, dtt, eventId) => {
    if (pmd) console.log("[deleteLiveActivity] deleting known activity for room ", roomId);
    const localwritepool = getRelayPool();
    let roomNsec = await getRoomNSEC(roomId, true);
    let roomSk = nip19.decode(roomNsec).data;
    const kind = 30311;
    const eventUUID = `${dtt}`;
    const pk = getPublicKey(roomSk);
    const grantReason = `${jamHost} room: ${roomId}`;
    let g = await grantPubkeyToRelays(false, pk, grantReason);
    const aTagValue = `${kind}:${pk}:${eventUUID}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const deleteEvent = finalizeEvent({
        created_at: timestamp,
        kind: 5,
        tags: [["a", aTagValue],["e", eventId],["k",`${kind}`]],
        content: 'This event is no longer active',
    }, roomSk);
    await publishEvent(localwritepool, deleteEvent, relaysToUse);
    await sleep(250);
    doneRelayPool(localwritepool);
}

const getLiveActivities = async() => {
    if (pmd) console.log("[getLiveActivities] retrieving live activities");
    return new Promise(async (res, rej) => {
        const localpool = new RelayPool(undefined,poolOptions);
        try {
            let goalFilter = [{kinds:[30311], limit: 5000}];
            goalFilter[0]["#L"] = ["com.cornychat"]
            goalFilter[0]["#l"] = [jamHost]
            let waitForEvents = 3000; // 3 seconds
            let matchedRelayEvents = {};
            let options = {unsubscribeOnEose: true, allowDuplicateEvents: false, allowOlderEvents: false};
            setTimeout(() => {
                localpool.close();
                res(matchedRelayEvents);
            }, waitForEvents);
            localpool.subscribe(goalFilter, relaysToUse, (event, onEose, url) => {
                if (!matchedRelayEvents.hasOwnProperty(url)) {
                    matchedRelayEvents[url] = [];
                }
                matchedRelayEvents[url].push(event);
            }, undefined, undefined, options);
        } catch (error) {
            localpool.close();
            rej(undefined);
            console.log('[getLiveActivities] error while fetching live activities: ', error);
        }
    });
}

const publishLiveActivity = async (roomId, dtt, roomInfo, userInfo, status, limitToRelays) => {
    //if (pmd) console.log("in publishLiveActivity for ", roomId);
    const localwritepool = getRelayPool();
    let roomNsec = await getRoomNSEC(roomId, true);
    let roomSk = nip19.decode(roomNsec).data;
    let dt = new Date();
    let et = dt.getTime();
    if (status == 'live') et = et + (60 * 60 * 1000);       // 1 hour from now
    const kind = 30311;
    const eventUUID = `${dtt}`;
    const pk = getPublicKey(roomSk);
    const grantReason = `${jamHost} room: ${roomId}`;
    let g = await grantPubkeyToRelays(false, pk, grantReason);
    const aTagValue = `${kind}:${pk}:${dtt}`;
    const roomUrl = `https://${jamHost}/${roomId}`;
    const title = roomInfo?.name ?? `Corny Chat: ${roomId}`;
    const summary = (roomInfo?.description ?? `This is a live event on Corny Chat in room: ${roomId}`);
    // the image is either the logouri, or the current slide. if no image, then use a default
    let defaultImage = `https://${jamHost}/img/cornychat-defaultroomlogo.png`;
    let imageURI = roomInfo?.logoURI ?? defaultImage;
    if (roomInfo?.currentSlide) {
        if (Math.floor(roomInfo.currentSlide) > 0) {
            let cs = roomInfo.currentSlide;
            if (roomInfo?.slides?.length >= cs) {
                let slideURI = roomInfo.slides[cs - 1][0];
                if (slideURI.startsWith("https://")) imageURI = slideURI;
            }
        }
    }
    if (imageURI.length == 0) imageURI = defaultImage;
    if (!imageURI.startsWith('https://')) imageURI = defaultImage;
    const labelNamespace = "com.cornychat";                 // Other instances SHOULD NOT change this
    let tags = [
        ["d", `${eventUUID}`],
        ["title", `${title}`],
        ["summary", `${summary}`],
        ["image", `${imageURI}`],                           // uses slide if active, else logo, else default image
        ["service", roomUrl],
        ["streaming", `${roomUrl}`],
        ["starts", `${Math.floor(dtt / 1000)}`],            // starts and ends needs to be in seconds, not milliseconds
        ["ends", `${Math.floor(et / 1000)}`],
        ["status", `${status}`],
        ["current_participants", `${userInfo.length}`],     // TODO: set "total_participants", need to track it in liveeventUpdater
        ["t", "talk"],
        ["t", "talk show"],
        ["L", labelNamespace],                              // Need to document all these tags for sanity
        ["l", jamHost, labelNamespace],
        ["l", "audiospace", labelNamespace],
        ["r", roomUrl],
        ["relays", ...relaysToUse],
    ];
    // This doesnt add tags for anonymous users since they don't have npubs
    const includedPubkeys = [];
    for (let user of userInfo) {
        if (user.identities == undefined) continue;
        for (let ident of user.identities) {
            if (ident.type == undefined) continue;
            if (ident.type != 'nostr') continue;
            if (ident.id == undefined) continue;
            let userNpub = ident.id || '';
            let userPubkey = nip19.decode(userNpub).data;
            if (!includedPubkeys.includes(userPubkey)) {
                includedPubkeys.push(userPubkey);
                let roleName = "Participant";
                if (roomInfo.speakers.includes(user.id)) roleName = "Speaker";
                if (roomInfo.speakers.includes(userNpub)) roleName = "Speaker";
                if (roomInfo.moderators.includes(user.id)) roleName = "Moderator";
                if (roomInfo.moderators.includes(userNpub)) roleName = "Moderator";
                if (roomInfo.owners.includes(user.id)) roleName = "Room Owner";
                if (roomInfo.owners.includes(userNpub)) roleName = "Room Owner";
                tags.push(["p", userPubkey, "", roleName]);
            }
        }
    }
    let event = finalizeEvent({
        created_at: Math.floor(Date.now() / 1000),
        kind: kind,
        tags: tags,
        content: "",
    }, roomSk);
    if (pmd) console.log('[publishLiveActivity] event to be published', JSON.stringify(event));
    let publishToRelays = ((limitToRelays != undefined) ? limitToRelays : relaysToUse);
    if (pmd) console.log('[publishLiveActivity] to relays', JSON.stringify(publishToRelays));
    await publishEvent(localwritepool, event, publishToRelays);
    await sleep(1250);
    doneRelayPool(localwritepool);
}

const publishRoomActive = async (roomId, dtt, roomInfo, userInfo, isnew) => {
    if (serverNsec.length == 0) return;
    if (pmd) console.log("[publishRoomActive] publishing room with live activity for ", roomId);
    const localwritepool = getRelayPool();
    const kind = 1;
    const roomUrl = `https://${jamHost}/${roomId}`;
    const leadingText = `TALK TO LIVE NOSTRICHES NOW! \n 🚨Check out the open chat rooms on Cornychat.com 🚨\n https://${jamHost}/img/cornychat-letschat.png`;
    const trailingText = `#plebchain #audiospace #grownostr`;
    const sk = nip19.decode(serverNsec).data;
    const pk = getPublicKey(sk);
    const npub = nip19.npubEncode(pk);
    if (pmd) console.log(`[publishRoomActive] publishing with ${npub}`);
    const dt = new Date();
    const et = dt.getTime();
    const ct = Math.floor(dt/1000);
    const userCount = userInfo.length;
    let output = "";
    if (isnew) {
        output = `🌽 Audio Space started! 🌽\n\n${roomId}\n\n${roomUrl}?t=${ct}`;
    } else {
        output = `🌽 Join ${userCount} others chatting! 🌽\n\n${roomId}\n\n${roomUrl}?t=${ct}`;
    }
    output += `\n\n#cornychat #audiospace #grownostr`;
    const title = roomInfo?.name ?? `Corny Chat: ${roomId}`;
    const summary = (roomInfo?.description ?? `This is a live event on Corny Chat in room: ${roomId}`);
    // the image is either the logouri, or the current slide. if no image, then use a default
    let defaultImage = `https://${jamHost}/img/cornychat-defaultroomlogo.png`;
    let imageURI = roomInfo?.logoURI ?? defaultImage;
    if (roomInfo?.currentSlide) {
        if (Math.floor(roomInfo.currentSlide) > 0) {
            let cs = roomInfo.currentSlide;
            if (roomInfo?.slides?.length >= cs) {
                let slideURI = roomInfo.slides[cs - 1][0];
                if (slideURI.startsWith("https://")) imageURI = slideURI;
            }
        }
    }
    if (imageURI.length == 0) imageURI = defaultImage;
    if (!imageURI.startsWith('https://')) imageURI = defaultImage;
    const labelNamespace = "com.cornychat";                 // Other instances SHOULD NOT change this
    const tags = [
        ["audioserver", jamHost],
        ["title", `${title}`],
        ["summary", `${summary}`],
        ["image", `${imageURI}`],                           // uses slide if active, else logo, else default image
        ["service", roomUrl],
        ["streaming", `${roomUrl}`],
        ["starts", `${Math.floor(dtt / 1000)}`],            // starts and ends needs to be in seconds, not milliseconds
        ["ends", `${Math.floor(et / 1000)}`],
        ["current_participants", `${userCount}`],           // TODO: set "total_participants", need to track it in liveeventUpdater
        ["t", "talk"],
        ["t", "talk show"],
        ["t", "cornychat"],
        ["t", "audiospace"],
        ["t", "grownostr"],
        ["L", labelNamespace],                              // Need to document all these tags for sanity
        ["l", jamHost, labelNamespace],
        ["l", "audiospace", labelNamespace],
        ["r", roomUrl],
    ];

    const event = finalizeEvent({
        created_at: Math.floor(Date.now() / 1000),
        kind: kind,
        tags: tags,
        content: output,
    }, sk);
    await publishEvent(localwritepool, event, relaysToUse);
    await sleep(250);

    // have the server announce a live text message associated to the room's live activity if its new
    if (isnew) {
        let roomNsec = await getRoomNSEC(roomId, true);
        let roomSk = nip19.decode(roomNsec).data;
        const roomPk = getPublicKey(roomSk);
        output = `🌽 Audio Space started! 🌽\n\nJoin the audio feed at ${roomUrl}\n\nIndividual participants can choose whether their text chat is sent to this live feed.`;
        const liveTextKind = 1311;
        const liveTextATag = `30311:${roomPk}:${dtt}`;
        const liveTextTags = [
            ["a", liveTextATag],
            ["L", labelNamespace],                              // Need to document all these tags for sanity
            ["l", jamHost, labelNamespace],    
        ];
        const liveTextEvent = finalizeEvent({
            created_at: Math.floor(Date.now() / 1000),
            kind: liveTextKind,
            tags: liveTextTags,
            content: output,
        }, sk);
        await publishEvent(localwritepool, liveTextEvent, relaysToUse);
        await sleep(250);
    }
    doneRelayPool(localwritepool);
}

const getZapGoals = async (pubkey) => {
    console.log('[getZapGoals] retrieving zap goals for pubkey: ', pubkey);
    return new Promise(async (res, rej) => {
        const localpool = new RelayPool(undefined,poolOptions);
        try {
            let goalFilter = [{kinds:[9041], authors: [pubkey], limit: 50}];
            let waitForEvents = 3000; // 3 seconds
            let matchedEvents = [];
            let options = {unsubscribeOnEose: true, allowDuplicateEvents: false, allowOlderEvents: false};
            setTimeout(() => {
                localpool.close();
                res(matchedEvents);
            }, waitForEvents);
            localpool.subscribe(goalFilter, relaysToUse, (event, onEose, url) => {matchedEvents.push(event)}, undefined, undefined, options);
        } catch (error) {
            localpool.close();
            rej(undefined);
            console.log('[getZapGoals] error while fetching zap goals: ', error);
        }
    });
}

const publishZapGoal = async (sk, content, amount, relays) => {
    console.log('[publishZapGoal] publishing new zap goal');
    return new Promise(async (res, rej) => {
        const localwritepool = getRelayPool();
        let pk = getPublicKey(sk);
        const kind = 9041;
        let amountTag = ["amount", String(amount * 1000)];
        let relayTag = ["relays", ...relays];
        let tags = [amountTag, relayTag];
        const event = finalizeEvent({
            created_at: Math.floor(Date.now() / 1000),
            kind: kind,
            tags: tags,
            content: content,
        }, sk);
        await publishEvent(localwritepool, event, relaysToUse);
        await sleep(250);
        doneRelayPool(localwritepool);
        res(event);
    });
}

const deleteOldZapGoals = async (sk) => {
    if (pmd) console.log("[deleteOldZapGoals] removing older zap goals");
    const localwritepool = getRelayPool();
    let pk = getPublicKey(sk);
    const timestamp = Math.floor(Date.now() / 1000);
    const event = {
        created_at: timestamp,
        kind: 5,
        tags: [],
        content: 'these posts were published by accident',
    }
    let zapgoals = [];
    try {
        zapgoals = await getZapGoals(pk);
    } catch(e) {
        console.log(`[deleteOldZapGoals] error fetching zap goals: ${e}`);        
    }
    let newestGoal = {created_at: 0}
    for (let zapgoal of zapgoals) {
        if (zapgoal.created_at > newestGoal.created_at) {
            newestGoal = zapgoal;
        }
    }
    for (let zapgoal of zapgoals) {
        if (zapgoal.id != newestGoal.id) {
            event.tags.push(["e", zapgoal.id]);
        }
    }
    let el = event.tags.length;
    if (el > 0) {
        if (pmd) console.log(`[deleteOldZapGoals] requesting deletion of ${el} zap goal events`);
        event.tags.push(["k", "9041"]);
        const deleteEvent = finalizeEvent(event, sk);
        await publishEvent(localwritepool, deleteEvent, relaysToUse);
        await sleep(250);
    } else {
        if (pmd) console.log(`[deleteOldZapGoals] no zap goal events need to be deleted`);
    }
    doneRelayPool(localwritepool);
}

const isValidLoginSignature = function(id,pubkey,created_at,content,sig) {
    let e = {id:id,pubkey:pubkey,created_at:created_at,kind:1,tags:[],content:content,sig:sig};
    let u = validateEvent(e);
    let v = verifyEvent(e);
    r = (u && v);
    if (!r) {
        e = {id:id,pubkey:pubkey,created_at:created_at,kind:1,tags:[[]],content:content,sig:sig};
        u = validateEvent(e);
        v = verifyEvent(e);
        r = (u && v);
    }
    return r;
}

async function getNpubs(identityKeys) {
    let npubs = [];
    for (let identityKey of identityKeys) {
        try {
            const identityInfo = await get('identities/' + identityKey);
            if (!identityInfo) continue;
            if (!identityInfo.identities) continue;
            for (let ident of identityInfo.identities) {
                if (!ident.type) continue;
                if (!ident.id) continue;
                if (!ident.loginTime) continue;
                if (!ident.loginId) continue;
                if (!ident.loginSig) continue;
                if (ident.type != 'nostr') continue;
                let n = ident.id || '';
                let c = ident.loginTime || 0;
                let i = ident.loginId || '';
                let s = ident.loginSig || '';
                let p = nip19.decode(n).data;
                let r = isValidLoginSignature(i,p,c,identityKey,s);
                if (r) npubs.push(n);
            }
        } catch (error) {
        console.log('[getNpubs] error in getNpubs conversion for identity: ', identityKey, error);
        }
    }
    return npubs;
}

module.exports = {
    deleteNostrSchedule,
    getRoomNSEC,
    getScheduledEvents,
    publishNostrSchedule,
    updateNostrProfile,
    updateNostrProfileForServer,
    deleteLiveActivity,
    getLiveActivities,
    publishLiveActivity,
    publishRoomActive,
    getZapGoals,
    publishZapGoal,
    deleteOldZapGoals,
    isValidLoginSignature,
    getNpubs,
};
