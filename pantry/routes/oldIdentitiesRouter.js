const express = require('express');
const {get,set,del,list} = require('../services/redis');
const router = express.Router({mergeParams: true});
  

router.get('', async function (req, res) {
    res.type('application/json');

    // time constraint
    let oldtime30 = 30 * 24 * 60 * 60 * 1000; // 30 days ago
    let oldtime60 = 60 * 24 * 60 * 60 * 1000; // 30 days ago
    let oldtime90 = 90 * 24 * 60 * 60 * 1000; // 30 days ago

    // get all identities
    const kprefix = `identities/*`;
    let ids = await list(kprefix);
    let currentids = [];
    let oldids30 = [];
    let oldids60 = [];
    let oldids90 = [];
    let neveraccessed = []; // have no last-accessed records. this feature was implemented 20240606
    if (ids.length > 0) {
        ids.sort((a,b) => (a > b) ? 1 : ((b > a) ? -1 : 0));
        for (let idkey of ids) {
            let id = idkey.split('/')[1];
            let lastAccessed = await get (`activity/${idkey}/last-accessed`);
            if (lastAccessed == undefined) {
                neveraccessed.push(id);
                continue;
            }
            if (lastAccessed < oldtime30) {
                oldids30.push(id);
                continue;
            }
            if (lastAccessed < oldtime60) {
                oldids60.push(id);
                continue;
            }
            if (lastAccessed < oldtime90) {
                oldids90.push(id);
                continue;
            }
            currentids.push({id:id,lastAccessed:lastAccessed});
        }
    }

    // return results
    res.send({
        current: currentids,
        oldids30: oldids30,
        oldids60: oldids60,
        oldids90: oldids90,
        neveraccessed: neveraccessed
    });
});

module.exports = router;
