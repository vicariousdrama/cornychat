const express = require('express');
const {getEventByATag} = require('../nostr/nostr');
const {get, set} = require('../services/redis');
const {isModerator} = require('../auth');
const base64 = require('compact-base64');
const {data} = require('simple-signed-records-engine');
const router = express.Router({mergeParams: true});
const {nip19} = require('nostr-tools');

const extractToken = req => {
  const authHeader = req.header('Authorization');
  return (authHeader && authHeader.substring(6)) || req.query.token || '';
};

router.get('', async function (req, res) {
  let roomId = '';
  let userId = '';
  if (req.params.hasOwnProperty('id')) {
    roomId = req.params.id;
  } else {
    res.sendStatus(400);
    return;
  }
  const roomInfo = await get('rooms/' + roomId);
  if (!roomInfo) {
    res.sendStatus(404);
    return;
  }
  // If there is no members only constraint, then just return true
  if (!roomInfo.hasOwnProperty('memberATag')) {
    res.json({isMember: true});
    return;
  }

  // setup ssrIdentities, needed to do the isModerator check
  let verifiedRecord;
  try {
    let record = JSON.parse(base64.decode(extractToken(req)));
    verifiedRecord = data(record);
  } catch (_) {}
  if (verifiedRecord) {
    req.ssrIdentities = verifiedRecord.identities.map(base64.originalToUrl);
    if (req.ssrIdentities.length > 0) {
      userId = req.ssrIdentities[0];
    }
  }

  // Check if a moderator (also checks owner and admin)
  if (await isModerator(req, roomId)) {
    res.json({isMember: true});
    return;
  }

  // Lookup user info to get their pubkey
  if (userId.length == 0) {
    res.json({isMember: false});
    return;
  }
  const userInfo = await get('identities/' + userId);
  if (!userInfo) {
    res.json({isMember: false});
    return;
  }
  let userPubkey = '';
  if (userInfo.hasOwnProperty('identities')) {
    if (userInfo.identities[0].hasOwnProperty('type')) {
      if (userInfo.identities[0].type == 'nostr') {
        if (userInfo.identities[0].hasOwnProperty('id')) {
          let npub = userInfo.identities[0].id;
          userPubkey = nip19.decode(npub).data;
        }
      }
    }
  }
  if (userPubkey.length == 0) {
    res.json({isMember: false});
    return;
  }

  // now attempt the list
  // first .. pull from any local cache and decide if need to re-retrieve latest
  let memberKey = `memberATag/${roomInfo.memberATag}`;
  let fetchList = false;
  let listInfo = await get(memberKey);
  if (!listInfo) {
    fetchList = true;
  } else {
    try {
      listInfo = JSON.parse(listInfo);
      // check if older then 3 minutes
      if (!listInfo.hasOwnProperty('retrieved_at')) {
        fetchList = true;
      } else {
        if (listInfo.retrieved_at < Math.floor(Date.now() / 1000) - 60 * 3) {
          fetchList = true;
        }
      }
    } catch (e) {
      fetchList = true;
    }
  }
  // if need to check relays for latest ...
  if (fetchList) {
    let memberLists = [];
    // get from relays
    try {
      memberLists = await getEventByATag(roomInfo.memberATag);
      if (memberLists.length > 0) {
        // use the first value returned (there should only be one)
        listInfo = memberLists[0];
        // save to redis
        listInfo.retrieved_at = Math.floor(Date.now() / 1000);
        await set(memberKey, listInfo);
      }
    } catch (e) {
      console.log(`[roomMemberRouter.get] error fetching event by atag: ${e}`);
    }
  }
  // with list, iterate
  let isMember = false;
  //console.log(JSON.stringify(listInfo));
  if (
    listInfo != undefined &&
    listInfo != null &&
    listInfo.hasOwnProperty('tags')
  ) {
    for (let t of listInfo.tags) {
      if (t.length < 2) continue;
      if (t[0] != 'p') continue;
      if (t[1] == userPubkey) {
        isMember = true;
        break;
      }
    }
  }

  // return result
  res.json({isMember: isMember});
});

module.exports = router;
