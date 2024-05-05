import {apiUrl, put} from '../backend';
import {getCache} from '../../lib/GetRequest.js';

export {addPresenter, removePresenter};

function getCachedRoom(roomId) {
  if (!roomId) return null;
  return getCache(`${apiUrl()}/rooms/${roomId}`).data;
}

async function addPresenter(state, roomId, peerId) {
  let room = getCachedRoom(roomId);
  if (room === null) return false;
  let {presenters = []} = room;
  // if peerid was provided as jamid, look to see if it has an npub and prefer adding that
  let a = false;
  if(peerId.length == 43) {
    let userNpub = getNpubFromInfo(sessionStorage.getItem(peerId));
    if (userNpub != undefined && !presenters.includes(userNpub)) {
      presenters = [...presenters, userNpub];
      a = true;
    }
  }
  if (!a) {
    if (!presenters.includes(peerId)) {
      presenters = [...presenters, peerId];
      a = true;
    }
  }
  // if we added, then push update
  if (a) {
    let newRoom = {...room, presenters};
    return await put(state, `/rooms/${roomId}`, newRoom);
  } else {
    // already added
    return true;
  }
}

async function removePresenter(state, roomId, peerId) {
  let room = getCachedRoom(roomId);
  if (room === null) return false;
  let {presenters = []} = room;
  let r = false;
  if (presenters.includes(peerId)) {
    presenters = presenters.filter(id => id !== peerId);
    r = true;
  }
  // peerid can be jamid or npub, but if jamid and user has npub, remove both
  if(peerId.length == 43) {
    let userNpub = getNpubFromInfo(sessionStorage.getItem(peerId));
    if (userNpub != undefined) {
      presenters = presenters.filter(id => id !== userNpub);
      r = true;
    }
  }
  // if we removed, then push update
  if (r) {
    let newRoom = {...room, presenters};
    return await put(state, `/rooms/${roomId}`, newRoom);
  } else {
    // was already removed
    return true;
  }
}
