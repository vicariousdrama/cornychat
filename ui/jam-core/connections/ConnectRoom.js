import log from '../../lib/causal-log';
import {signData, verifyData} from '../../lib/identity-utils';
import {
  declare,
  useDispatch,
  useEvent,
  useOn,
  useState,
  useUpdate,
} from '../../lib/state-tree';
import {get, populateApiCache} from '../backend';
import {staticConfig} from '../config';
import {actions} from '../state';
import {DISCONNECTED, INITIAL} from '../../lib/swarm-health';
import {useStableObject} from '../../lib/state-diff';
import {StoredState} from '../../lib/local-storage.js';
import {useJam} from '../../jam-core-react';

export default function ConnectRoom({myIdentity, swarm}) {
  let connectedRoomId = null;
  configSwarmIdentity(swarm, myIdentity);
  configSwarm(swarm, staticConfig);
  useOn(staticConfig, () => configSwarm(swarm, staticConfig));

  const identities = {};
  let update = useUpdate();

  return function ConnectRoom({
    roomId,
    hasRoom,
    inRoom,
    myIdentity,
    roomState,
    handRaised,
    handType,
    passphraseHash,
  }) {
    let myId = myIdentity.publicKey;
    let shouldConnect = hasRoom && roomId && roomState.iAmAuthorized;

    if (shouldConnect) {
      if (
        swarm.connectState === INITIAL ||
        swarm.connectState === DISCONNECTED ||
        roomId !== swarm.room ||
        myId !== swarm.myPeerId
      ) {
        connectedRoomId = roomId;
        swarm.config({
          sign: data => signData(myIdentity, data),
        });
        swarm.connect(roomId, myId, passphraseHash);
      }
    } else {
      if (swarm.connectState !== INITIAL) {
        connectedRoomId = null;
        swarm.disconnect();
      }
    }

    let {peerEvent, serverEvent} = swarm;

    // collect real-time peer identity info
    let [isNewPeer, id] = useEvent(swarm, 'newPeer');
    if (isNewPeer) {
      (async () => {
        for (let i = 0; i < 5; i++) {
          // try multiple times to lose race with the first POST /identities
          let [data, ok] = await get(`/identities/${id}`);
          if (ok) {
            identities[id] = data;
            // push to session storage
            sessionStorage.setItem(id, JSON.stringify(data));
            update();
            return;
          } else {
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      })();
    }
    let [isIdentityUpdate, peerId, data] = useEvent(
      peerEvent,
      'identity-update'
    );
    if (isIdentityUpdate) {
      identities[peerId] = data;
    }
    // merge in real-time room info
    let [isRoomUpdate, room] = useEvent(serverEvent, 'room-info');
    if (isRoomUpdate) {
      if (window.DEBUG) log('new room info', room);
      if (connectedRoomId !== null) {
        populateApiCache(`/rooms/${connectedRoomId}`, room);
        // 20250323-stick
        if ((room.isTS ?? false) && room.tsID != myId) {
          if (window.DEBUG)
            log(
              'room has a talking stick, and im not the current one holding it. mute me!'
            );
          const selectedMicrophoneState = StoredState('jam.selectedMicrophone');
          if (window.DEBUG) log(selectedMicrophoneState);
          const constraints = !!selectedMicrophoneState.deviceId
            ? {audio: {deviceId: {exact: selectedMicrophoneState.deviceId}}}
            : {video: false, audio: true};
          (async () => {
            let stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (window.DEBUG) log(stream);
            stream.getTracks().forEach(track => track.stop());
            // const [state, {setProps}] = useJam();
            // setProps('micMuted', true);
            let dispatch = useDispatch();
            // dispatch(actions.RETRY_MIC);
            // dispatch(actions.RETRY_AUDIO);
          })();
        }
      }
    }

    return {
      identities: useStableObject({...identities}),
      otherDeviceInRoom: declare(OtherDeviceInRoom, {swarm, inRoom, myId}),
    };
  };
}

function OtherDeviceInRoom({swarm, inRoom, myId}) {
  let [otherDeviceInRoom, setState] = useState(false);
  let dispatch = useDispatch();
  // leave room when same peer joins from other device
  let [isMyConnection, myConnState] = useEvent(swarm.connectionState, myId);
  if (isMyConnection) {
    if (myConnState === undefined) {
      otherDeviceInRoom = false;
    } else {
      let {states, latest} = myConnState;
      let {myConnId} = swarm;
      otherDeviceInRoom = false;
      for (let connId in states) {
        if (connId !== myConnId && states[connId].state.inRoom) {
          otherDeviceInRoom = true;
          if (connId === latest && inRoom) {
            dispatch(actions.JOIN, null);
          }
          break;
        }
      }
    }
    setState(otherDeviceInRoom);
  }
  return otherDeviceInRoom;
}

function configSwarmIdentity(swarm, myIdentity) {
  let myId = myIdentity.publicKey;
  swarm.config({
    myPeerId: myId,
    sign: data => signData(myIdentity, data),
    verify: verifyData,
  });
}

function configSwarm(swarm, staticConfig) {
  swarm.config({
    url: staticConfig.urls.pantry,
    autoConnect: false,
    debug: staticConfig.development,
    reduceState: (_states, _current, latest, findLatest) => {
      if (latest.inRoom) return latest;
      return findLatest(s => s.inRoom) ?? latest;
    },
    pcConfig: {
      iceTransportPolicy: 'all',
      iceServers: [
        // {urls: `stun:stun.jam.systems:3478`},
        {urls: [`${staticConfig.urls.stun}`]}, //, `stun:coturn.jam.systems:3478`]},
        {
          ...staticConfig.urls.turnCredentials,
          urls: `${staticConfig.urls.turn}`,
        },
      ],
    },
  });
}
