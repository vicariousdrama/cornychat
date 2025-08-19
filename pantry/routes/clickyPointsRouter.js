const express = require('express');
const {get, set} = require('../services/redis');

const router = express.Router({mergeParams: true});

router.post('/:userId/:points', async function (req, res) {
  res.type('application/json');
  const userid = req.params.userId ?? '';
  if (userid.length == 0) {
    res.sendStatus(404);
    return;
  }
  const points = req.params.points ?? '';
  if (points.length == 0) {
    res.sendStatus(404);
    return;
  }
  let userinfo = await get(`identities/${userid}`);
  let usernpub = '';
  let username = 'Anonymous Player';
  let useravatar = '/img/avatars/avatar-corn-8.png';
  if (userinfo != undefined) {
    if (userinfo.identities != undefined) {
      for (let userIdentity of userinfo.identities) {
        if (userIdentity.type == undefined) continue;
        if (userIdentity.type != 'nostr') continue;
        if (userIdentity.id == undefined) continue;
        usernpub = userIdentity.id;
      }
    }
    if (userinfo.name != undefined) {
      username = userinfo.name;
    }
    if (userinfo.avatar != undefined) {
      useravatar = userinfo.avatar;
    }
  }
  if (usernpub.length == 0) {
    res.sendStatus(403);
    return;
  }
  let ok = parseInt(points) == points && points > 0 && points < 388;
  if (!ok) {
    res.sendStatus(403);
    return;
  }
  let numPoints = parseInt(points);

  // the date
  let dt = new Date();
  let dt2 = new Date(dt.getFullYear(), 0, 1);
  let w = Math.ceil((dt - dt2) / 86400000 / 7);
  let dts = `${dt.getFullYear()}w${w}`;
  // user key
  let k = `userpoints/${usernpub}`;
  let v = await get(k);
  if (v == undefined || v == null) v = {created: dts};
  if (!v.hasOwnProperty(dts)) {
    v[dts] = numPoints;
  } else {
    v[dts] = v[dts] + numPoints;
  }
  set(k, v);
  // week key
  let wk = `weeklypoints/${dts}`;
  wv = await get(wk);
  if (wv == undefined || wv == null) wv = [];
  let userfound = false;
  for (let wi of wv) {
    if (wi.hasOwnProperty('npub') && wi.npub == usernpub) {
      wi.points = wi.points + numPoints;
      if (!wi.hasOwnProperty('name')) wi.name = username;
      if (!wi.hasOwnProperty('avatar')) wi.avatar = useravatar;
      userfound = true;
    }
  }
  if (!userfound) {
    wv.push({
      npub: usernpub,
      points: numPoints,
      avatar: useravatar,
      name: username,
    });
  }
  set(wk, wv);

  // return results
  res.type('application/json');
  res.send({
    week: dts,
    scores: wv,
  });
});

module.exports = router;
