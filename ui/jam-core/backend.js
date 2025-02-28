import {on} from 'minimal-state';
import {staticConfig} from './config';
import {emptyRoom} from './room';
import {populateCache} from '../lib/GetRequest';
import {signData, signedToken} from '../lib/identity-utils';
import reactionEmojis from '../emojis';

export {
  apiUrl,
  populateApiCache,
  get,
  post,
  put,
  putOrPost,
  deleteRequest,
  createRoom,
  updateRoom,
  getRoom,
  recordingsDownloadLink,
  getGifs,
  getMOTD,
  getRoomList,
  getPermanentRoomsList,
  getScheduledEvents,
  getStaticRoomsList,
  getStaticEventsList,
  getMyRoomList,
  getRoomATag,
};

let API = `${staticConfig.urls.pantry}/api/v1`;
on(staticConfig, () => {
  API = `${staticConfig.urls.pantry}/api/v1`;
});

function apiUrl() {
  return API;
}

function populateApiCache(path, data) {
  populateCache(API + path, data);
}

async function authenticatedApiRequest({myIdentity}, method, path, payload) {
  let res = await fetch(API + path, {
    method: method.toUpperCase(),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: payload
      ? JSON.stringify(await signData(myIdentity, payload))
      : undefined,
  });
  return res.ok;
}

// returns [data, ok, status]
async function get(path) {
  let res = await fetch(API + path, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  if (res.status < 400) return [await res.json(), true, res.status];
  else return [undefined, false, res.status];
}

// returns [data, ok, status]
async function authedGet({myIdentity}, path) {
  let res = await fetch(API + path, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Token ${await signedToken(myIdentity)}`,
    },
  });
  if (res.status < 400) return [await res.json(), true, res.status];
  else return [undefined, false, res.status];
}

async function post(state, path, payload) {
  return authenticatedApiRequest(state, 'POST', path, payload);
}

async function put(state, path, payload) {
  return authenticatedApiRequest(state, 'PUT', path, payload);
}

async function putOrPost(state, path, payload) {
  return (
    (await put(state, path, payload)) || (await post(state, path, payload))
  );
}

async function deleteRequest(state, path, payload = null) {
  return authenticatedApiRequest(state, 'DELETE', path, payload);
}

async function createRoom(state, roomId, room = {}) {
  const {
    name = '',
    description = '',
    logoURI = undefined,
    color = 'default',
    stageOnly = false,
    videoCall = false,
    videoEnabled = false,
    isPrivate = true,
    isProtected = false,
    isRecordingAllowed = false,
    roomSlides = [],
    roomLinks = [],
    currentSlide = 0,
    passphraseHash = '',
  } = room;

  const customEmojis = reactionEmojis;

  const customColor = {
    background: `rgba(0,0,0,1)`,
    text: {
      light: '#f4f4f4',
      dark: '#111111',
    },
    buttons: {
      primary: `rgba(0,0,0,1)`,
    },
    avatarBg: `rgba(0,0,0,1)`,
    icons: {
      light: '#f4f4f4',
      dark: '#111111',
    },
  };

  let {myId} = state;
  let newRoom = {
    ...emptyRoom,
    ...room,
    name,
    description,
    logoURI,
    color,
    customEmojis,
    customColor,
    stageOnly: !!stageOnly,
    videoCall: !!videoCall,
    videoEnabled: !!videoEnabled,
    isPrivate: !!isPrivate,
    isProtected: !!isProtected,
    isRecordingAllowed: !!isRecordingAllowed,
    moderators: [myId],
    speakers: [myId],
    owners: [myId],
    roomSlides,
    roomLinks,
    currentSlide,
    passphraseHash,
  };
  let ok = await post(state, `/rooms/${roomId}`, newRoom);
  if (ok) populateCache(API + `/rooms/${roomId}`, newRoom);
  // if (ok) setTimeout(() => populateCache(API + `/rooms/${roomId}`, room), 0);
  return ok;
}

async function updateRoom(state, roomId, room) {
  if (!roomId || !room) return false;
  // don't accept updates that delete the moderator/speaker array
  // (=> explicitly set to [] if that is the intention)
  if (!room?.moderators || !room?.speakers) return false;
  // fetch current state
  let currentroom = await getRoom(roomId);
  // get id from state
  let {myId} = state;
  // check if legacy room
  let islegacy = !currentroom?.updateTime;
  if (islegacy && !room?.owners) {
    // set owner to first moderator in list
    console.log(
      'Assigning first moderator id as room owner',
      currentroom.moderators[0]
    );
    room.owners = [currentroom.moderators[0]];
  }

  // ok to save
  return await put(state, `/rooms/${roomId}`, room);
}

async function getRoom(roomId) {
  if (!roomId) return undefined;
  let currentroom = (await get(`/rooms/${roomId}`))[0];
  // check if legacy room
  let islegacy = !currentroom?.updateTime;
  if (islegacy) {
    // Force update time to a consistent time
    currentroom.updateTime = 1702506180; // Corny Chat Creation Date
    if (!currentroom?.owners) {
      // set owner to first moderator in list
      let firstModerator = currentroom.moderators[0];
      console.log(
        'Assuming first moderator id is the room owner',
        firstModerator
      );
      currentroom.owners = [firstModerator];
    }
  }
  return currentroom;
}

async function recordingsDownloadLink({myIdentity}, roomId) {
  return `${API}/rooms/${roomId}/recordings.zip?token=${await signedToken(
    myIdentity
  )}`;
}

async function getMOTD() {
  return await get(`/motd/`);
}

async function getRoomList() {
  return await get(`/roomlist/`);
}

async function getScheduledEvents() {
  return await get(`/scheduledevents/`);
}

async function getStaticRoomsList() {
  return await get(`/staticrooms/`);
}

async function getStaticEventsList() {
  return await get(`/staticevents/`);
}

async function getPermanentRoomsList() {
  return await get(`/permanentrooms/`);
}

async function getGifs(phrase, cursor) {
  if (cursor) {
    return await get(`/imagepicker/${phrase}/next/${cursor}`);
  } else {
    return await get(`/imagepicker/${phrase}`);
  }
}

async function getMyRoomList(userId) {
  return await get(`/userrooms/${userId}/`);
}

async function getRoomATag(roomId) {
  if (!roomId) return '';
  let aTag = (await get(`/rooms/${roomId}/nip53`))[0];
  return aTag;
}
