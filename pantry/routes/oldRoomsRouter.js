const express = require('express');
const {get, set, del, list} = require('../services/redis');
const {isAdmin} = require('../auth');
const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
  res.type('application/json');

  // time constraint
  let now = Date.now();
  let d30 = 30 * 24 * 60 * 60 * 1000;
  let oldtime30 = now - d30; // 30 days ago
  let oldtime60 = now - d30 * 2; // 60 days ago
  let oldtime90 = now - d30 * 3; // 90 days ago

  // get protected rooms -- ones that we dont want to imply are old
  let pRooms = await get(`permanentRooms`);
  if (pRooms == undefined) pRooms = [];
  // get all rooms
  const kprefix = `rooms/*`;
  let rooms = await list(kprefix);
  let currentids = [];
  let oldids30 = [];
  let oldids60 = [];
  let oldids90 = [];
  let neveraccessed = []; // have no last-accessed records. this feature was implemented 20240606
  if (rooms.length > 0) {
    rooms.sort((a, b) => (a > b ? 1 : b > a ? -1 : 0));
    for (let roomkey of rooms) {
      let id = roomkey.split('/')[1];
      let lastAccessed = await get(`activity/${roomkey}/last-accessed`);
      if (lastAccessed == undefined) {
        if (pRooms.includes(id)) {
          currentids.push({id: id, lastAccessed: now});
        } else {
          neveraccessed.push(id);
        }
        continue;
      } else {
        if (pRooms.includes(id)) {
          currentids.push({id: id, lastAccessed: lastAccessed});
          continue;
        }
      }
      if (lastAccessed < oldtime90) {
        oldids90.push(id);
        continue;
      }
      if (lastAccessed < oldtime60) {
        oldids60.push(id);
        continue;
      }
      if (lastAccessed < oldtime30) {
        oldids30.push(id);
        continue;
      }
      currentids.push({id: id, lastAccessed: lastAccessed});
    }
  }

  // return results
  res.send({
    current: currentids,
    oldids30: oldids30,
    oldids60: oldids60,
    oldids90: oldids90,
    neveraccessed: neveraccessed,
  });
});

router.delete('', async function (req, res) {
  // Must be Admin
  if (!(await isAdmin(req))) {
    console.log(
      `[oldRoomsRouter] attempt to delete old rooms by a non admin. ssrIdentities is not in admin list`
    );
    console.log(JSON.stringify(req));
    res.sendStatus(403);
    return;
  }

  // time constraint
  let now = Date.now();
  let d30 = 30 * 24 * 60 * 60 * 1000;
  let oldtime90 = now - d30 * 3; // 90 days ago

  // get protected rooms -- ones that we dont want to imply are old
  let pRooms = await get(`permanentRooms`);
  if (pRooms == undefined) pRooms = [];

  // check all rooms
  let roomsDeleted = [];
  const kprefix = `rooms/*`;
  let rooms = await list(kprefix);
  if (rooms.length > 0) {
    rooms.sort((a, b) => (a > b ? 1 : b > a ? -1 : 0));
    for (let roomkey of rooms) {
      let id = roomkey.split('/')[1];
      if (pRooms.includes(id)) continue;
      let lastAccessed = await get(`activity/${roomkey}/last-accessed`);
      if (lastAccessed != undefined && lastAccessed > oldtime90) continue;
      // still here? get current room info
      let roomInfo = await get(roomkey);
      if (roomInfo) {
        // make a timestamped backup
        let backupKey = `deletedRooms-${now}/${id}`;
        console.log(`[oldRoomsRouter] backing up ${roomkey} to ${backupKey}`);
        await set(backupKey, roomInfo);
        // delete original
        console.log(`[oldRoomsRouter] deleting ${roomkey}`);
        await del(roomkey);
      }
      roomsDeleted.push(id);
    }
  }

  // if any were deleted, update userrooms cache if they referenced a deleted room
  if (roomsDeleted.length > 0) {
    const uprefix = `userrooms/*`;
    let userrooms = await list(uprefix);
    if (userrooms.length > 0) {
      for (let userroomskey of userrooms) {
        let userroomscache = await get(userroomskey);
        let urchanged = false;
        if (userroomscache.hasOwnProperty('r')) {
          let urok = [];
          for (let userroomscacheroom of userroomscache.r) {
            let deleteit = false;
            for (let deletedRoom of roomsDeleted) {
              if (deletedRoom == userroomscacheroom.roomId) {
                deleteit = true;
                urchanged = true;
                break;
              }
            }
            if (!deleteit) urok.push(userroomscacheroom);
          }
          if (urchanged) userroomscache.r = urok;
        }
        if (urchanged) {
          userroomscache.t = now;
          console.log(
            `[oldRoomsRouter] updating userrooms cache for ${userroomskey} to exclude recently deleted rooms`
          );
          await set(userroomskey, userroomscache);
        }
      }
    }
  }

  res.type('application/json');
  res.send({
    roomsDeleted: roomsDeleted,
  });
});

module.exports = router;
