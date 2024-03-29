const express = require('express');
const {get,list} = require('../services/redis');
const {activeUsersInRoom} = require('../services/ws');

const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
    res.type('application/json');

    let dt = new Date();
    let dti = dt.toISOString();
    let dts = dti.replaceAll('-','').replace('T','').slice(0,10);
    let k = `usagetracking/${dts}/`;
    let activeRoomTrackingKeys = await list (k);
//    let roomKeys = await list('rooms/');
    let rooms = [];
    let privateRooms = await get('privaterooms');   // deprecated
    if (privateRooms == null) {
        privateRooms = [];
    }
    for(let activeRoomTrackingKey of activeRoomTrackingKeys) {
        let roomId = activeRoomTrackingKey.split('/').slice(-1)[0];
        if (privateRooms.includes(roomId)) {        // deprecated
            continue;
        }
        let peerIds = await activeUsersInRoom(roomId);
        let userCount = peerIds.length;
        let userInfo = [];
        //if(userCount > 0) {
        //    userInfo = await Promise.all(peerIds.map(id => get(`identities/${id}`)));
        //}
        if(userCount > 0) {
            let roomKey = "rooms/" + roomId;
            let roomInfo = await get(roomKey);
            let isClosed = roomInfo?.closed ?? false;
            let isPrivate = roomInfo?.isPrivate ?? false;
            if (isPrivate || isClosed) {
                continue;
            }
            rooms.push({"roomId":roomId,"name":roomInfo.name,"description":roomInfo.description,"logoURI":roomInfo.logoURI,"userCount":userCount,"userInfo":userInfo});
        }
    };
    res.send(rooms);
});

module.exports = router;
