const {
  getZapGoals,
  publishZapGoal,
  deleteOldZapGoals,
} = require('../nostr/nostr');
const {nip19, getPublicKey} = require('nostr-tools');
const {
  lnbitsHost,
  relaysZapGoals,
  serverNsec,
  serverZapGoalUpdateInterval,
  serverZapGoalWalletAPIKeys,
} = require('../config');
const {get, set} = require('../services/redis');
const CHECK_INTERVAL = serverZapGoalUpdateInterval * 60 * 60 * 1000;
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

const checkBalance = async () => {
  let balance = 0;
  console.log(`[zapGoalUpdater.checkBalance] checking`);
  if (serverZapGoalWalletAPIKeys && serverZapGoalWalletAPIKeys.length > 0) {
    let apikeys = serverZapGoalWalletAPIKeys.split(',');
    let walleturl = `https://${lnbitsHost}/api/v1/wallet`;
    let apikeycount = 0;
    for (let apikey of apikeys) {
      apikeycount++;
      try {
        console.log(
          `[zapGoalUpdater.checkBalance] url: ${walleturl} for key # ${apikeycount}`
        );
        let res = await fetch(walleturl, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'X-Api-Key': apikey,
          },
        });
        let ret = await res.json();
        console.log(
          `[zapGoalUpdater.checkBalance] ret: ${JSON.stringify(ret)}`
        );
        if (ret.hasOwnProperty('balance')) balance = balance + ret.balance;
      } catch (error) {
        console.log(
          `[zapGoalUpdater.checkBalance] error: ${JSON.stringify(error)}`
        );
      }
    }
  } else {
    console.log(`[zapGoalUpdater.checkBalance] no wallet api keys to check`);
  }
  // update total
  let r = await set('server/zapgoalbalance', balance);

  return balance;
};

const checkGoal = async (currentGoal, sk) => {
  let pk = getPublicKey(sk);
  let theTime = Date.now();

  // get our goals from nostr, and set as latest
  let zapgoals = [];
  try {
    await getZapGoals(pk);
  } catch (e) {
    console.log(`[zapGoalUpdater.checkGoal] error fetching zap goals: ${e}`);
  }
  for (let zapgoal of zapgoals) {
    if (zapgoal.created_at > currentGoal.created_at) {
      currentGoal = zapgoal;
    }
  }
  let relays = relaysZapGoals.split(',');
  // Annual goal
  let theYear = new Date().getUTCFullYear();
  let goalDescription = `Infrastructure Costs for ${theYear}`;
  // annual in sats when bitcoin at 65000 usd.. 100000 (domains) + 221538 (vps hosting) + 55384 (backups) + 84000 (relay)
  let amount = 460922; // about $300 per year

  let update = false;
  if (currentGoal.created_at == 0) {
    console.log(
      `[checkGoal] there is no current zapgoal for the server. One will be created`
    );
    update = true;
  } else if (currentGoal.content != goalDescription) {
    console.log(
      `[checkGoal] the zapgoal for the server will be updated because the content (${currentGoal.content}) != target (${goalDescription})`
    );
    update = true;
  }
  if (update) {
    console.log(
      `[checkGoal] setting zap goal: ${goalDescription} [target=${amount} sats]`
    );
    currentGoal = await publishZapGoal(sk, goalDescription, amount, relays);
    if (currentGoal.created_at > 0) {
      let r = await set('server/zapgoal', currentGoal);
    }
  } else {
    let goalAmount = 0;
    for (let t of currentGoal.tags) {
      if (t.length > 1 && t[0] == 'amount')
        goalAmount = Math.floor(Math.floor(t[1]) / 1000);
    }
    console.log(
      `[checkGoal] current zap goal: ${currentGoal.content} [target=${goalAmount} sats] created_at: ${currentGoal.created_at}`
    );
    if (currentGoal.created_at > 0) {
      let r = await set('server/zapgoal', currentGoal);
    }
  }
  return currentGoal;
};

const zapGoalUpdater = async () => {
  if (serverNsec.length == 0) return;
  await sleep(2500);
  const sk = nip19.decode(serverNsec).data;

  // cleanup old goals
  deleteOldZapGoals(sk);

  console.log(`[zapGoalUpdater] looking up current zap goal`);
  let currentGoal = await get('server/zapgoal');
  if (currentGoal == undefined || currentGoal == {})
    currentGoal = {created_at: 0};

  console.log(`[zapGoalUpdater] looking up current zap goal balance`);
  let currentBalance = await get('server/zapgoalbalance');
  if (currentBalance == undefined || currentBalance == {}) currentBalance = 0;

  // initial comparison check on startup
  currentGoal = await checkGoal(currentGoal, sk);
  currentBalance = await checkBalance();

  // periodic checks every hour
  setInterval(async () => {
    currentGoal = await checkGoal(currentGoal, sk);
    currentBalance = await checkBalance();
  }, CHECK_INTERVAL);
};

module.exports = {zapGoalUpdater};
