const express = require('express');
const {get,set,del,list} = require('../services/redis');
const {activeUsersInRoom} = require('../services/ws');
const router = express.Router({mergeParams: true});

function removeValues(o, v1, v2) {
    let b = false;
    if (o.includes(v1)) {
        o = o.filter(id => id !== v1);
        b = true;
    }
    if (o.includes(v2)) {
        o = o.filter(id => id !== v2);
        b = true;
    }
    return {newList:o, changed:b};
}

router.delete('/:userId/:roomId', async function (req, res) {
    res.type('application/json');
    const userId = req.params.userId;
    const roomId = req.params.roomId;
    // check permission
    if (!req.ssrIdentities.includes(req.params.userId)) {
        console.log("ERROR: Request to remove user ", userId, " from room ", roomId, ", but ssrIdentities didn't include userId");
        res.sendStatus(403);
        return;
    }
    // get user info
    let usernpub = "";
    if (userId.length == 43) {
        let userinfo = await get (`identities/${userId}`);
        if (userinfo != undefined) {
            if (userinfo.identities != undefined) {
                for (let identity of userinfo.identities) {
                    if (identity.type == undefined) continue;
                    if (identity.type != 'nostr') continue;
                    if (identity.id == undefined) continue;
                    usernpub = identity.id;
                    break;
                }
            }
        }
    }
    // check for room definition
    let roomkey = `rooms/${roomId}`;
    let roominfo = await get(roomkey);
    let deleteRoom = false;
    let updateRoom = false;
    if (roominfo == undefined) {
        res.sendStatus(404);
        return;
    }
    // remove from speaker array
    if (roominfo.speakers != undefined) {
        let r = removeValues(roominfo.speakers, userId, usernpub);
        if (r.changed) {
            roominfo.speakers = r.newList;
            updateRoom = true;
        }
    }
    // remove from moderator array
    if (roominfo.moderators != undefined) {
        let r = removeValues(roominfo.moderators, userId, usernpub);
        if (r.changed) {
            roominfo.moderators = r.newList;
            updateRoom = true;
        }
    }
    // remove from owner array
    if (roominfo.owners != undefined) {
        let r = removeValues(roominfo.owners, userId, usernpub);
        if (r.changed) {
            roominfo.owners = r.newList;
            updateRoom = true;
            // check if need to assign another owner
            if (roominfo.owners.length == 0) {
                if (roominfo.moderators.length > 0) {
                    roominfo.owners.push(roominfo.moderators[0]);
                } else {
                    // no moderators or owners. delete it
                    deleteRoom = true;
                }
            }
        }
    }
    // delete or update
    console.log(`Changed room: ${JSON.stringify(roominfo)}`);
    if (deleteRoom) {
        console.log(`Deleting room ${roomId} as there are no more owners or moderators after removing ${userId}`);
        await del(roomkey);
    } else if (updateRoom) {
        console.log(`Updating room ${roomId} with ${userId} removed`);
        roominfo.updateTime = Date.now();
        await set(roomkey, roominfo);
    }
    return true;
});

router.get('/:userId', async function (req, res) {
    res.type('application/json');

    const userid = req.params.userId ?? '';
    if (userid.length == 0) {
        res.sendStatus(404);
        return;
    }
    let userrooms = [];
    let userinfo = await get(`identities/${userid}`);
    let usernpub = '';
    if (userinfo != undefined) {
        if (userinfo.identities != undefined) {
            for (let userIdentity of userinfo.identities) {
                if (userIdentity.type == undefined) continue;
                if (userIdentity.type != 'nostr') continue;
                if (userIdentity.id == undefined) continue;
                usernpub = userIdentity.id;
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
                let peerIds = await activeUsersInRoom(roomId);
                userrooms.push({
                    roomId:roomId,
                    name:n,
                    description:roominfo.description,
                    logoURI:roominfo.logoURI,
                    userCount:peerIds.length,
                    isPrivate:roominfo.isPrivate,
                    isProtected:((roominfo.isProtected || false) && ((roominfo.passphraseHash ?? '').length > 0)),
                    isOwner:isOwner,
                    isSpeaker:isSpeaker,
                    isModerator:isModerator,
                });
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
