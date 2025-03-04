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
  let pmd = 0;
  try {
    let motdkey = `motd`;
    let motdinfo = undefined;
    // Must be Admin
    if (!(await isAdmin(req))) {
      pmd = 1;
      console.log(
        `[motdRouter] attempt to set motd by a non admin. ssrIdentities is not in admin list`
      );
      console.log(JSON.stringify(req));
      pmd = 2;
      res.sendStatus(403);
      return;
    }

    pmd = 3;
    let b = req.body;
    if (!b.hasOwnProperty('motd')) {
      pmd = 4;
      res.sendStatus(400);
      return;
    }
    pmd = 5;
    motdinfo = b.motd;
    pmd = 6;
    motdinfo = {motd: motdinfo};
    pmd = 7;
    await set(motdkey, motdinfo);
    pmd = 8;

    res.type('application/json');
    res.send(motdinfo);
  } catch (e) {
    console.log(
      `[motdRouter] attempt to update motd failed due to error (pmd=${pmd})`
    );
    console.log(JSON.stringify(e));
    res.sendStatus(500);
    return;
  }
});

module.exports = router;
