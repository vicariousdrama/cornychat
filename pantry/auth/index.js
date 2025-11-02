const {nip19, getPublicKey} = require('nostr-tools');
const {get, set} = require('../services/redis');
const {activeUsersInRoom} = require('../services/ws');
const {permitAllAuthenticator} = require('../routes/controller');
const verifyIdentities = require('../verifications');
const {restrictRoomCreation, jamHost} = require('../config');
const {
  getRoomNSEC,
  publishNostrSchedule,
  deleteNostrSchedule,
  updateNostrProfile,
  isValidLoginSignature,
  getNpubs,
} = require('../nostr/nostr');
const {saveCSAR} = require('../nostr/csar');
const {
  grantPubkeyToRelays,
  revokePubkeyFromRelays,
} = require('../relayacl/relayACL');

const isAnyInList = (tokens, publicKeys) => {
  return tokens.some(token => publicKeys.includes(token));
};

const hasAccessToRoom = async (req, roomId) => {
  try {
    const roomInfo = await get('rooms/' + roomId);
    if (!roomInfo) return false;
    // TODO: Check req.ssrIdentities, lookup any npubs and compare that way
    return isAnyInList(
      req.ssrIdentities,
      (roomInfo.access && roomInfo.access.identities) || []
    );
  } catch (error) {
    console.log(`[hasAccessToRoom] error: ${error}`);
    return [];
  }
};

const asNpubs = async identityKeys => {
  let npubs = [];
  for (let identityKey of identityKeys) {
    try {
      const identityInfo = await get('identities/' + identityKey);
      if (!identityInfo) continue;
      if (!identityInfo.identities) continue;
      for (let ident of identityInfo.identities) {
        if (!ident.type) continue;
        if (!ident.id) continue;
        if (!ident.loginTime) continue;
        if (!ident.loginId) continue;
        if (!ident.loginSig) continue;
        if (ident.type != 'nostr') continue;
        let n = ident.id || '';
        let c = ident.loginTime || 0;
        let i = ident.loginId || '';
        let s = ident.loginSig || '';
        let p = nip19.decode(n).data;
        let r = isValidLoginSignature(i, p, c, identityKey, s);
        if (r) {
          console.log(`[asNpubs] adding ${n}`);
          npubs.push(n);
        } else {
          console.log(
            `[asNpubs] not valid signature for identity ${JSON.stringify(
              ident
            )}`
          );
        }
      }
    } catch (error) {
      console.log('[asNpubs] error: ', identityKey, error);
    }
  }
  return npubs;
};

const isOwner = async (req, roomId) => {
  console.log('[isOwner] checking', req.ssrIdentities);
  try {
    if (await isAdmin(req)) return true;
    const roomInfo = await get('rooms/' + roomId);
    if (!roomInfo) return false;
    if ((roomInfo.owners ?? []).length == 0) return false;
    let o = isAnyInList(req.ssrIdentities, roomInfo.owners);
    let npubs = await asNpubs(req.ssrIdentities);
    if (!o) o = isAnyInList(npubs, roomInfo.owners);
    return o;
  } catch (error) {
    console.log(`[isOwner] error: ${error}`);
    return false;
  }
};

const isModerator = async (req, roomId) => {
  console.log('[isModerator] checking', req.ssrIdentities);
  try {
    if (await isAdmin(req)) return true;
    const roomInfo = await get('rooms/' + roomId);
    if (!roomInfo) return false;
    let o = false;
    if (roomInfo.owners) {
      o = isAnyInList(req.ssrIdentities, roomInfo.owners);
      if (o) return o;
    }
    let m = false;
    if (roomInfo.moderators) {
      m = isAnyInList(req.ssrIdentities, roomInfo.moderators);
      if (m) return m;
    }
    let npubs = await asNpubs(req.ssrIdentities);
    if (roomInfo.owners) {
      o = isAnyInList(npubs, roomInfo.owners);
      if (o) return o;
    }
    if (roomInfo.moderators) {
      m = isAnyInList(npubs, roomInfo.moderators);
      if (m) return m;
    }
  } catch (error) {
    console.log(`[isModerator] error: ${error}`);
  }
  return false;
};

