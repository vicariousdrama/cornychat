const express = require('express');
const {get,list} = require('../services/redis');

const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
    res.type('application/json');

    const userid = req.params.id ?? '';
    if (userid.length == 0) {
        res.sendStatus(404);
        return;
    }
    let userrooms = [];
    let userinfo = await get(`identities/${userid}`);
    let usernpub = '';
    if (userinfo != undefined) {
        if (userinfo.identities != undefined) {
            if (userinfo.identities[0].id != undefined) {
                usernpub = userinfo.identities[0].id;
            }
        }
    }

    const kprefix = `rooms/*`;
    let rrcount = 0;
    let frcount = 0;
    let rooms = await list(kprefix);
    if (rooms.length > 0) {
        rooms.sort((a,b) => (a > b) ? 1 : ((b > a) ? -1 : 0));
        for (let roomkey of rooms) {
            let roominfo = await get(roomkey);
            let roomId = roomkey.split('/')[1];
            let n = roominfo.name ?? '';
            let isSpeaker = false;
            try {
                if (roominfo.speakers != undefined) {
                    isSpeaker = roominfo.speakers.includes(userid);
                    if (!isSpeaker && usernpub.length > 0) {
                        isSpeaker = roominfo.speakers.includes(usernpub);
                    }
                }
            } catch (error) {
                console.log(`Error reading speakers in room ${roomId}`);
            }
            let isModerator = false;
            try {
                if (roominfo.moderators != undefined) {
                    isModerator = roominfo.moderators.includes(userid);
                    if (!isModerator && usernpub.length > 0) {
                        isModerator = roominfo.moderators.includes(usernpub);
                    }
                }
            } catch (error) {
                console.log(`Error reading moderators in room ${roomId}`);
            }
            let isOwner = false;
            try {
                if (roominfo.owners != undefined) {
                    isOwner = roominfo.owners.includes(userid);
                    if (!isOwner && usernpub.length > 0) {
                        isOwner = roominfo.owners.includes(usernpub);
                    }
                }
            } catch (error) {
                console.log(`Error reading owners in room ${roomId}`);
            }
            if (isSpeaker || isOwner || isModerator) {
                userrooms.push({roomId:roomId,name:n,isOwner:isOwner,isSpeaker:isSpeaker,isModerator:isModerator});
                frcount += 1;
            }
            rrcount += 1;
            if ((rrcount % 50) == 0) {
                console.log(`reviewed ${rrcount} rooms, found ${frcount} so far for user ${userid} (npub: ${usernpub})`);
            }
        }
    }
    // todo: save to a key ? identities/:userid/rooms

    res.send(userrooms);
});

module.exports = router;
