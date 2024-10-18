import {is} from 'minimal-state';
import {useEvent, useAction} from '../../lib/state-tree';
import {useStableArray} from '../../lib/state-diff';
import {StoredState} from '../../lib/local-storage';
import {useDidChange} from '../../lib/state-utils';
import {getCache} from '../../lib/GetRequest';
import {actions} from '../state';
import {put, apiUrl} from '../backend';
import {getNpubFromInfo} from '../../nostr/nostr';

export {addSpeaker, removeSpeaker};

export default function Speakers() {
  const leftStageRooms = StoredState('jam.leftStageRooms', () => ({}));
  const leftStageMap = new Map(); // roomId => Set(peerId)

  return function Speakers({
    roomId,
    hasRoom,
    room,
    peerState,
    myPeerState,
    myIdentity,
  }) {
    let leftStagePeers =
      leftStageMap.get(roomId) ??
      leftStageMap.set(roomId, new Set()).get(roomId);

    let {speakers, stageOnly} = room;
    let myId = myIdentity.publicKey;
    let userNpub = getNpubFromInfo(myIdentity.info);

    // did I leave stage? (from localStorage / gets overridden when we are put back on stage while in the room)
    let [isLeaveStage] = useAction(actions.LEAVE_STAGE);
    let justGotRoom = useDidChange(hasRoom) && hasRoom;
    let iAmServerSpeaker = !!stageOnly || speakers.includes(myId) || (userNpub != undefined && speakers.includes(userNpub));
    let iBecameSpeaker =
      useDidChange(iAmServerSpeaker) && iAmServerSpeaker && !justGotRoom;
    if (iBecameSpeaker) {
      is(leftStageRooms, roomId, undefined);
      leftStagePeers.delete(myId);
    }
    if (isLeaveStage) {
      is(leftStageRooms, roomId, true);
      leftStagePeers.add(myId);
    }
    let leftStage = !!leftStageRooms[roomId];
    is(myPeerState, {leftStage}); // announce to peers

    // who else did leave stage? (announced by others via p2p state)
    let [isLeftStage, peerId, state] = useEvent(
      peerState,
      (peerId, state) => state?.leftStage === !leftStagePeers.has(peerId)
    );
    if (isLeftStage) {
      if (state.leftStage) {
        leftStagePeers.add(peerId);
        // if I'm moderator or owner and someone else left stage, I remove him from speakers
        let iAmModerator = room.moderators.includes(myId) || (userNpub != undefined && room.moderators?.includes(userNpub));
        let iAmOwner = room.owners.includes(myId) || (userNpub != undefined && room.owners?.includes(userNpub));
        let iAmAdmin = (localStorage.getItem('iAmAdmin') || 'false') == 'true';
        if ((iAmAdmin || iAmOwner || iAmModerator) && room.speakers.includes(peerId)) {
          removeSpeaker({myIdentity}, roomId, peerId);
        }
      } else {
        leftStagePeers.delete(peerId);
      }
    }
    speakers = useStableArray(speakers.filter(s => !leftStagePeers.has(s)));
    return speakers;
  };
}

function getCachedRoom(roomId) {
  if (!roomId) return null;
  return getCache(`${apiUrl()}/rooms/${roomId}`).data;
}

async function addSpeaker(state, roomId, peerId) {
  let room = getCachedRoom(roomId);
  if (room === null) return false;
  let {speakers = []} = room;
  // if peerid was provided as jamid, look to see if it has an npub and prefer adding that
  let a = false;
  if(peerId.length == 43) {
    let userNpub = getNpubFromInfo(sessionStorage.getItem(peerId));
    if (userNpub != undefined && !speakers.includes(userNpub)) {
      speakers = [...speakers, userNpub];
      a = true;
    }
  }
  if (!a) {
    if (!speakers.includes(peerId)) {
      speakers = [...speakers, peerId];
      a = true;
    }
  }
  // if we added, then push update
  if (a) {
    let newRoom = {...room, speakers};
    return await put(state, `/rooms/${roomId}`, newRoom);
  } else {
    // already added
    return true;
  }
}

async function removeSpeaker(state, roomId, peerId) {
  let room = getCachedRoom(roomId);
  if (room === null) return false;
  let {speakers = []} = room;
  let r = false;
  if (speakers.includes(peerId)) {
    speakers = speakers.filter(id => id !== peerId);
    r = true;
  }
  // peerid can be jamid or npub, but if jamid and user has npub, remove both
  if(peerId.length == 43) {
    let userNpub = getNpubFromInfo(sessionStorage.getItem(peerId));
    if (userNpub != undefined) {
      speakers = speakers.filter(id => id !== userNpub);
      r = true;
    }
  }
  // if we removed, then push update
  if (r) {
    let newRoom = {...room, speakers};
    return await put(state, `/rooms/${roomId}`, newRoom);
  } else {
    // was already removed
    return true;
  }
}
