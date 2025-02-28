const express = require('express');
const {get, set} = require('../services/redis');
const {isAdmin} = require('../auth');

const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
  res.type('application/json');
  let rooms = [];
  let permanentRooms = await get('permanentRooms');
  if (permanentRooms != null) rooms = permanentRooms;
  res.send(rooms);
});

router.post('/:roomId', async function (req, res) {
  // Must be Admin
  if (!(await isAdmin(req))) {
    console.log(
      `[permanentRoomsRouter] attempt to add permanent room by a non admin. ssrIdentities is not in admin list`
    );
    console.log(JSON.stringify(req));
    res.sendStatus(403);
    return;
  }
  // Get and validate roomId
  const roomId = req.params.roomId ?? '';
  // Bad Request if not properly formed
  if (roomId.length == 0) {
    res.sendStatus(400);
    return;
  }
  // Gone if the room does not exist
  let roomInfo = await get(`rooms/${roomId}`);
  if (roomInfo == undefined) {
    res.sendStatus(410);
    return;
  }
  // Get current permanent rooms
  let permanentRooms = await get('permanentRooms');
  if (permanentRooms == null) permanentRooms = [];
  // Add if not already in the list
  let added = false;
  if (!permanentRooms.includes(roomId)) {
    permanentRooms.push(roomId);
    await set('permanentRooms', permanentRooms);
    added = true;
  }
  // return results
  res.type('application/json');
  res.send({
    added: added,
    permanentRooms: permanentRooms,
  });
});

router.delete('/:roomId', async function (req, res) {
  // Must be Admin
  if (!(await isAdmin(req))) {
    console.log(
      `[permanentRoomsRouter] attempt to delete permanent room by a non admin. ssrIdentities is not in admin list`
    );
    console.log(JSON.stringify(req));
    res.sendStatus(403);
    return;
  }
  // Get and validate roomId
  const roomId = req.params.roomId ?? '';
  // Bad Request if not properly formed
  if (roomId.length == 0) {
    res.sendStatus(400);
    return;
  }
  // Gone if there are no permanent rooms
  let permanentRooms = await get('permanentRooms');
  if (permanentRooms == null) {
    res.sendStatus(410);
    return;
  }
  // Not found if roomId not in the list
  if (!permanentRooms.includes(roomId)) {
    res.sendStatus(404);
    return;
  }
  // If got this far, then can remove from the list
  let newPermanentRooms = [];
  for (let pr of permanentRooms) {
    if (pr == roomId) continue;
    newPermanentRooms.push(pr);
  }
  await set('permanentRooms', newPermanentRooms);
  // return results
  res.type('application/json');
  res.send({
    removed: roomId,
    permanentRooms: newPermanentRooms,
  });
});

module.exports = router;
