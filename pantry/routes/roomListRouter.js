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
        let userInfo = [];
        //if(userCount > 0) {
        //    userInfo = await Promise.all(peerIds.map(id => get(`identities/${id}`)));
        //}
        if(userCount > 0) {
            let roomInfo = await get(roomKeys[i]);
            rooms.push({"roomId":roomId,"name":roomInfo.name,"description":roomInfo.description,"logoURI":roomInfo.logoURI,"userCount":userCount,"userInfo":userInfo});
        }
    };
    res.send(rooms);
});
