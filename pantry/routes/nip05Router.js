const express = require('express');
const {get} = require('../services/redis');
const { nip19, getPublicKey } = require('nostr-tools');
const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
    //res.appendHeader("Access-Control-Allow-Origin", "*");
    res.type('application/json');
    // example result format ...
    //      {"names":{"vicariousdrama":"21b419102da8fc0ba90484aec934bf55b7abcf75eedb39124e8d75e491f41a5e"}}
    // if not found
    //      {"names":{}}
    let resObj = {names:{}};
    // Get the requested name
    let name = req.query.name;
    // Empty result if none provided
    if (name == undefined || name == null) {
        res.send(resObj);
        return;
    }
    // Check if requesting verification of room id
    if (name.endsWith("-room")) {
        let roomId = name.slice(0,-5);
        let nostrroomkey = 'nostrroomkey/' + roomId;
        let roomNsec = await get(nostrroomkey);
        if (roomNsec == undefined || roomNsec == null) {
            res.send(resObj);
            return;
        }
        let sk = nip19.decode(roomNsec).data;
        let pk = getPublicKey(sk);
        resObj.names[name] = pk;
        res.send(resObj);
        return;
    }
    // All other users...
    let nip05key = 'nip05user/' + name;
    let pk = await get(nip05key);
    if (pk == undefined || pk == null) {
        res.send(resObj);
        return;
    }
    resObj.names[name] = pk;
    res.send(resObj);
    return;
});

module.exports = router;