const identityIsAdmin = async identityKeys => {
  try {
    const adminKeys = await get('server/admins');
    return isAnyInList(identityKeys, adminKeys);
  } catch (error) {
    console.log(`[identityIsAdmin] error: ${error}`);
  }
  return false;
};

const isAdmin = async req => {
  // TODO: Check req.ssrIdentities, lookup any npubs and compare that way
  return await identityIsAdmin(req.ssrIdentities);
};

const addAdmin = async serverAdminId => {
  try {
    const currentServerAdmins = await get('server/admins');
    if (currentServerAdmins && !currentServerAdmins.includes(serverAdminId)) {
      currentServerAdmins.push(serverAdminId);
      await set('server/admins', currentServerAdmins);
    } else {
      await set('server/admins', [serverAdminId]);
    }
  } catch (error) {
    console.log(`[addAdmin] error: ${error}`);
  }
};

const removeAdmin = async serverAdminId => {
  try {
    const currentServerAdmins = await get('server/admins');
    const newServerAdmins = currentServerAdmins.filter(
      e => e !== serverAdminId
    );
    await set('server/admins', newServerAdmins);
  } catch (error) {
    console.log(`[removeAdmin] error: ${error}`);
  }
};

const initializeServerAdminIfNecessary = async req => {
  try {
    const admins = await get('server/admins');
    if (!admins || admins.length === 0) {
      await set('server/admins', [req.params.id]);
    }
  } catch (error) {
    console.log(`[initializeServerAdminIfNecessary] error: ${error}`);
  }
};

const getHeaderValue = (headers, key) => {
  let f = false;
  let v = '';
  for (let h of headers) {
    if (f) {
      v = h;
      break;
    }
    f = h == key;
  }
  return v;
};

