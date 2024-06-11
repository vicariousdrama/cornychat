import {is} from 'minimal-state';
import {declare, merge, use, useAction} from '../lib/state-tree';
import Swarm from '../lib/swarm';
import {StoredState} from '../lib/local-storage';

import {Identity} from './identity';
import {actions} from './state';
import {AudioState} from './audio';
import {VideoState} from './video';
import {BackChannel} from './backchannel';
import {Reactions} from './reactions';
import {TextChat} from './textchat';
import {RoomState} from './room';
import ModeratorState from './room/ModeratorState';
import ConnectMedia from './connections/ConnectMedia.js';
import ConnectRoom from './connections/ConnectRoom';
import {useStableArray, useStableObject} from '../lib/state-diff';
import {ServerRecording} from './serverRecording.js';
import BroadcastReceiver from './connections/BroadcastReceiver.js';

export default function AppState({hasMediasoup, hasBroadcast}) {
  const swarm = Swarm();
  const {peerState, myPeerState} = swarm;
  is(myPeerState, {
    inRoom: false,
    micMuted: true,
    leftStage: false,
    isRecording: false,
    camOn: false,
    shareScreen: false,
    handRaised: false,
    handType: '',
    passphraseHash: '',
  });

  return function AppState({
    roomId,
    userInteracted,
    micMuted,
    handRaised,
    handType,
    autoJoin,
    autoRejoin,
    customStream,
    passphraseHash,
  }) {
    let myIdentity = use(Identity, {swarm, roomId});
    if (!myIdentity) return {swarm};
    let myId = myIdentity.publicKey;

    // {roomId, room, hasRoom, isRoomLoading, iAmSpeaker, iAmModerator} = roomState
    let roomState = use(RoomState, {
      roomId,
      myIdentity,
      peerState,
      myPeerState,
    });
    let {room, iAmSpeaker, iAmModerator, iAmOwner, iAmPresenter, hasRoom} = roomState;
    let inRoom = use(InRoom, {roomState, autoJoin, autoRejoin});

    declare(ModeratorState, {swarm, moderators: room.moderators, owners: room.owners, handRaised, handType});

    let remoteStreams = use(ConnectMedia, {
      roomState,
      hasMediasoup,
      hasBroadcast,
      swarm,
    });

    let broadcastPlayers = use(BroadcastReceiver, {
      swarm,
      roomId,
      roomState,
      peerState,
      inRoom,
      shouldReceive: userInteracted && hasBroadcast && !iAmSpeaker,
    });

    is(myPeerState, {micMuted, inRoom: !!inRoom, handType, passphraseHash});
    declare(Reactions, {swarm});
    declare(TextChat, {swarm});

    return merge(
      {swarm, micMuted, handRaised, handType, passphraseHash, inRoom, myId, myIdentity, remoteStreams},
      roomState,
      declare(PeerState, {swarm}),
      declare(ConnectRoom, {
        roomId,
        hasRoom,
        inRoom,
        swarm,
        myIdentity,
        roomState,
        handRaised,
        handType,
        passphraseHash,
      }),
      declare(AudioState, {
        myId,
        inRoom,
        iAmSpeaker,
        iAmModerator,
        moderators: room.moderators,
        iAmOwner,
        owners: room.owners,
        swarm,
        remoteStreams,
        broadcastPlayers,
        userInteracted,
        micMuted,
        handRaised,
        handType,
        passphraseHash,
        customStream,
      }),
      declare(VideoState, {
        inRoom,
        iAmPresenter,
        remoteStreams,
      }),
      declare(BackChannel, {swarm, myId}),
      declare(ServerRecording, {swarm})
    );
  };
}

function PeerState({swarm}) {
  let peers = useStableArray(Object.keys(use(swarm, 'peers') ?? {}));
  let peerState = useStableObject({...use(swarm, 'peerState')});
  let myPeerState = useStableObject({...use(swarm, 'myPeerState')});
  return {peers, peerState, myPeerState};
}

function InRoom() {
  let inRoom = null;
  let autoJoinCount = 0;
  let didAutoJoin = false;
  const joinedRooms = StoredState('jam.joinedRooms', () => ({}));

  return function InRoom({roomState, autoJoin, autoRejoin}) {
    let {
      roomId,
      hasRoom,
      room: {closed},
      iAmModerator,
      iAmOwner,
    } = roomState;

    let [isJoinRoom, joinedRoomId] = useAction(actions.JOIN);
    let [isAutoJoin] = useAction(actions.AUTO_JOIN);
    if ((isAutoJoin || (autoJoin && !didAutoJoin)) && autoJoinCount === 0) {
      didAutoJoin = true;
      autoJoinCount = 1;
    }

    if (!roomId || (closed && !iAmOwner)) {
      inRoom = null;
    } else {
      if (isJoinRoom) {
        inRoom = joinedRoomId; // can be null, for leaving room
      } else if (autoRejoin && hasRoom && joinedRooms[roomId]) {
        inRoom = roomId;
      }
      if (autoJoinCount > 0 && hasRoom) {
        autoJoinCount--;
        inRoom = roomId;
      }
    }

    if (autoRejoin) is(joinedRooms, roomId, inRoom !== null || undefined);
    return inRoom;
  };
}
