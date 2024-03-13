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

const deleteNostrSchedule = async (roomId) => {
    const eventUUID = `cornychat-${roomId}`;
    const sk = nip19.decode(serverNsec).data;
    const pk = getPublicKey(sk);
    const aTagValue = `a:${pk}:${eventUUID}`;

    const event = finalizeEvent({
        created_at: Math.floor(Date.now() / 1000),
        kind: 5,
        tags: [["a", aTagValue]],
        content: 'This event is no longer scheduled',
    }, sk);

    pool.publish(event, relaysToUse);
}

const publishNostrSchedule = async (roomId, schedule, moderatorids, logoURI) => {

    // Validate
    console.log("Validating schedule to be posted");
    // - must have a schedule
    if (schedule == undefined) return;
    // - must have an npub
    if (schedule.setByNpub == undefined) return;
    if (schedule.setByNpub == '') return;

    console.log("We have a schedule to publish for room", roomId);
    const scheduledByPubkey = nip19.decode(schedule.setByNpub).data;
    console.log("a");
    const eventUUID = `cornychat-${roomId}`;
    console.log("b");
    const roomUrl = `https://${jamHost}/${roomId}`;
    console.log("c");
    const title = schedule?.title ?? `Corny Chat: ${roomId}`;
    console.log("d");
    const content = (schedule?.summary ?? `This event is scheduled on Corny Chat in room: ${roomId}`) + `\n\n${roomUrl}`;
    console.log("e");
    const timezone = schedule?.timezone ?? 'Europe/London';
    console.log("Processing tags");
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
        ["t", "audiospace"],
        ["r", roomUrl],
        ["p", scheduledByPubkey, "", "host"],
    ]
    console.log("f");
    const includedPubkeys = [scheduledByPubkey];
    console.log("Adding moderators");
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

    console.log("Signing event");
    const sk = nip19.decode(serverNsec).data;
    const event = finalizeEvent({
        created_at: Math.floor(Date.now() / 1000),
        kind: 31923,
        tags: tags,
        content: content,
    }, sk);

    console.log('event to be published', JSON.stringify(event));
    pool.publish(event, relaysToUse);
}

const getScheduledEvents = async () => {
    return new Promise(async (res, rej) => {
        try {
            // Look for any calendar time event with the tag 'audiospace' to be implementation agnostic
            // This allows other services like Nostr Nests to publish scheduled events if they want to
            // be included on the schedule
            //const filter = [{kinds: [31923], '#t':['audiospace']}]; 
            const filter = [{kinds: [31923]}];

            let events = [];
            let currentTime = Math.floor(Date.now() / 1000);
            let daySeconds = 86400; // 24 * 60 * 60
            let hourSeconds = 3600;
            let maxTime = currentTime + (7 * daySeconds);
            let waitForEvents = 2500; // 2.5 seconds
            let matchedEvents = [];

            setTimeout(() => {
                for (let event of events) {
                    const eventTags = event.tags;
                    let endTime = undefined;
                    let image = 'https://cornychat.com/img/cornychat-app-icon.jpg';
                    let location = undefined;
                    let startTime = undefined;
                    let title = undefined;
                    let isAudioSpace = false;
                    for (let eventTag of eventTags) {
                        if (eventTag.length < 2) {
                            continue;
                        }
                        if (eventTag[0] == 't') {
                            if (eventTag[1] == 'audiospace') {
                                isAudioSpace = true;
                            }
                        }
                        if (eventTag[0] == 'end') {
                            try {
                                endTime = parseInt(eventTag[1]);
                                if ((endTime + hourSeconds) < currentTime) {
                                    continue;
                                }
                            } catch(error) {
                                continue;
                            }
                        }
                        if (eventTag[0] == 'location') {
                            location = eventTag[1];
                        }
                        if (eventTag[0] == 'start') {
                            try {
                                startTime = parseInt(eventTag[1]);
                                if (startTime > maxTime) {
                                    continue;
                                }
                            } catch(error) {
                                continue;
                            }
                        }
                        if (eventTag[0] == 'title') {
                            title = eventTag[1];
                        }
                        if (eventTag[0] == 'image') {
                            image = eventTag[1];
                        }
                    }
                    if (!isAudioSpace) {
                        //console.log('skipping event that is not tagged as audiospace')
                        continue;
                    }
                    // Reject based on erroneous time
                    if (startTime > endTime) continue;
                    if (endTime - startTime > daySeconds) continue;
                    // check for required fields
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
