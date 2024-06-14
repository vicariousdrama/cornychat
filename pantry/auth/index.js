const {get, set} = require('../services/redis');
const {permitAllAuthenticator} = require('../routes/controller');
const verifyIdentities = require('../verifications');
const {restrictRoomCreation} = require('../config');
const {getRoomNSEC, publishNostrSchedule, deleteNostrSchedule, updateNostrProfile} = require('../nostr/nostr');
const {nip19, validateEvent, verifyEvent, getPublicKey } = require('nostr-tools');

const isAnyInList = (tokens, publicKeys) => {
  return tokens.some(token => publicKeys.includes(token));
};

const hasAccessToRoom = async (req, roomId) => {
  const roomInfo = await get('rooms/' + roomId);
  if (!roomInfo) return false;
  // TODO: Check req.ssrIdentities, lookup any npubs and compare that way
  return isAnyInList(
    req.ssrIdentities,
    (roomInfo.access && roomInfo.access.identities) || []
  );
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
        let tags = (ident.verificationInfo ? [] : [[]]);
        let e = {
          id: i,
          pubkey: p,
          created_at: c,
          kind: 1,
          tags: tags,
          content: identityKey,
          sig: s,
        };
        let u = validateEvent(e);
        let v = verifyEvent(e);
        r = (u && v);
        if (r) npubs.push(n);
      }
    } catch (error) {
      console.log('error in asNpubs conversion for identity: ', identityKey, error);
    }
  }
  return npubs;
}

const isOwner = async (req, roomId) => {
  console.log('in isOwner', req.ssrIdentities);
  if (await isAdmin(req)) return true;
  const roomInfo = await get('rooms/' + roomId);
  if (!roomInfo) return false;
  if ((roomInfo.owners ?? []).length == 0) return false;
  let o = isAnyInList(req.ssrIdentities, roomInfo.owners);
  let npubs = await asNpubs(req.ssrIdentities);
  if (!o) o = isAnyInList(npubs, roomInfo.owners);
  return o;
};

const isModerator = async (req, roomId) => {
  console.log('in isModerator', req.ssrIdentities);
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
  return false;
};

const identityIsAdmin = async identityKeys => {
  const adminKeys = await get('server/admins');
  return isAnyInList(identityKeys, adminKeys);
};

const isAdmin = async req => {
  // TODO: Check req.ssrIdentities, lookup any npubs and compare that way
  return await identityIsAdmin(req.ssrIdentities);
};

const addAdmin = async serverAdminId => {
  const currentServerAdmins = await get('server/admins');
  if (currentServerAdmins && !currentServerAdmins.includes(serverAdminId)) {
    currentServerAdmins.push(serverAdminId);
    await set('server/admins', currentServerAdmins);
  } else {
    await set('server/admins', [serverAdminId]);
  }
};

const removeAdmin = async serverAdminId => {
  const currentServerAdmins = await get('server/admins');
  const newServerAdmins = currentServerAdmins.filter(e => e !== serverAdminId);
  await set('server/admins', newServerAdmins);
};

const initializeServerAdminIfNecessary = async req => {
  const admins = await get('server/admins');
  if (!admins || admins.length === 0) {
    await set('server/admins', [req.params.id]);
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
    f = (h == key)
  }
  return v;
};

