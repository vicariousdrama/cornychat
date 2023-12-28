const express = require('express');
const {get,list} = require('../services/redis');
const {activeUsersInRoom} = require('../services/ws');

const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
    res.type('application/json');
    let roomKeys = await list('rooms/');
    let rooms = [];
    let privateRooms = await get('privaterooms');
    if (privateRooms == null) {
        privateRooms = [];
    }
    for(let i = 0; i < roomKeys.length; i++) {
        let roomId = roomKeys[i].split('/')[1];
        if (privateRooms.includes(roomId)) {
            continue;
        }
        let peerIds = await activeUsersInRoom(roomId);
        let userCount = peerIds.length;
        if(userCount > 0) {
            let userInfo = await Promise.all(peerIds.map(id => get(`identities/${id}`)));
            rooms.push({"roomId":roomId,"userCount":userCount,"userInfo":userInfo});
        }
    };
    res.send(rooms);
});

module.exports = router;
