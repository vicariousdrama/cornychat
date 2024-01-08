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
            events.push({"eventId":eventId,"roomId":roomId,"buttonUrl":buttonUrl});
        };
    }
    res.send(events);
});

module.exports = router;
