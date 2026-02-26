const express = require('express');
const {get} = require('../services/redis');
const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
  // only returns the server goal balance which is the total msat of all wallets referenced
  // by SERVER_ZAP_GOAL_WALLET_API_KEYS which is tallied every hour by zapGoalUpdater
  // We dont have any further info about zap goals set on rooms

  let theBalance = await get('server/zapgoalbalance');
  console.log(theBalance);
  if (!theBalance) theBalance = 0;
  res.type('application/json');
  res.send({balance: theBalance});
  return;
});

module.exports = router;
