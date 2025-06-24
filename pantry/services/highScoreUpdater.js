const {publishWeeklyScores} = require('../nostr/nostr');
const {nip19} = require('nostr-tools');
const {gameEnabled, gameScoreUpdateInterval} = require('../config');
const {get} = require('../services/redis');
const CHECK_INTERVAL = gameScoreUpdateInterval * 1000 * 60 * 60;

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

const updateScores = async () => {
  let scoreEvent = undefined;
  // the date
  let dt = new Date();
  let dt2 = new Date(dt.getFullYear(), 0, 1);
  let w = Math.ceil((dt - dt2) / 86400000 / 7);
  let dts = `${dt.getFullYear()}w${w}`;
  // week key
  let wk = `weeklypoints/${dts}`;
  wv = await get(wk);
  if (wv == undefined || wv == null) wv = [];
  // sort by points
  wv.sort((a, b) => (a.points > b.points ? -1 : b.points > a.points ? 1 : 0));
  // publish to nostr
  scoreEvent = await publishWeeklyScores(dts, wv);
  return scoreEvent;
};

const highScoreUpdater = async () => {
  if (!gameEnabled) {
    console.log('High Score Updater cancelled - GAME not enabled');
    return;
  }
  await sleep(2500);
  // initial update
  let scoreEvent = await updateScores();
  // periodic checks on interval
  setInterval(async () => {
    scoreEvent = await updateScores();
  }, CHECK_INTERVAL);
};

module.exports = {highScoreUpdater};
