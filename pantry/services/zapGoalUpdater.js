const {getZapGoals, publishZapGoal} = require('../nostr/nostr');
const {nip19, getPublicKey} = require('nostr-tools');
const {serverNsec, relaysZapGoals} = require('../config');
const {get,set} = require('../services/redis');
const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour

const checkGoal = async (currentGoal, sk, amount, relays) => {
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
        let r = await set('server/zapgoal', currentGoal);
    } else {
        let goalAmount = 0;
        for (let t of currentGoal.tags) {
            if (t.length > 1 && t[0] == "amount") goalAmount = Math.floor(Math.floor(t[1])/1000);
        }
        console.log(`Current zap goal: ${currentGoal.content} [target=${goalAmount} sats]`);
        if (currentGoal.created_at > 0) {
            let r = await set('server/zapgoal', currentGoal);
        }
    }
    return currentGoal;
}

const zapGoalUpdater = async () => {
    const sk = nip19.decode(serverNsec).data;
    let pk = getPublicKey(sk);
    console.log(`Looking up current zap goal`);
    let zapgoals = await getZapGoals(pk);

    let currentGoal = await get('server/zapgoal');
    if (currentGoal == undefined || currentGoal == {}) currentGoal = {created_at:0}
    for (let zapgoal of zapgoals) {
        if (zapgoal.created_at > currentGoal.created_at) {
            currentGoal = zapgoal;
        }
    }
    let relays = relaysZapGoals.split(',');
    let amount = 100000;

    // initial comparison check
    currentGoal = checkGoal(currentGoal, sk, amount, relays);

    // periodic checks every hour
    setInterval(async () => {
        currentGoal = checkGoal(currentGoal, sk, amount, relays);
    }, UPDATE_INTERVAL);
};

module.exports = {zapGoalUpdater};
