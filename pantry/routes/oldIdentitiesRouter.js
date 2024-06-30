const express = require('express');
const {get,set,del,list} = require('../services/redis');
const router = express.Router({mergeParams: true});
  

router.get('', async function (req, res) {
    res.type('application/json');

    // time constraint
    let oldtime = 30 * 24 * 60 * 60 * 1000; // 30 days ago

    // get all identities
    const kprefix = `identities/*`;
    let ids = await list(kprefix);
    let oldids = [];
    let neveraccessed = []; // have no last-accessed records. this feature was implemented 20260606
    if (ids.length > 0) {
        ids.sort((a,b) => (a > b) ? 1 : ((b > a) ? -1 : 0));
        for (let idkey of ids) {
            let id = idkey.split('/')[1];
            let lastAccessed = await get (`activity/${idkey}/last-accessed`);
            if (lastAccessed == undefined) {
                neveraccessed.push(id);
                continue;
            }
            if (lastAccessed < oldtime) {
                oldids.push(id);
                continue;
            }
        }
    }

    // return results
    res.send({
        oldids: oldids,
        neveraccessed: neveraccessed
    });
});

module.exports = router;
