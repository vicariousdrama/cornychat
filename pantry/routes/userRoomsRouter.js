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
            let isSpeaker = (roominfo.speakers ?? []).includes(userid);
            let isOwner = (roominfo.owners ?? []).includes(userid);
            let isModerator = (roominfo.moderators ?? []).includes(userid);
            if (!isSpeaker) isSpeaker = (roominfo.speakers ?? []).includes(usernpub);
            if (!isOwner) isOwner = (roominfo.owners ?? []).includes(usernpub);
            if (!isModerator) isModerator = (roominfo.moderators ?? []).includes(usernpub);
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
