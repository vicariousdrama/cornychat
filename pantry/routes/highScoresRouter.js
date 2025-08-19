const express = require('express');
const {get} = require('../services/redis');

const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
  res.type('application/json');
  // the date
  let dt = new Date();
  let dt2 = new Date(dt.getFullYear(), 0, 1);
  let w = Math.ceil((dt - dt2) / 86400000 / 7);
  let dts = `${dt.getFullYear()}w${w}`;
  // override if dts specified
  if (req.query.hasOwnProperty('dts')) {
    dts = req.query.dts;
  }
  // week key
  let wk = `weeklypoints/${dts}`;
  wv = await get(wk);
  if (wv == undefined || wv == null) wv = [];
  // return results
  res.type('application/json');
  res.send({
    week: dts,
    scores: wv,
  });
});

module.exports = router;
