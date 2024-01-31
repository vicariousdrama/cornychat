const express = require('express');
const {get,list} = require('../services/redis');
const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
    res.type('application/json');
    let events = [];
    let staticEvents = await get('staticevents');
    if(staticEvents != null) {
        for(let i = 0; i < staticEvents.length; i++) {
            let eventId = staticEvents[i].eventId;
            let roomId = staticEvents[i].roomId;
            let buttonUrl = staticEvents[i].buttonUrl;
            let humanTime = staticEvents[i].humanTime;
            let humanName = staticEvents[i].humanName;
            let enabled = staticEvents[i].enabled ?? true;
            if (!enabled) {
                continue;
            }
            events.push({"eventId":eventId,"roomId":roomId,"buttonUrl":buttonUrl,"humanTime":humanTime,"humanName":humanName});
        };
    }
    res.send(events);
});

module.exports = router;
