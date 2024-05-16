const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const {initOrIncrement} = require('../services/redis');
const {squareAdFileLocationPath} = require('../config');

const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
    const roomId = req.params.id;

    const d = new Date();
    const y = String(d.getUTCFullYear());
    const m = ("00" + String(d.getUTCMonth() + 1)).slice(-2);
    const adFolder = path.join(squareAdFileLocationPath, y, m);

    // pick a file from month folder, or else use default
    const newFolder = await fs.mkdir(adFolder, {recursive: true});
    const files = await fs.readdir(adFolder);
    const fileCount = files.length;
    let adfile = path.join(squareAdFileLocationPath, "ad.png");
    if(fileCount > 0) {
        const imgnum = (Math.floor(Date.now()/1000) % fileCount);
        adfile = path.join(adFolder, files[imgnum]);
    }

    // track in redis the file selected
    let p = "adtracking";
    let c = '';
    c = initOrIncrement(adfile.replace(squareAdFileLocationPath, p));                // count of this ads appearances by year/month
    c = initOrIncrement(adfile.replace(squareAdFileLocationPath, `${p}/${roomId}`)); // count of this ads appearances by room/year/month
    c = initOrIncrement(`${p}/${y}/${m}`);                                     // count of all ad appearances by year/month
    c = initOrIncrement(`${p}/${roomId}/${y}/${m}`);                           // count of all ad appearances by room/year/month

    // return the file selected
    res.sendFile(adfile);
    return;
});

module.exports = router;
