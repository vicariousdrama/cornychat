const {get, set} = require('../services/redis');
const {permitAllAuthenticator} = require('../routes/controller');
const verifyIdentities = require('../verifications');
const {restrictRoomCreation} = require('../config');

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

    // OLD WAY
    /*
    if (!(await isModerator(req, roomId))) {
      res.sendStatus(403);
      return;
    }
    */

    // NEW WAY
    const roomInfo = await get('rooms/' + roomId);
    // room must exist to be updated
    if (!roomInfo) {
      console.log("unable to update room: roomInfo does not exist");
      res.sendStatus(403);
      return;
    }
    if(roomInfo.owners == undefined) {
      // add first moderator as owner
      console.log("adding first moderator as room owner");
      roomInfo.owners = [roomInfo.moderators[0]];
    }
    let a = await isAdmin(req);
    let o = isAnyInList(req.ssrIdentities, (roomInfo.owners ?? []));
    let m = isAnyInList(req.ssrIdentities, (roomInfo.moderators ?? []));
    // Must be a moderator to update the room
    if(!m && !a) {
      console.log("must be an admin or moderator to update room");
      res.sendStatus(403);
      return;
    }
    if(!o) {
      // TODO: Moderators should only be able to modify roomLinks, roomSlides, closed

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
