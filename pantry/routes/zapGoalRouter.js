const express = require('express');
const {getRoomNSEC, getZapGoals} = require('../nostr/nostr');
const {serverNsec} = require('../config');
const { nip19, getPublicKey } = require('nostr-tools');
const {get} = require('../services/redis');
const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
    let roomId = '';
    let pk = '';
    if (req.params.hasOwnProperty('id')) {
        roomId = req.params.id;
        const roomInfo = await get('rooms/' + roomId);
        if (roomInfo) {
            // if room exists, then get the pubkey associated with its nsec
            let roomNsec = await getRoomNSEC(roomId);
            let roomSk = nip19.decode(roomNsec).data;
            pk = getPublicKey(roomSk);    
        }
    }
    // if room doesnt exist, or none provided, use server goal or key
    if (pk.length == 0) {
        let theZapgoal = await get('server/zapgoal');
        res.send(theZapgoal);
        return;
        //pk = getPublicKey(nip19.decode(serverNsec).data);
    } else {
        // get goals
        let zapgoals = await getZapGoals(pk);
        // then get the latest one
        let theZapgoal = {created_at:0};
        for (let zapgoal of zapgoals) {
            if (zapgoal.created_at > theZapgoal.created_at) {
                theZapgoal = zapgoal;
            }
        }
        res.send(theZapgoal);
    }
});

module.exports = router;
