const express = require('express');
const {get, set} = require('../services/redis');
const {isAdmin} = require('../auth');
const router = express.Router();

router.get('', async function (req, res) {
  let motdkey = `motd`;
  let motdinfo = undefined;
  try {
    motdinfo = await get(motdkey);
    motdinfo = motdinfo.motd;
  } catch (e) {
    motdinfo = undefined;
  }
  let defaultMOTD = `Rooms that have not been accessed by anyone for 90 days will be deleted starting January 1, 2025`;
  res.type('application/json');
  res.send({motd: motdinfo || defaultMOTD});
});

router.post('', async function (req, res) {
  let motdkey = `motd`;
  let motdinfo = undefined;
  // Must be Admin
  if (!(await isAdmin(req))) {
    console.log(
      `[motdRouter] attempt to set motd by a non admin. ssrIdentities is not in admin list`
    );
    console.log(JSON.stringify(req));
    res.sendStatus(403);
    return;
  }

  let b = req.body;
  if (!b.hasOwnProperty('motd')) {
    res.sendStatus(400);
    return;
  }
  motdinfo = b.motd;
  let o = {motd: motdinfo};
  await set(motdkey, o);

  res.type('application/json');
  res.send(o);
});

module.exports = router;
