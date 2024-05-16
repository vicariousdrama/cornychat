const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const {initOrIncrement} = require('../services/redis');
const {chatAdFileLocationPath} = require('../config');

const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
    const roomId = req.params.roomId ?? '';
    const adId = req.params.adId ?? '';

    let defaultAdFile = path.join(chatAdFileLocationPath, "ad320x50.png");    // default
    const d = new Date();
    const y = String(d.getUTCFullYear());
    const m = ("00" + String(d.getUTCMonth() + 1)).slice(-2);
    const adFolder = path.join(chatAdFileLocationPath, y, m);
    const newFolder = await fs.mkdir(adFolder, {recursive: true}); // ensure exists
    if (newFolder != undefined) {
        console.log(`For ${adFolder}, created ${newFolder}`);
    }

    // Get file lists
    const files = await fs.readdir(adFolder);
    const imageFiles = []
    const textFiles = []
    for (let filename of files) {
        if (filename.endsWith(".txt")) textFiles.push(filename);
        if (filename.endsWith(".png") || filename.endsWith(".jpg") || filename.endsWith(".gif")) imageFiles.push(filename);
    }

    // Check for need to return ad file list
    if (roomId.length == 0) {
        // Build and return ad list, which includes the links. Clients are expected to cache this
        let adlist = [];
        for (let imageFile of imageFiles) {
            let hasLink = false;
            let linkURI = '';
            let imageTextFile = `${imageFile}.txt`;
            if (textFiles.includes(imageTextFile)) {
                try {
                    let p = path.join(adFolder, imageTextFile);
                    linkURI = await fs.readFile(p, {encoding: 'utf8'});
                    hasLink = (linkURI.length > 0);
                } catch (error) { /*ignore*/ }
            }
            adlist.push({image: imageFile, hasLink: hasLink, link: linkURI});
        }
        res.send(adlist);
    } else {
        // Requesting an individual file by its id
        let adImageFile = path.join(adFolder, adId);
        // Track the request of this ad
        let p = "adtracking";
        let c = '';
        c = initOrIncrement(adImageFile.replace(chatAdFileLocationPath, p));                // count of this ads appearances by year/month
        c = initOrIncrement(adImageFile.replace(chatAdFileLocationPath, `${p}/${roomId}`)); // count of this ads appearances by room/year/month
        c = initOrIncrement(`${p}/${y}/${m}`);                                      // count of all ad appearances by year/month
        c = initOrIncrement(`${p}/${roomId}/${y}/${m}`);                            // count of all ad appearances by room/year/month
        // Send it
        if (imageFiles.includes(adId)) {
            try {
                res.sendFile(adImageFile);
            } catch (error) { 
                res.sendFile(defaultAdFile);
            }
        } else {
            res.sendFile(defaultAdFile);
        }
    }
});

module.exports = router;
