const express = require('express');
const {get,list} = require('../services/redis');
const {activeUsersInRoom} = require('../services/ws');

const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
    res.type('application/json');
    let rooms = [];
    let staticRooms = await get('staticrooms');
    if(staticRooms != null) {
        for(let i = 0; i < staticRooms.length; i++) {
            let roomId = staticRooms[i];
            let peerIds = await activeUsersInRoom(roomId);
            let userCount = peerIds.length;
            let userInfo = [];
            if(userCount > 0) {
                userInfo = await Promise.all(peerIds.map(id => get(`identities/${id}`)));
            }
            rooms.push({"roomId":roomId,"userCount":userCount,"userInfo":userInfo});
        };
    }
    res.send(rooms);
});

module.exports = router;
