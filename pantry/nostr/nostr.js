const {jamHost, serverNsec} = require('../config');
const {get, set} = require('../services/redis');
const {nip19, getPublicKey, finalizeEvent, generateSecretKey} = require('nostr-tools');
const {SimplePool} = require('nostr-tools/pool');
const {RelayPool} = require('nostr-relaypool');
const {rawTimeZones} = require('@vvo/tzdb');

const pmd = true;
const writepool = new RelayPool();

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
    if(pmd) console.log("in deleteNostrSchedule");
    const eventUUID = `${jamHost}-${roomId}`;
    const sk = nip19.decode(serverNsec).data;
    const pk = getPublicKey(sk);
    const kind = 31923;
    const aTagValue = `${kind}:${pk}:${eventUUID}`;
    const timestamp = Math.floor(Date.now() / 1000);
    console.log(`updating event ${eventUUID} as no longer scheduled`)
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
    writepool.publish(cleanseEvent, relaysToUse);
    await sleep(100);

    console.log(`deleting event ${eventUUID}`)
    const deleteEvent = finalizeEvent({
        created_at: timestamp,
        kind: 5,
        tags: [["a", aTagValue]],
        content: 'This event is no longer scheduled',
    }, sk);
    writepool.publish(deleteEvent, relaysToUse);
    await sleep(100);

    const kind1content = `The previously scheduled event for this audiospace room has been deleted.`;
    const kind1event = finalizeEvent({
        created_at: timestamp,
        kind: 1,
        tags: [],
        content: kind1content,
    }, sk);
    writepool.publish(kind1event, relaysToUse);
    await sleep(100);
}

const getScheduledEvents = async () => {
    if(pmd) console.log("in getScheduledEvents");
    return new Promise(async (res, rej) => {
        const localpool = new RelayPool();
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
            let waitForEvents = 5000; // 5 seconds
            let matchedEvents = [];
            let deleteEvents = [];
            let liveActivitiesEvents = [];
            let scheduledEventLimit = 12;
            let audioSpaceCount = 0;
            const calendarFilter = [{kinds: [31923], limit: 5000, since: daysago30}];
            const deleteFilter = [{kinds: [5], limit: 5000, since: daysago30}];
            const liveactivitiesFilter = [{kinds: [30311], limit: 5000, since: daysago30}];

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
                console.log('number of audiospace calendar events: ', calendarEvents.length);
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
                        //console.log('skipping event that was deleted');
                        continue;
                    }
                    // Reject based on erroneous time
                    if (startTime == undefined) {
                        //console.log('skipping event that has no start time');
                        continue;               // must have a time
                    }
                    if (endTime == undefined) {
                        //console.log('skipping event that has no end time');
                        continue;                 // must have a time
                    }
                    if (startTime > endTime) {
                        //console.log('skipping event that starts after it ends');
                        continue;                  // must begin before ending
                    }
                    if (endTime - startTime > daySeconds) {
                        //console.log('skipping event that lasts more than 1 day')
                        continue;     // exclude events lasting more than 1 day
                    }
                    if ((startTime < timestamp) && (endTime + hourSeconds < timestamp)) {
                        //console.log('skipping event that has ended more than an hour ago');
                        continue;
                    }
                    if (startTime > maxTime) {
                        //console.log('skipping event that starts more than a week from now');
                        continue;                  // must start within 1 week
                    }
                    // check for required fields
                    if (!isAudioSpace) {
                        continue;
                    }
                    if (!(title && location && startTime && endTime)) {
                        //console.log('skipping event that is missing one of title, location, startTime, endTime');
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
                    audioSpaceCount += 1;
                    matchedEvents.push(matchedEvent);
                }

                // sort by the startTime so sooner/current ones are first
                if (matchedEvents.length > 0) {
                    matchedEvents.sort((a,b) => (a.startTime > b.startTime) ? 1 : ((b.startTime > a.startTime) ? -1 : 0));
                }

                // if we have less than scheduledEventLimit events, bring in other types from live activities
                if (matchedEvents.length < scheduledEventLimit) {
                    console.log("checking live activities for planned events");
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
                            console.log(`skipping activity ${dTag} that was deleted`);
                            continue;
                        }
                        // Must have service tag
                        if (service == undefined) {
                            console.log(`skipping activity ${dTag} that has no service`);
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
                            console.log(`skipping event ${dTag} that has no start time`);
                            continue;               // must have a time
                        }
                        if (endTime == undefined) {
                            console.log(`skipping event ${dTag} that has no end time`);
                            continue;                 // must have a time
                        }
                        if (startTime > endTime) {
                            console.log(`skipping event ${dTag} that starts after it ends`);
                            continue;                  // must begin before ending
                        }
                        if (endTime - startTime > daySeconds) {
                            console.log(`skipping event ${dTag} that lasts more than 1 day`);
                            continue;     // exclude events lasting more than 1 day
                        }
                        if ((startTime < timestamp) && (endTime + hourSeconds < timestamp)) {
                            console.log(`skipping event ${dTag} that has ended more than an hour ago`);
                            continue;
                        }
                        if (startTime > maxTime) {
                            console.log(`skipping event ${dTag} that starts more than a week from now`);
                            continue;                  // must start within 1 week
                        }
                        // check for required fields
                        if (!(title && location && startTime && endTime)) {
                            console.log(`skipping event ${dTag} that is missing one of title, location, startTime, endTime`);
                            continue;
                        }
                        console.log(`adding a matched event: ${title} (${location} starting ${startTime})`);
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
                // return it
                res(matchedEvents);

            }, waitForEvents);

            let options = {unsubscribeOnEose: true, allowDuplicateEvents: false, allowOlderEvents: false};
            localpool.subscribe(calendarFilter, relaysToUse, (event, onEose, url) => {calendarEvents.push(event)}, undefined, undefined, options);
            localpool.subscribe(deleteFilter, relaysToUse, (event, onEose, url) => {deleteEvents.push(event)}, undefined, undefined, options);
            localpool.subscribe(liveactivitiesFilter, relaysToUse, (event, onEose, url) => {liveActivitiesEvents.push(event)}, undefined, undefined, options);
        } catch (error) {
            localpool.close();
            rej(undefined);
            console.log('There was an error while fetching scheduled events: ', error);
        }
    });
}