const roomAuthenticator = {
  ...permitAllAuthenticator,
  canPost: async (req, res, next) => {
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
      console.log(`Room ${roomId} being created does not provide Content-Length header`);
      res.sendStatus(411);
      return;
    }
    if (Math.floor(cl) > 2048) {  // current default room size near 1904
      console.log(`Room ${roomId} being created exceeds maximum allowed data size`);
      res.sendStatus(413);
      return;
    }    
    // - must be json
    let ct = getHeaderValue(req.rawHeaders, 'Content-Type');
    if (!ct || ct != 'application/json') {
      console.log(`Room ${roomId} being created does not provide Content-Type header, or value is not application/json`);
      res.sendStatus(400);
      return;
    }
    // - must contain fields: name, description, owners, moderators, speakers, customEmojis
    if (req.body.name == undefined || 
        req.body.description == undefined ||
        req.body.owners == undefined ||
        req.body.moderators == undefined ||
        req.body.speakers == undefined ||
        req.body.customEmojis == undefined) {
      console.log(`Room ${roomId} being created does not have required fields`);
      res.sendStatus(400);
      return;    
    }
    // - the first customEmoji in the array must be "🌽"
    if (req.body.customEmojis.length == 0 || req.body.customEmojis[0] != "🌽") {
      console.log(`Room ${roomId} being created does not have 🌽 emoji in first slot`);
      res.sendStatus(400);
      return;    
    }
    // - force set createdTime and updateTime
    let theTime = Date.now();
    req.body.createdTime = theTime;
    req.body.updateTime = theTime;

    // if we got this far, the authorization checks succeeded and ok to write
    next();
  },
  canPut: async (req, res, next) => {
    const roomId = req.params.id;

    if (req.ssrIdentities.length === 0) {
      res.sendStatus(401);
      return;
    }

    let roomInfo = await get('rooms/' + roomId);
    let postingRoom = req.body;
    // room must exist to be updated
    if (!roomInfo) {
      console.log("unable to update room: roomInfo does not exist");
      res.sendStatus(403);
      return;
    }
    // add first moderator as owner if not yet set
    if(roomInfo.owners == undefined) {
      console.log("adding first moderator as room owner");
      roomInfo.owners = [roomInfo.moderators[0]];
    }
    // check if legacy room (one without timestamp checks)
    let islegacy = (!roomInfo?.updateTime);
    if (islegacy) {
      roomInfo.updateTime = Date.now();
      postingRoom.updateTime = roomInfo.updateTime;
    }
    // check update time against existing to avoid last in wins overwrites or updating with old state
    if (postingRoom.updateTime != roomInfo.updateTime) {
      console.log("Room ", roomId, "provided update time: ", postingRoom.updateTime, " does not match most recent update time: ", roomInfo.updateTime);
      res.sendStatus(428);
      return;
    }
    // permissions checks
    let a = await isAdmin(req);
    let npubs = await asNpubs(req.ssrIdentities);
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
    // must be an admin, owner or moderator to update the room
    if(!(a || o || m)) {
      res.sendStatus(403);
      return;
    }
    // track scheduling
    let hadSchedule = (roomInfo.schedule != undefined);
    let hasSchedule = (postingRoom.schedule != undefined);
    let scheduleChanged = (
        hadSchedule && hasSchedule &&
        roomInfo.schedule.setOn &&
        roomInfo.schedule.setOn != postingRoom.schedule.setOn
      );
    // track room profile changes for updating nostr metadata record for room
    let profileChanged = false;
    profileChanged ||= (roomInfo.name != postingRoom.name);
    profileChanged ||= (roomInfo.description != postingRoom.description);
    profileChanged ||= (roomInfo.logoURI != postingRoom.logoURI);
    profileChanged ||= (roomInfo.backgroundURI != postingRoom.backgroundURI);
    profileChanged ||= (roomInfo.lud16 != postingRoom.lud16);
    profileChanged ||= (roomInfo.isPrivate != postingRoom.isPrivate);
    // if not an owner or admin, only allow changing specific fields
    if(!(a || o)) {
      // if not admin or owner, moderators are restricted to only updating specific fields
      roomInfo.currentSlide = postingRoom.currentSlide ?? 0;
      roomInfo.roomLinks = postingRoom.roomLinks ?? [];
      roomInfo.roomSlides = postingRoom.roomSlides ?? [];
      roomInfo.schedule = (postingRoom.schedule) ? postingRoom.schedule : undefined;
      roomInfo.speakers = postingRoom.speakers ?? roomInfo.moderators;
      roomInfo.kicked = postingRoom.kicked ?? [];
      req.body = roomInfo;
    } else {
      // rule: for a room to be public, user must have an npub
      if (npubs.length == 0) {
        roomInfo.isPrivate = true;
        postingRoom.isPrivate = true;
      }
      // local assignment for common reference for scheduling update below
      roomInfo = postingRoom;
    }
    // set the new update time
    req.body.updateTime = Date.now();
    // nostr scheduling
    if (hasSchedule && scheduleChanged) {
      let n = await publishNostrSchedule(roomId, roomInfo.schedule, roomInfo.moderators, roomInfo.logoURI);
    }
    if (hadSchedule && !hasSchedule) {
      let n = await deleteNostrSchedule(roomId);
    }
    // admin or owner and room is not private
    if ((a||o) && !(roomInfo.isPrivate ?? true)) {
      // set room npub from nsec (is this really necessary?)
      let roomNsec = await getRoomNSEC(roomId);
      const sk = nip19.decode(roomNsec).data;
      const pk = getPublicKey(sk);
      req.body.npub = nip19.npubEncode(pk);  
      // update profile if changed
      if (profileChanged) {
        let n = await updateNostrProfile(roomId, roomInfo.name, roomInfo.description, roomInfo.logoURI, roomInfo.backgroundURI, roomInfo.lud16);
      }
    }

    // ok
    next();
  },
};

const identityAuthenticator = {
  ...permitAllAuthenticator,
  canPost: async (req, res, next) => {
    await initializeServerAdminIfNecessary(req);

    // - force set createdTime and updateTime
    let theTime = Date.now();
    req.body.createdTime = theTime;
    req.body.updateTime = theTime;

    next();
  },
  canPut: async (req, res, next) => {
    if (req.ssrIdentities.length === 0) {
      res.sendStatus(401);
      return;
    }

    if (req.body.identities) {
      try {
        // NOTE: This currently only verifies anon users that give a nevent or note id
        // TODO: Modify ../nostr/nostr.js:verify to support a new verificationInfo type for validating the signature given
        await verifyIdentities(req.body.identities, req.params.id);
      } catch (error) {
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

    // - force set updateTime
    let theTime = Date.now();
    req.body.updateTime = theTime;

    next();
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
