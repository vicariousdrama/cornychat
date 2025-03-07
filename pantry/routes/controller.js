const express = require('express');
const {broadcast} = require('../services/ws');
const {get, set} = require('../services/redis');

const permitAllAuthenticator = {
  canPost: (req, res, next) => next(),
  canPut: (req, res, next) => next(),
  canGet: (req, res, next) => next(),
};

const controller = (prefix, authenticator, broadcastRoom, broadcastChannel) => {
  const _authenticator = authenticator || permitAllAuthenticator;

  const redisKey = req => prefix + '/' + req.params.id;
  const router = express.Router();
  const path = `/${prefix}/:id`;

  router.post(path, _authenticator.canPost, async function (req, res) {
    const key = redisKey(req);
    if (await get(key)) {
      res.sendStatus(409);
    } else {
      await set(key, req.body);
      await set(`activity/${prefix}/last-created`, Date.now());
      await set(`activity/${prefix}/${req.params.id}/last-created`, Date.now());
      await set(`activity/${prefix}/last-accessed`, Date.now());
      await set(
        `activity/${prefix}/${req.params.id}/last-accessed`,
        Date.now()
      );
      res.send(req.body);
    }
  });
  router.get(path, _authenticator.canGet, async function (req, res) {
    const data = await get(redisKey(req));
    if (data) {
      await set(`activity/${prefix}/last-accessed`, Date.now());
      if (prefix == 'identities') {
        await set(
          `activity/${prefix}/${req.params.id}/last-accessed`,
          Date.now()
        );
      }
      if (prefix == 'rooms') {
        // Just a placeholder. We don't want to track last-accessed for simple room
        // retrieval which would occur on users fetching room info from nostr clients
        // Instead, we do this for users that are actively in the room (after 45 seconds)
        // in ws.js :: handleConnection
      }
      res.send(data);
    } else {
      res.sendStatus(404);
    }
  });
  router.put(path, _authenticator.canPut, async function (req, res) {
    const key = redisKey(req);
    if (await get(key)) {
      await set(key, req.body);
      await set(`activity/${prefix}/last-accessed`, Date.now());
      await set(`activity/${prefix}/${req.params.id}/last-updated`, Date.now());
      if (broadcastRoom && broadcastChannel)
        broadcast(
          broadcastRoom(req.params.id),
          broadcastChannel(req.params.id),
          req.body
        );
      res.send(req.body);
    } else {
      res.sendStatus(404);
    }
  });
  return router;
};

module.exports = {controller, permitAllAuthenticator};
