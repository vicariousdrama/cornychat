const express = require('express');
const {get} = require('../services/redis');
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

module.exports = router;
