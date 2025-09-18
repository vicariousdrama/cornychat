const express = require('express');
const {get, set, del, list} = require('../services/redis');
const {activeUsersInRoom} = require('../services/ws');
const router = express.Router({mergeParams: true});
const pmd = true;

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
  return {newList: o, changed: b};
}

router.delete('/:userId/:roomId', async function (req, res) {
  res.type('application/json');
  const userId = req.params.userId;
  const roomId = req.params.roomId;
  // check permission
  if (!req.ssrIdentities.includes(req.params.userId)) {
    if (pmd)
      console.log(
        'ERROR: Request to remove user ',
        userId,
        ' from room ',
        roomId,
        ", but ssrIdentities didn't include userId"
      );
    res.sendStatus(403);
    return;
  }
  // get user info
  let usernpub = '';
  if (userId.length == 43) {
    let userinfo = await get(`identities/${userId}`);
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
  if (pmd)
    console.log(
      `[userRoomsRouter.delete] changed room: ${JSON.stringify(roominfo)}`
    );
  if (deleteRoom) {
    if (pmd)
      console.log(
        `[userRoomsRouter.delete] deleting room ${roomId} as there are no more owners or moderators after removing ${userId}`
      );
    await del(roomkey);
  } else if (updateRoom) {
    if (pmd)
      console.log(
        `[userRoomsRouter.delete] updating room ${roomId} with ${userId} removed`
      );
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
  let userroomskey = `userrooms/${userid}`;
  // check if cached
  let userroomscache = await get(userroomskey);
  if (userroomscache != undefined) {
    // check if valid cache -- only rebuild once every 5 minutes
    let five_minutes_ago = 5 * 60 * 1000;
    if (userroomscache.t > new Date().getTime() - five_minutes_ago) {
      if (userroomscache.r) {
        res.send(userroomscache.r);
        return;
      }
    }
  }
  let st = new Date().getTime();
  if (pmd)
    console.log(
      `[userRoomsRouter] start building cache of rooms for user (${userid}): ${st}`
    );
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

  let permanentRooms = await get('permanentRooms');
  if (permanentRooms == undefined) permanentRooms = [];
  let currentTime = Date.now();

  const kprefix = `rooms/*`;
  let rrcount = 0;
  let frcount = 0;
  let rooms = await list(kprefix);
  if (rooms.length > 0) {
    rooms.sort((a, b) => (a > b ? 1 : b > a ? -1 : 0));
    for (let roomkey of rooms) {
      let roominfo = await get(roomkey);
      if (roominfo == undefined) continue;
      let roomId = roomkey.split('/')[1];
      let isPermanent = permanentRooms.includes(roomId);
      let n = roominfo.name ?? '';
      let isSpeaker = false;
      let isSpeakerById = false;
      let isSpeakerByNpub = false;
      try {
        if (roominfo.speakers != undefined) {
          isSpeakerById = roominfo.speakers.includes(userid);
          isSpeakerByNpub =
            usernpub.length > 0 && roominfo.speakers.includes(usernpub);
          isSpeaker = isSpeakerById || isSpeakerByNpub;
        }
      } catch (error) {
        if (pmd)
          console.log(
            `[userRoomsRouter] error reading speakers in room ${roomId}: ${error}`
          );
      }
      let isModerator = false;
      let isModeratorById = false;
      let isModeratorByNpub = false;
      try {
        if (roominfo.moderators != undefined) {
          isModeratorById = roominfo.moderators.includes(userid);
          isModeratorByNpub =
            usernpub.length > 0 && roominfo.moderators.includes(usernpub);
          isModerator = isModeratorById || isModeratorByNpub;
        }
      } catch (error) {
        if (pmd)
          console.log(
            `[userRoomsRouter] error reading moderators in room ${roomId}: ${error}`
          );
      }
      let isOwner = false;
      let isOwnerById = false;
      let isOwnerByNpub = false;
      try {
        if (roominfo.owners != undefined) {
          isOwnerById = roominfo.owners.includes(userid);
          isOwnerByNpub =
            usernpub.length > 0 && roominfo.owners.includes(usernpub);
          isOwner = isOwnerById || isOwnerByNpub;
        }
      } catch (error) {
        if (pmd)
          console.log(
            `[userRoomsRouter] error reading owners in room ${roomId}: ${error}`
          );
      }
      if (isSpeaker || isOwner || isModerator) {
        if (pmd) {
          console.log(
            `[userRoomsRouter] adding room ${roomId} based on speaker (${isSpeakerById},${isSpeakerByNpub}), moderator (${isModeratorById},${isModeratorByNpub}), owner (${isOwnerById},${isOwnerByNpub}) for user ${userid} (npub: ${usernpub})`
          );
        }
        let peerIds = await activeUsersInRoom(roomId);
        let lastAccessed = await get(`activity/${roomkey}/last-accessed`);
        if (isPermanent) lastAccessed = currentTime; // force these rooms to the top
        userrooms.push({
          roomId: roomId,
          name: n,
          description: roominfo.description,
          logoURI: roominfo.logoURI,
          userCount: peerIds.length,
          isPrivate: roominfo.isPrivate,
          isProtected:
            (roominfo.isProtected || false) &&
            (roominfo.passphraseHash ?? '').length > 0,
          isOwner: isOwner,
          isSpeaker: isSpeaker,
          isModerator: isModerator,
          isPermanent: isPermanent,
          lastAccessed: lastAccessed || 0,
        });
        frcount += 1;
      }
      rrcount += 1;
      if (rrcount % 50 == 0) {
        if (pmd)
          console.log(
            `[userRoomsRouter] reviewed ${rrcount} rooms, found ${frcount} so far for user ${userid} (npub: ${usernpub}) ${new Date().getTime()}`
          );
      }
    }
  }
  console.log(
    `[userRoomsRouter] completed reviewing ${rrcount} rooms, found ${frcount} for user ${userid} (npub: ${usernpub}). applying sorting logic`
  );
  // Sort
  if (userrooms.length > 0) {
    // most recently accessed to the top
    userrooms.sort((a, b) =>
      a.lastAccessed < b.lastAccessed
        ? 1
        : b.lastAccessed < a.lastAccessed
        ? -1
        : 0
    );
    // rooms with active users to the top
    userrooms.sort((a, b) =>
      a.userCount < b.userCount ? 1 : b.userCount < a.userCount ? -1 : 0
    );
  }
  // Save results to a key
  await set(userroomskey, {t: new Date().getTime(), r: userrooms});
  let et = new Date().getTime();
  if (pmd)
    console.log(
      `[userRoomsRouter] ended building cache of rooms for user (${userid}): ${et} (${
        et - st
      } ms)`
    );

  res.send(userrooms);
});

module.exports = router;
