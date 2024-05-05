import {put, post, signNostrEvent, apiUrl} from './backend';
import {staticConfig} from './config';
import {use} from '../lib/state-tree';
import GetRequest, {getCache} from '../lib/GetRequest';
import {useStableObject} from '../lib/state-diff';
import Speakers from './room/Speakers';
import {getNpubFromInfo} from '../nostr/nostr';

export {
  RoomState,
  addModerator,
  removeModerator,
  emptyRoom,
  addNostrPrivateKey,
  signEvent,
  setCurrentSlide,
  addOwner,
  removeOwner,
};
export {addSpeaker, removeSpeaker} from './room/Speakers';
export {addPresenter, removePresenter} from './room/Presenters';

function RoomState({roomId, myIdentity, peerState, myPeerState}) {
  const path = roomId && `${apiUrl()}/rooms/${roomId}`;
  let {data, isLoading} = use(GetRequest, {path});
  let hasRoom = !!data;
  let room = data ?? emptyRoom;
  let {moderators, owners, presenters, stageOnly, videoCall, videoEnabled} = room;
  let myId = myIdentity.publicKey;
  let accessRestricted = !!room.access?.identities;

  let speakers = use(Speakers, {
    roomId,
    hasRoom,
    room,
    peerState,
    myPeerState,
    myIdentity,
  });

  room = useStableObject({...room, speakers});

  let userNpub = getNpubFromInfo(myIdentity.info);
  let iAmModerator = moderators.includes(myId) || (userNpub != undefined && moderators?.includes(userNpub));
  let iAmOwner = owners?.includes(myId) || (userNpub != undefined && owners?.includes(userNpub)) || false;
  let iAmSpeaker = !!stageOnly || speakers.includes(myId) || (userNpub != undefined && speakers?.includes(userNpub));
  let iAmPresenter = !!videoCall || (presenters && presenters.includes(myId)) || (videoEnabled && iAmSpeaker) || (userNpub != undefined && presenters?.includes(userNpub));
  let iAmAuthorized = !accessRestricted || room.access?.identities.includes(myId) || (userNpub != undefined && room.access?.identities.includes(userNpub));

  return {
    roomId,
    room,
    hasRoom,
    isRoomLoading: isLoading,
    iAmSpeaker,
    iAmModerator,
    iAmOwner,
    iAmAuthorized,
    iAmPresenter,
  };
}

const emptyRoom = {
  name: '',
  description: '',
  ...(staticConfig.defaultRoom ?? null),
  speakers: [],
  moderators: [],
  presenters: [],
  owners: [],
  roomSlides: [],
  roomLinks: [],
  currentSlide: 0,
};

function getCachedRoom(roomId) {
  if (!roomId) return null;
  return getCache(`${apiUrl()}/rooms/${roomId}`).data;
}

async function addModerator(state, roomId, peerId) {
  let room = getCachedRoom(roomId);
  if (room === null) return false;
  let {moderators = []} = room;
  let a = false;
  if(peerId.length == 43) {
    let userNpub = getNpubFromInfo(sessionStorage.getItem(peerId));
    if (userNpub != undefined && !moderators.includes(userNpub)) {
      moderators = [...moderators, userNpub];
      a = true;
    }
  }
  if (!a) {
    if (!moderators.includes(peerId)) {
      moderators = [...moderators, peerId];
      a = true;
    }
  }
  // if we added, then push update
  if (a) {
    let newRoom = {...room, moderators};
    return await put(state, `/rooms/${roomId}`, newRoom);
  } else {
    // already added
    return true;
  }
}

async function removeModerator(state, roomId, peerId) {
  let room = getCachedRoom(roomId);
  if (room === null) return false;
  let {moderators = []} = room;
  let r = false;
  if (moderators.includes(peerId)) {
    moderators = moderators.filter(id => id !== peerId);
    r = true;
  }
  // peerid can be jamid or npub, but if jamid and user has npub, remove both
  if(peerId.length == 43) {
    let userNpub = getNpubFromInfo(sessionStorage.getItem(peerId));
    if (userNpub != undefined) {
      moderators = moderators.filter(id => id !== userNpub);
      r = true;
    }
  }
  // if we removed, then push update
  if (r) {
    let newRoom = {...room, moderators};
    return await put(state, `/rooms/${roomId}`, newRoom);
  } else {
    // was already removed
    return true;
  }
}

async function addOwner(state, roomId, peerId) {
  let room = getCachedRoom(roomId);
  if (room === null) return false;
  let {owners = []} = room;
  let a = false;
  if(peerId.length == 43) {
    let userNpub = getNpubFromInfo(sessionStorage.getItem(peerId));
    if (userNpub != undefined && !owners.includes(userNpub)) {
      owners = [...owners, userNpub];
      a = true;
    }
  }
  if (!a) {
    if (!owners.includes(peerId)) {
      owners = [...owners, peerId];
      a = true;
    }
  }
  // if we added, then push update
  if (a) {
    let newRoom = {...room, owners};
    return await put(state, `/rooms/${roomId}`, newRoom);
  } else {
    // already added
    return true;
  }
}

async function removeOwner(state, roomId, peerId) {
  console.log('in removeOwner');
  console.log(`roomid = ${roomId}`);
  let room = getCachedRoom(roomId);
  console.log(`removeOwner room: ${room}`)
  if (room === null) return false;
  let {owners = []} = room;
  console.log(`removeOwner owners before: ${owners}`)
  let r = false;
  if (owners.includes(peerId)) {
    console.log(`removeOwner removing peerId from owners`);
    let owners2 = owners.filter(id => id !== peerId);
    owners = owners2;
    console.log(`removed ${peerId} from owners list`);
    r = true;
  }
  // peerid can be jamid or npub, but if jamid and user has npub, remove both
  if(peerId.length == 43) {
    console.log(`removeOwner checking for npub`);
    let userNpub = getNpubFromInfo(sessionStorage.getItem(peerId));
    if (userNpub != undefined) {
      console.log(`removeOwner will remove an npub if it exists`);
      let owners2 = owners.filter(id => id !== userNpub);
      owners = owners2;
      console.log(`removed ${userNpub} from owners list`);
      r = true;
    }
  }
  // if we removed, then push update
  if (r) {
    console.log('saving new room state');
    let newRoom = {...room, owners};
    return await put(state, `/rooms/${roomId}`, newRoom);
  } else {
    // was already removed
    console.log(`removeOwner .. ${peerId} was not present`);
    return true;
  }
}

async function addNostrPrivateKey(state, roomId, payload) {
  return await post(state, `/rooms/${roomId}/privatekeys`, payload);
}

async function signEvent(state, roomId, event) {
  const payload = [state.myId, event];
  return await signNostrEvent(state, `/rooms/${roomId}/sign`, payload);
}

// TODO: Convert to new endpoint and migrate slide data out of room settings
async function setCurrentSlide(state, roomId, slideNumber) {
  let room = getCachedRoom(roomId);
  if (room === null) return false;
  let newRoom = {...room, currentSlide: slideNumber};
  return await put(state, `/rooms/${roomId}`, newRoom);
}
