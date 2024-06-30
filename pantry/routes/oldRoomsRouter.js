const express = require('express');
const {get,set,del,list} = require('../services/redis');
const router = express.Router({mergeParams: true});
  

router.get('', async function (req, res) {
    res.type('application/json');

    // time constraint
    let oldtime = 30 * 24 * 60 * 60 * 1000; // 30 days ago

    // get all rooms
    const kprefix = `rooms/*`;
    let rooms = await list(kprefix);
    let oldrooms = [];
    let neveraccessed = []; // have no last-accessed records. this feature was implemented 20260606
    if (rooms.length > 0) {
        rooms.sort((a,b) => (a > b) ? 1 : ((b > a) ? -1 : 0));
        for (let roomkey of rooms) {
            let roomId = roomkey.split('/')[1];
            let lastAccessed = await get (`activity/${roomkey}/last-accessed`);
            if (lastAccessed == undefined) {
                neveraccessed.push(roomId);
                continue;
            }
            if (lastAccessed < oldtime) {
                oldrooms.push(roomId);
                continue;
            }
        }
    }

    // return results
    res.send({
        oldrooms: oldrooms,
        neveraccessed: neveraccessed
    });
});

module.exports = router;
