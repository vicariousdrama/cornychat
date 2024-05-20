const express = require('express');
const {get,list} = require('../services/redis');

const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
    res.type('application/json');

    const dt = new Date();
    const dti = dt.toISOString();
    const dts = dti.replaceAll('-','').replace('T','').slice(0,10);
    const y = req.params.year ?? dts.slice(0,4);
    const m = req.params.month ?? dts.slice(4,6);
    const kprefix = `adtracking/${y}/${m}*`;

    let advalues = {}
    let adkeys = await list(kprefix);
    if (adkeys.length > 0) {
        adkeys.sort((a,b) => (a > b) ? 1 : ((b > a) ? -1 : 0));
        for (let adkey of adkeys) {
            let advalue = await get(adkey);
            advalues[adkey] = advalue;
        }
    }

    res.send(advalues);
});

module.exports = router;
