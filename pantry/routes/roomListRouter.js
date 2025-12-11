const express = require('express');
const {get, list} = require('../services/redis');
const {activeUsersInRoom} = require('../services/ws');
const {isAdmin} = require('../auth');

const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
  res.type('application/json');

  const f = req.params.f;
  let showall = false;
  if (f && f == 'knots-is-malware') showall = true;

  let rooms = [];
  let roomIds = [];
  // current hour
  let dt = new Date();
  let dti = dt.toISOString();
  let dts = dti.replaceAll('-', '').replace('T', '').slice(0, 10);
  let k = `usagetracking/${dts}/`;
  let currentHourKeys = await list(k);
  for (let currentHourKey of currentHourKeys) {
    let roomId = currentHourKey.split('/').slice(-1)[0];
    roomIds.push(roomId);
  }
  // previous hour
  dt.setTime(dt.getTime() - 60 * 60 * 1000);
  dti = dt.toISOString();
  dts = dti.replaceAll('-', '').replace('T', '').slice(0, 10);
  k = `usagetracking/${dts}/`;
  let previousHourKeys = await list(k);
  for (let previousHourKey of previousHourKeys) {
    let roomId = previousHourKey.split('/').slice(-1)[0];
    if (!roomIds.includes(roomId)) roomIds.push(roomId);
  }

  for (let roomId of roomIds) {
    let peerIds = await activeUsersInRoom(roomId);
    let userCount = peerIds.length;
    let userInfo = [];
    if (userCount > 0) {
      let uis = await Promise.all(peerIds.map(id => get(`identities/${id}`)));
      for (let ui of uis) {
        if (!ui) continue;
        if (ui?.id == undefined || ui?.id == null || ui?.id == '') continue;
        let uisimple = {
          id: ui.id,
          name: ui?.name,
          avatar: ui?.avatar,
          npub: ui?.identities?.find(i => i.type === 'nostr')?.id,
        };
        userInfo.push(uisimple);
      }
    }
    if (userCount > 0) {
      let roomKey = 'rooms/' + roomId;
      let roomInfo = await get(roomKey);
      let isClosed = roomInfo?.closed ?? false;
      let isPrivate = roomInfo?.isPrivate ?? false;
      if (isPrivate || isClosed) {
        if (!showall) continue;
      }
      let isProtected =
        (roomInfo.isProtected || false) &&
        (roomInfo.passphraseHash ?? '').length > 0;
      let isStageOnly = roomInfo?.stageOnly ?? false;
      let isLiveActivity = roomInfo?.isLiveActivityAnnounced ?? false;
      let isNoAnon = roomInfo?.isNoAnon ?? false;
      let isTS = roomInfo?.isTS ?? false;
      let memberATag = roomInfo?.memberATag ?? '';
      rooms.push({
        roomId: roomId,
        name: roomInfo.name,
        description: roomInfo.description,
        logoURI: roomInfo.logoURI,
        isClosed: isClosed,
        isPrivate: isPrivate,
        isProtected: isProtected,
        isStageOnly: isStageOnly,
        isLiveActivity: isLiveActivity,
        isNoAnon: isNoAnon,
        isTS: isTS,
        isMembersOnly: memberATag.length > 0,
        memberATag: memberATag,
        userCount: userCount,
        userInfo: userInfo,
      });
    }
  }
  res.send(rooms);
});

module.exports = router;