const publishNostrSchedule = async (roomId, schedule, moderatorids, logoURI) => {
    if(pmd) console.log("in publishNostrSchedule");
    // Validate
    console.log("Validating schedule to be posted");
    // - must have a schedule
    if (schedule == undefined) return;
    // - must have an npub
    if (schedule.setByNpub == undefined) return;
    if (schedule.setByNpub == '') return;

    console.log("Preparing schedule to publish for room", roomId);
    const scheduledByPubkey = nip19.decode(schedule.setByNpub).data;
    const eventUUID = `${jamHost}-${roomId}`;
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
        ["about", content],                      // Undocumented Flockstr tag
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
    if(pmd) console.log('Event to be published', JSON.stringify(event));
    writepool.publish(event, relaysToUse);
    await sleep(100);

    if(pmd) console.log("Preparing kind 1 to publish event from room");
    let roomNsec = await getRoomNSEC(roomId);
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
    if(pmd) console.log('Event to be published', JSON.stringify(kind1event));
    writepool.publish(kind1event, relaysToUse);
    await sleep(100);
}

const getRoomNSEC = async(roomId) => {
    if(pmd) console.log("in getRoomNSEC");
    let nostrroomkey = 'nostrroomkey/' + roomId;
    let roomNsec = await get(nostrroomkey);
    if (roomNsec == undefined || roomNsec == null) {
        let roomSk = generateSecretKey();
        roomNsec = nip19.nsecEncode(roomSk);
        await set(nostrroomkey, roomNsec);
    }
    return roomNsec;
}

const updateNostrProfile = async (roomId, name, description, logoURI, backgroundURI, lud16) => {
    if(pmd) console.log("in updateNostrProfile");
    let roomNsec = await getRoomNSEC(roomId);
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
    if(pmd) console.log('Event to be published', JSON.stringify(event));
    writepool.publish(event, relaysToUse);
    await sleep(100);
}

const deleteLiveActivity = async (roomId, dtt) => {
    if(pmd) console.log("in deleteLiveActivity for ", roomId);
    let roomNsec = await getRoomNSEC(roomId);
    let roomSk = nip19.decode(roomNsec).data;
    const kind = 30311;
    const eventUUID = `${dtt}`;
    const sk = nip19.decode(serverNsec).data;
    const pk = getPublicKey(sk);
    const aTagValue = `${kind}:${pk}:${eventUUID}`;
    console.log(`deleting event ${eventUUID}`)
    const deleteEvent = finalizeEvent({
        created_at: timestamp,
        kind: 5,
        tags: [["a", aTagValue]],
        content: 'This event is no longer active',
    }, roomSk);
    if(pmd) console.log('Event to be published', JSON.stringify(deleteEvent));
    writepool.publish(deleteEvent, relaysToUse);
    await sleep(250);
}

const publishLiveActivity = async (roomId, dtt, roomInfo, userInfo, status) => {
    if(pmd) console.log("in publishLiveActivity for ", roomId);
    let roomNsec = await getRoomNSEC(roomId);
    let roomSk = nip19.decode(roomNsec).data;
    let dt = new Date();
    let et = dt.getTime();
    if (status == 'live') et = et + (60 * 60 * 1000);       // 1 hour from now
    const kind = 30311;
    const eventUUID = `${dtt}`;
    const sk = nip19.decode(serverNsec).data;
    const pk = getPublicKey(sk);
    const aTagValue = `${kind}:${pk}:${eventUUID}`;
    const roomUrl = `https://${jamHost}/${roomId}`;
    const title = roomInfo?.name ?? `Corny Chat: ${roomId}`;
    const summary = (roomInfo?.description ?? `This is a live event on Corny Chat in room: ${roomId}`);
    // the image is either the logouri, or the current slide. if no image, then use a default
    let defaultImage = 'https://i.nostr.build/o7jx.png'
    let imageURI = roomInfo?.logoURI ?? defaultImage;
    if (roomInfo?.currentSlide > 0) {
        let cs = roomInfo.currentSlide;
        if (roomInfo?.slides?.length >= cs) {
            let slideURI = roomInfo.slides[cs - 1][0];
            if (slideURI.startsWith("https://")) imageURI = slideURI;
        }
    }
    if (imageURI.length == 0) imageURI = defaultImage;
    if (!imageURI.startsWith('https://')) imageURI = defaultImage;
    const labelNamespace = "com.cornychat";                 // Other instances SHOULD NOT change this
    const tags = [
        ["d", `${eventUUID}`],
        ["title", `${title}`],
        ["summary", `${summary}`],
        ["image", `${imageURI}`],                           // uses slide if active, else logo, else default image
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
    ]
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
    const event = finalizeEvent({
        created_at: Math.floor(Date.now() / 1000),
        kind: kind,
        tags: tags,
        content: "",
    }, roomSk);
    if(pmd) console.log('Event to be published', JSON.stringify(event));
    writepool.publish(event, relaysToUse);
    await sleep(250);
}

module.exports = {
    deleteNostrSchedule,
    getRoomNSEC,
    getScheduledEvents,
    publishNostrSchedule,
    updateNostrProfile,
    deleteLiveActivity,
    publishLiveActivity,
};
