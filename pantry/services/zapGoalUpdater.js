const {getZapGoals, publishZapGoal, deleteOldZapGoals} = require('../nostr/nostr');
const {nip19, getPublicKey} = require('nostr-tools');
const {serverNsec, relaysZapGoals} = require('../config');
const {get,set} = require('../services/redis');
const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour

function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

const checkGoal = async (currentGoal, sk) => {
    let pk = getPublicKey(sk);

    // get our goals from nostr, and set as latest
    let zapgoals = await getZapGoals(pk);
    for (let zapgoal of zapgoals) {
        if (zapgoal.created_at > currentGoal.created_at) {
            currentGoal = zapgoal;
        }
    }
    let relays = relaysZapGoals.split(',');
    let amount = 100000;

    let monthname = (new Intl.DateTimeFormat('en', { month: 'long' })).format(new Date());
    let goalDescription = `Infrastructure Costs for ${monthname}`;
    let update = false;
    if (currentGoal.created_at == 0) {
        console.log(`There is no current zapgoal for the server. One will be created`);
        update = true;
    } else if (currentGoal.content != goalDescription) {
        console.log(`The zapgoal for the server will be updated because the content (${currentGoal.content}) != target (${goalDescription})`)
        update = true;
    }
    if (update) {
        console.log(`Setting zap goal: ${goalDescription} [target=${amount} sats]`);
        currentGoal = await publishZapGoal(sk, goalDescription, amount, relays);
        if (currentGoal.created_at > 0) {
            let r = await set('server/zapgoal', currentGoal);
        }
    } else {
        let goalAmount = 0;
        for (let t of currentGoal.tags) {
            if (t.length > 1 && t[0] == "amount") goalAmount = Math.floor(Math.floor(t[1])/1000);
        }
        console.log(`Current zap goal: ${currentGoal.content} [target=${goalAmount} sats] created_at: ${currentGoal.created_at}`);
        if (currentGoal.created_at > 0) {
            let r = await set('server/zapgoal', currentGoal);
        }
    }
    return currentGoal;
}

const zapGoalUpdater = async () => {
    await sleep(2500);
    const sk = nip19.decode(serverNsec).data;

    // cleanup old goals
    deleteOldZapGoals(sk);

    console.log(`Looking up current zap goal`);
    let currentGoal = await get('server/zapgoal');
    if (currentGoal == undefined || currentGoal == {}) currentGoal = {created_at:0}

    // initial comparison check on startup
    currentGoal = await checkGoal(currentGoal, sk);

    // periodic checks every hour
    setInterval(async () => {
        currentGoal = await checkGoal(currentGoal, sk);
    }, UPDATE_INTERVAL);
};

module.exports = {zapGoalUpdater};
