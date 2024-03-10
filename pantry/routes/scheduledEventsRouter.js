const express = require('express');
const {get} = require('../services/redis');
const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
    res.type('application/json');
    let scheduledEvents = await get('server/scheduledEvents');
    // each event in the array has these fields: startTime, endTime, image, location, title
    res.send(scheduledEvents || []);
});

module.exports = router;
