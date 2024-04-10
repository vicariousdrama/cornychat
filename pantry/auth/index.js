const {get, set} = require('../services/redis');
const {permitAllAuthenticator} = require('../routes/controller');
const verifyIdentities = require('../verifications');
const {restrictRoomCreation} = require('../config');
const {getRoomNSEC, publishNostrSchedule, deleteNostrSchedule, updateNostrProfile} = require('../nostr/nostr');
const {nip19, getPublicKey } = require('nostr-tools');

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

const isOwner = async (req, roomId) => {
  if (await isAdmin(req)) return true;
  const roomInfo = await get('rooms/' + roomId);
  if (!roomInfo) return false;
  // TODO: Check req.ssrIdentities, lookup any npubs and compare that way
  return isAnyInList(req.ssrIdentities, (roomInfo.owners ?? []));
};

const isModerator = async (req, roomId) => {
  if (await isAdmin(req)) return true;
  const roomInfo = await get('rooms/' + roomId);
  if (!roomInfo) return false;
  // TODO: Check req.ssrIdentities, lookup any npubs and compare that way
  //return isAnyInList(req.ssrIdentities, roomInfo['moderators']);
  let o = isAnyInList(req.ssrIdentities, (roomInfo.owners ?? []));
  let m = isAnyInList(req.ssrIdentities, (roomInfo.moderators ?? []));
  return o || m;
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

const roomAuthenticator = {
  ...permitAllAuthenticator,
  canPost: async (req, res, next) => {
    if (restrictRoomCreation && !(await isAdmin(req))) {
      res.sendStatus(403);
      return;
    }

    const roomId = req.params.id;
    if (!/^[\w-]{4,}$/.test(roomId)) {
      res.sendStatus(403);
      return;
    }
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
      res.sendStatus(409);
      return;
    }
    // permissions checks
    let a = await isAdmin(req);
    let o = isAnyInList(req.ssrIdentities, (roomInfo.owners ?? []));
    let m = isAnyInList(req.ssrIdentities, (roomInfo.moderators ?? []));
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
      // moderators are restricted to only updating specific fields
      roomInfo.currentSlide = postingRoom.currentSlide ?? 0;
      roomInfo.roomLinks = postingRoom.roomLinks ?? [];
      roomInfo.roomSlides = postingRoom.roomSlides ?? [];
      roomInfo.schedule = (postingRoom.schedule) ? postingRoom.schedule : undefined;
      roomInfo.speakers = postingRoom.speakers ?? roomInfo.moderators;
      req.body = roomInfo;
    } else {
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
    // Set the room npub from nsec
    let roomNsec = await getRoomNSEC(roomId);
    const sk = nip19.decode(roomNsec).data;
    const pk = getPublicKey(sk);
    req.body.npub = nip19.npubEncode(pk);
    // room profile changed
    if ((a||o) && profileChanged && (!roomInfo.isPrivate ?? true)) {
      let n = await updateNostrProfile(roomId, roomInfo.name, roomInfo.description, roomInfo.logoURI, roomInfo.backgroundURI, roomInfo.lud16);
    }

    // ok
    next();
  },
};

const identityAuthenticator = {
  ...permitAllAuthenticator,
  canPost: async (req, res, next) => {
    await initializeServerAdminIfNecessary(req);
    next();
  },
  canPut: async (req, res, next) => {
    if (req.ssrIdentities.length === 0) {
      res.sendStatus(401);
      return;
    }

    if (req.body.identities) {
      try {
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
