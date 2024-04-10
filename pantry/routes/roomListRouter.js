const express = require('express');
const {get,list} = require('../services/redis');
const {activeUsersInRoom} = require('../services/ws');

const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
    res.type('application/json');

    let rooms = [];    
    let roomIds = [];
    // current hour
    let dt = new Date();
    let dti = dt.toISOString();
    let dts = dti.replaceAll('-','').replace('T','').slice(0,10);
    let k = `usagetracking/${dts}/`;
    let currentHourKeys = await list (k);
    for (let currentHourKey of currentHourKeys) {
        let roomId = currentHourKey.split('/').slice(-1)[0];
        roomIds.push(roomId);
    }
    // previous hour
    dt.setTime(dt.getTime() - (60 * 60 * 1000));
    dti = dt.toISOString();
    dts = dti.replaceAll('-','').replace('T','').slice(0,10);
    k = `usagetracking/${dts}/`;
    let previousHourKeys = await list (k);
    for (let previousHourKey of previousHourKeys) {
        let roomId = previousHourKey.split('/').slice(-1)[0];
        if (!roomIds.includes(roomId)) roomIds.push(roomId);
    }

    for(let roomId of roomIds) {
        let peerIds = await activeUsersInRoom(roomId);
        let userCount = peerIds.length;
        let userInfo = [];
        if(userCount > 0) {
           userInfo = await Promise.all(peerIds.map(id => get(`identities/${id}`)));
        }
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
