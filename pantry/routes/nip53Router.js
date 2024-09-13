const express = require('express');
const {get} = require('../services/redis');
const {getRoomNSEC} = require('../nostr/nostr');
const { nip19, getPublicKey } = require('nostr-tools');
const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
    let roomId = req.params.id;
    // lookup public key for room
    let roomNsec = await getRoomNSEC(roomId, true);
    let roomSk = nip19.decode(roomNsec).data;
    const pk = getPublicKey(roomSk);
    // lookup current d identifier for room
    let activeRoomTimes = await get('server/liveActivities');
    let aTag = "";
    if (activeRoomTimes.hasOwnProperty(roomId)) {
        let dtt = activeRoomTimes[roomId];
        aTag= `30311:${pk}:${dtt}`;
    }
    res.send([aTag]);
    return;
});

module.exports = router;