const roomAuthenticator = {
  ...permitAllAuthenticator,
  canPost: async (req, res, next) => {
    try {
      if (restrictRoomCreation && !(await isAdmin(req))) {
        res.sendStatus(403);
        return;
      }

      // ensure room doesn't yet exist
      const roomId = req.params.id;
      if (!/^[\w-]{4,}$/.test(roomId)) {
        res.sendStatus(403);
        return;
      }

      // Constrain what data can go into a room. The structure should not allow arbitrary data storage
      // - initial length must be < 2048
      let cl = getHeaderValue(req.rawHeaders, 'Content-Length');
      if (!cl || cl.length == 0) {
        console.log(
          `Room ${roomId} being created does not provide Content-Length header`
        );
        res.sendStatus(411);
        return;
      }
      if (Math.floor(cl) > 2100) {
        // current default room size near 2048 depending on roomid generated
        console.log(
          `Room ${roomId} being created exceeds maximum allowed data size`
        );
        res.sendStatus(413);
        return;
      }
      // - must be json
      let ct = getHeaderValue(req.rawHeaders, 'Content-Type');
      if (!ct || ct != 'application/json') {
        console.log(
          `Room ${roomId} being created does not provide Content-Type header, or value is not application/json`
        );
        res.sendStatus(400);
        return;
      }
      // - must contain fields: name, description, owners, moderators, speakers, customEmojis
      if (
        req.body.name == undefined ||
        req.body.description == undefined ||
        req.body.owners == undefined ||
        req.body.moderators == undefined ||
        req.body.speakers == undefined ||
        req.body.customEmojis == undefined
      ) {
        console.log(
          `Room ${roomId} being created does not have required fields`
        );
        res.sendStatus(400);
        return;
      }
      // - the first customEmoji in the array must be "🌽"
      if (
        req.body.customEmojis.length == 0 ||
        req.body.customEmojis[0] != '🌽'
      ) {
        console.log(
          `Room ${roomId} being created does not have 🌽 emoji in first slot`
        );
        res.sendStatus(400);
        return;
      }
      // - force set createdTime and updateTime
      let theTime = Date.now();
      if (!req.body.updateTime) {
        req.body.updateTime = theTime;
      }
      if (!req.body.createdTime) {
        req.body.createdTime = req.body.updateTime;
      }

      // achievement
      const senderId = req.body.owners[0];
      saveCSAR(senderId, roomId, 'makeroom');

      // if we got this far, the authorization checks succeeded and ok to write
      next();
    } catch (error) {
      console.log(`[roomAuthenticator.canPost] error: ${error}`);
      res.sendStatus(500);
      return;
    }
  },
  canPut: async (req, res, next) => {
    try {
      const roomId = req.params.id;

      if (req.ssrIdentities.length === 0) {
        res.sendStatus(401);
        return;
      }

      let roomInfo = await get('rooms/' + roomId);
      let postingRoom = req.body;
      // room must exist to be updated
      if (!roomInfo) {
        console.log('unable to update room: roomInfo does not exist');
        res.sendStatus(403);
        return;
      }
      // add first moderator as owner if not yet set
      if (roomInfo.owners == undefined) {
        console.log('adding first moderator as room owner');
        roomInfo.owners = [roomInfo.moderators[0]];
      }
      // check if legacy room (one without timestamp checks)
      let islegacy = !roomInfo?.updateTime;
      if (islegacy) {
        roomInfo.updateTime = Date.now();
        postingRoom.updateTime = roomInfo.updateTime;
      }
      // check update time against existing to avoid last in wins overwrites or updating with old state
      if (postingRoom.updateTime != roomInfo.updateTime) {
        console.log(
          'Room ',
          roomId,
          'provided update time: ',
          postingRoom.updateTime,
          ' does not match most recent update time: ',
          roomInfo.updateTime
        );
        res.sendStatus(428);
        return;
      }
      // permissions checks
      let a = await isAdmin(req);
      let npubs = await asNpubs(req.ssrIdentities);
      let connectedOwners = [];
      let connectedUsers = activeUsersInRoom(roomId);
      for (let connectedUser of connectedUsers) {
        if (
          roomInfo.owners.includes(connectedUser) &&
          !connectedOwners.includes(connectedUser)
        ) {
          connectedOwners.push(connectedUser);
        } else {
          let connectedUserNpubs = await asNpubs([connectedUser]);
          for (let connectedUserNpub of connectedUserNpubs) {
            if (
              roomInfo.owners.includes(connectedUserNpub) &&
              !connectedOwners.includes(connectedUserNpub)
            ) {
              connectedOwners.push(connectedUser);
            }
          }
        }
      }
      let connectedOwnerNpubs = await asNpubs(connectedOwners);
      let o = false;
      if (roomInfo.owners) {
        o = isAnyInList(req.ssrIdentities, roomInfo.owners);
        if (!o) o = isAnyInList(npubs, roomInfo.owners);
      }
      let m = false;
      if (roomInfo.moderators) {
        m = isAnyInList(req.ssrIdentities, roomInfo.moderators);
        if (!m) m = isAnyInList(npubs, roomInfo.moderators);
      }
      let s = false;
      if (roomInfo.speakers) {
        s = isAnyInList(req.ssrIdentities, roomInfo.speakers);
        if (!s) s = isAnyInList(npubs, roomInfo.speakers);
      }
      // special edge case for rooms with a talking stick, current speaker can set the new tsID
      if (
        (roomInfo.isTS ?? false) &&
        (roomInfo.tsID ?? '') != postingRoom.tsID
      ) {
        if (o || m || s || roomInfo.speakers.length == 0) {
          roomInfo.tsID = postingRoom.tsID;
          roomInfo.speakers = postingRoom.speakers;
          req.body = roomInfo;
          next();
          return;
        }
      }

      // must be an admin, owner or moderator to update the room
      if (!(a || o || m)) {
        res.sendStatus(403);
        return;
      }
      // track scheduling
      let hadSchedule = roomInfo.schedule != undefined;
      let hasSchedule = postingRoom.schedule != undefined;
      let scheduleChanged =
        hadSchedule &&
        hasSchedule &&
        roomInfo.schedule.setOn &&
        roomInfo.schedule.setOn != postingRoom.schedule.setOn;
      let oldScheduleStart = roomInfo.schedule?.start;
      let newScheduleStart = postingRoom.schedule?.start;
      // track room profile changes for updating nostr metadata record for room
      let profileChanged = false;
      profileChanged ||= roomInfo.name != postingRoom.name;
      profileChanged ||= roomInfo.description != postingRoom.description;
      profileChanged ||= roomInfo.logoURI != postingRoom.logoURI;
      profileChanged ||= roomInfo.backgroundURI != postingRoom.backgroundURI;
      profileChanged ||= roomInfo.lud16 != postingRoom.lud16;
      profileChanged ||= roomInfo.isPrivate != postingRoom.isPrivate;
      // if not an owner or admin, only allow changing specific fields
      if (!(a || o)) {
        // if not admin or owner, moderators are restricted to only updating specific fields
        roomInfo.currentSlide = postingRoom.currentSlide ?? 0;
        roomInfo.roomLinks = postingRoom.roomLinks ?? [];
        roomInfo.roomSlides = postingRoom.roomSlides ?? [];
        roomInfo.schedule = postingRoom.schedule
          ? postingRoom.schedule
          : undefined;
        roomInfo.speakers = postingRoom.speakers ?? roomInfo.moderators;
        roomInfo.kicked = postingRoom.kicked ?? [];
        req.body = roomInfo;
      } else {
        // local assignment for common reference for scheduling update below
        roomInfo = postingRoom;
      }
      // rule: for a room to be public, user must have an npub
      // OR at least one other owner currently connected must have an npub
      // OR it must be on the always public list
      let permanentPublic = false;
      let publicRooms = await get('publicRooms');
      if (publicRooms != null) {
        for (let publicRoom of publicRooms) {
          if (publicRoom == roomId) {
            permanentPublic = true;
            break;
          }
        }
      }
      if (
        npubs.length == 0 &&
        connectedOwnerNpubs.length == 0 &&
        !permanentPublic
      ) {
        console.log('forcing room to private');
        roomInfo.isPrivate = true;
        postingRoom.isPrivate = true;
        req.body.isPrivate = true;
      }
      if (permanentPublic) {
        roomInfo.isPrivate = false;
        postingRoom.isPrivate = false;
        req.body.isPrivate = false;
      }
      // set the new update time
      req.body.updateTime = Date.now();
      // grant access to relays
      let roomNsec = await getRoomNSEC(roomId, true);
      const sk = nip19.decode(roomNsec).data;
      const pk = getPublicKey(sk);
      const grantReason = `${jamHost} room: ${roomId}`;
      let g = await grantPubkeyToRelays(false, pk, grantReason);

      // nostr scheduling
      let deleteNostrScheduledEvent = false;
      if (oldScheduleStart) {
        // delete if old start time is in the future
        if (oldScheduleStart > Math.floor(Date.now() / 1000))
          deleteNostrScheduledEvent = true;
      }
      if (
        hasSchedule &&
        scheduleChanged &&
        oldScheduleStart &&
        newScheduleStart &&
        newScheduleStart < oldScheduleStart &&
        newScheduleStart + 86400 > oldScheduleStart
      ) {
        deleteNostrScheduledEvent = true;
      }
      if (deleteNostrScheduledEvent) {
        let d = await deleteNostrSchedule(roomId, oldScheduleStart);
      }
      if (hasSchedule && scheduleChanged) {
        // now publish
        let n = await publishNostrSchedule(
          roomId,
          roomInfo.schedule,
          roomInfo.moderators,
          roomInfo.logoURI
        );
      }

      // admin or owner and room is not private
      if ((a || o) && !(roomInfo.isPrivate ?? true)) {
        // set room npub from nsec (is this really necessary?)
        req.body.npub = nip19.npubEncode(pk);
        // update profile if changed
        if (profileChanged) {
          let n = await updateNostrProfile(
            roomId,
            roomInfo.name,
            roomInfo.description,
            roomInfo.logoURI,
            roomInfo.backgroundURI,
            roomInfo.lud16
          );
        }
      }

      // ok
      next();
    } catch (error) {
      console.log(`[roomAuthenticator.canPut] error: ${error}`);
      res.sendStatus(500);
      return;
    }
  },
};

