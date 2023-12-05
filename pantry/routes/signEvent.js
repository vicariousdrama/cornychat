const express = require('express');
const {get} = require('../services/redis');
const nostr = require('nostr-tools');
const crypto = require('crypto-js');
const {createHash} = require('crypto');

const router = express.Router({mergeParams: true});

function getHash(data) {
  return createHash('sha256').update(data, 'utf-8').digest('hex');
}

router.post('', async (req, res) => {
  if (!req.headers.cookie) {
    const errorMsg = `You don't have a nostr extension or an authentication token to sign events.`;
    res
      .json({
        error: errorMsg,
      })
      .status(200);
  }

  const roomId = req.params.id + 'Keys';
  const event = req.body[1];
  const userId = req.body[0];
  const authKey = req.headers.cookie.split('=')[1];
  const authKeyHash = getHash(authKey);

  let roomPrivateKeys = await get(roomId);

  const isAuthKeyHash = roomPrivateKeys[`${userId}`].keyHash === authKeyHash;

  if (!isAuthKeyHash) {
    console.log('Invalid auth token');
    res.json({error: 'Invalid authentication token.'}).status(200);
  }

  const ciphertext = roomPrivateKeys[`${userId}`].ciphertext;
  const privateKey = crypto.AES.decrypt(ciphertext, authKey).toString(
    crypto.enc.Utf8
  );
  const pubkey = nostr.getPublicKey(privateKey);

  event.pubkey = pubkey;
  event.id = nostr.getEventHash(event);

  event.sig = nostr.getSignature(event, privateKey);

  res.json({nostrEvent: event}).status(200);
});

module.exports = router;
