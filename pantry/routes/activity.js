const express = require('express');
const {get} = require('../services/redis');

const router = express.Router();

const ago = data => {
  console.log(data);

  const date = (data || {})['date'];
  const msDiff = Date.now() - (date || 0);
  return `${Math.floor(msDiff / (24 * 60 * 60 * 1000))}d ${
    Math.floor(msDiff / (60 * 60 * 1000)) % 24
  }h ${Math.floor(msDiff / (60 * 1000)) % 60}m ${
    Math.floor(msDiff / 1000) % 60
  }s ago`;
};

router.get('', async function (req, res) {
  res.type('application/json');
  res.send({
    lastCreatedIdentity: ago(get('activity/identities/last-created')),
    lastCreatedRoom: ago(get('activity/rooms/last-created')),
    lastAccessedIdentity: ago(get('activity/identities/last-accessed')),
    lastAccessedRoom: ago(get('activity/rooms/last-accessed')),
  });
});

module.exports = router;
