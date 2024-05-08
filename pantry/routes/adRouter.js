const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const {get,set} = require('../services/redis');
const {adFileLocationPath} = require('../config');

const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
    const roomId = req.params.id;

    const d = new Date();
    const y = String(d.getUTCFullYear());
    const m = ("00" + String(d.getUTCMonth() + 1)).slice(-2);
    const adFolder = path.join(adFileLocationPath, y, m);

    // pick a file from month folder, or else use default
    const newFolder = await fs.mkdir(adFolder, {recursive: true});
    const files = await fs.readdir(adFolder);
    const fileCount = files.length;
    let adfile = path.join(adFileLocationPath, "ad.png");
    if(fileCount > 0) {
        const imgnum = (Math.floor(Date.now()/1000) % fileCount);
        adfile = path.join(adFolder, files[imgnum]);
    }

    // track in redis the file selected
    let p = "adtracking";
    // - by ad image in the month (number of times a specific ad was shown)
    let key = adfile.replace(adFileLocationPath, p);
    let c = await get(key);
    if (c == undefined || c == null) {c ="1";} else {c = String(Math.floor(c) + 1);}
    let s = await set(key, c);
    // - by ad image in month for a specific room
    let key2 = adfile.replace(adFileLocationPath, `${p}/${roomId}`);
    let c2 = await get(key2);
    if (c2 == undefined || c2 == null) {c2 ="1";} else {c2 = String(Math.floor(c2) + 1);}
    let s2 = await set(key2, c2);
    // - number of ads per month by room
    let key3 = `${p}/${roomId}/${y}/${m}`;
    let c3 = await get(key3);
    if (c3 == undefined || c3 == null) {c3 ="1";} else {c3 = String(Math.floor(c3) + 1);}
    let s3 = await set(key3, c3);
    // - number of ads per month
    let key4 = `${p}/${y}/${m}`;
    let c4 = await get(key4);
    if (c4 == undefined || c4 == null) {c4 ="1";} else {c4 = String(Math.floor(c4) + 1);}
    let s4 = await set(key4, c4);

    // return the file selected
    console.log(adfile);
    res.sendFile(adfile);
    return;
});

module.exports = router;
