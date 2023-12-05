const express = require('express');
const {get, set} = require('../services/redis');
const crypto = require('crypto');

const router = express.Router({mergeParams: true});

function createHash(data) {
  return crypto.createHash('sha256').update(data, 'utf-8').digest('hex');
}

function respondWithStatus(res, ok, encryptionKey, cookieOptions) {
  if (ok) {
    res.cookie('auth', encryptionKey, cookieOptions).sendStatus(200);
  } else {
    res.status(500).send('Internal Server Error');
  }
}

router.post('', async (req, res) => {
  try {
    const userId = req.body[0];
    const ciphertext = req.body[1];
    const encryptionKey = req.body[2];
    const roomId = req.params.id + 'Keys';
    const encryptionKeyHash = createHash(encryptionKey);
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    };

    // get the private keys that a specific room is managing
    let roomPrivateKeys = await get(roomId);

    if (!roomPrivateKeys) {
      const privateKeyEntry = {
        [`${userId}`]: {ciphertext: ciphertext, keyHash: encryptionKeyHash},
      };
      const ok = await set(roomId, privateKeyEntry);

      return respondWithStatus(res, ok, encryptionKey, cookieOptions);
    } else {
      let keys = {
        [`${userId}`]: {ciphertext: ciphertext, keyHash: encryptionKeyHash},
        ...roomPrivateKeys,
      };
      const ok = await set(roomId, keys);
      return respondWithStatus(res, ok, encryptionKey, cookieOptions);
    }
  } catch (error) {
    console.error('Error in /route:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