const identityAuthenticator = {
  ...permitAllAuthenticator,
  canPost: async (req, res, next) => {
    try {
      await initializeServerAdminIfNecessary(req);

      // - force set createdTime and updateTime
      let theTime = Date.now();
      req.body.createdTime = theTime;
      req.body.updateTime = theTime;

      next();
    } catch (error) {
      console.log(`[identityAuthenticator.canPost] error: ${error}`);
      res.sendStatus(500);
      return;
    }
  },
  canPut: async (req, res, next) => {
    try {
      if (req.ssrIdentities.length === 0) {
        res.sendStatus(401);
        return;
      }

      if (req.body.identities) {
        try {
          // NOTE: This currently only verifies anon users that give a nevent or note id
          // TODO: Modify ../nostr/nostr.js:verify to support a new verificationInfo type for validating the signature given
          let isok = await verifyIdentities(req.body.identities, req.params.id);
        } catch (error) {
          console.log(
            '[identityAuthenticator.canPut] error calling verifyIdentities: ',
            error.message
          );
          res.status(400).json({
            success: false,
            error: {
              code: 'identity-verification-failed',
              message: error.message,
            },
          });
          return;
        }
      }

      await initializeServerAdminIfNecessary(req);

      // Check if the user changed their nostr identity and update revocations and grants accordingly
      try {
        let publicKey = req.params.id;
        // old npubs are in the redis store
        let oldNpubs = await getNpubs(publicKey);
        // new ones are being passed in the body
        let newNpubs = [];
        if (req.body.identities) {
          for (let ident of req.body.identities) {
            if (!ident.type) continue;
            if (!ident.id) continue;
            if (!ident.loginTime) continue;
            if (!ident.loginId) continue;
            if (!ident.loginSig) continue;
            if (ident.type != 'nostr') continue;
            let n = ident.id || '';
            let c = ident.loginTime || 0;
            let i = ident.loginId || '';
            let s = ident.loginSig || '';
            let p = nip19.decode(n).data;
            let r = isValidLoginSignature(i, p, c, publicKey, s);
            if (r) newNpubs.push(n);
          }
        }
        let removePubkeys = [];
        for (let oldNpub of oldNpubs) {
          let f = false;
          for (let newNpub of newNpubs) {
            if (oldNpub == newNpub) {
              f = true;
              break;
            }
          }
          if (!f) {
            removePubkeys.push(nip19.decode(oldNpub).data);
          }
        }
        let grantPubkeys = [];
        for (let newNpub of newNpubs) {
          let f = false;
          for (let oldNpub of oldNpubs) {
            if (oldNpub == newNpub) {
              f = true;
              break;
            }
          }
          if (!f) {
            grantPubkeys.push(nip19.decode(newNpub).data);
          }
        }
        for (let removePubkey of removePubkeys) {
          await revokePubkeyFromRelays(true, removePubkey);
        }
        for (let grantPubkey of grantPubkeys) {
          const grantReason = `${jamHost} npub: ${nip19.npubEncode(
            grantPubkey
          )}`;
          await grantPubkeyToRelays(true, grantPubkey, grantReason);
        }
      } catch (err) {
        console.log(
          `Error granting pubkey access to relays when updating identity: ${err}`
        );
      }

      // - force set updateTime
      let theTime = Date.now();
      req.body.updateTime = theTime;

      next();
    } catch (error) {
      console.log(`[identityAuthenticator.canPut] error: ${error}`);
      res.sendStatus(500);
      return;
    }
  },
};

module.exports = {
  isOwner,
  isModerator,
  identityIsAdmin,
  isAdmin,
  addAdmin,
  removeAdmin,
  roomAuthenticator,
  identityAuthenticator,
  hasAccessToRoom,
};
