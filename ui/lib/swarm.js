import SimplePeer from 'https://esm.run/simple-peer-light';
import State from './minimal-state.js';
import signalhub from './signalhub.js';
// if (import.meta.hot) import.meta.hot.decline();
if (!sessionStorage.myPeerId) {
  sessionStorage.myPeerId = randomHex4();
}

// public API starts here

const swarm = State({
  // state
  peers: {},
  myPeerId: sessionStorage.myPeerId,
  connected: false,
  remoteStreams: [], // {stream, name, peerId}, only one per (name, peerId) if name is set
  // internal
  url: '',
  room: '',
  hub: null,
  localStreams: {},
  // events
  stream: null,
  data: null,
});

export default swarm;

swarm.config = (signalhubUrl, room) => {
  swarm.url = signalhubUrl;
  swarm.room = room;
};

swarm.connect = connect;
swarm.disconnect = disconnect;
swarm.reconnect = reconnect;

swarm.addLocalStream = (stream, name) => {
  console.log('addlocalstream', stream, name);
  if (!name) name = randomHex4();
  swarm.localStreams[name] = stream;
  addStreamToPeers(stream, name);
};

// public API ends here

function createPeer(peerId, connId, initiator) {
  let {hub, localStreams, peers, myPeerId} = swarm;
  if (!myPeerId || peerId === myPeerId) return;
  // destroy any existing peer
  let peer = peers[peerId];
  if (peer) {
    console.log('destroying old peer', peerId);
    peer.destroy();
  }
  console.log('creating peer', peerId, connId);

  let streams = Object.values(localStreams).filter(x => x);
  peer = new SimplePeer({
    initiator,
    trickle: false,
    streams,
  });
  peer.peerId = peerId;
  peer.connId = connId;
  peer.streams = {...localStreams};
  peers[peerId] = peer;
  swarm.update('peers');

  peer.on('signal', data => {
    console.log('signaling to', peerId, connId, data.type);
    // tell peer how to identify streams
    // TODO: it may at one point become necessary to use transceiver.mid instead of stream.id
    let remoteStreamIds = [];
    for (let name in peer.streams) {
      let stream = peer.streams[name];
      if (stream) {
        remoteStreamIds.push([name, stream.id]);
      }
    }
    data.meta = {remoteStreamIds};
    hub.broadcast(`signal-${peerId}`, {
      peerId: myPeerId,
      connId: hub.connId,
      yourConnId: connId,
      data,
    });
  });
  peer.on('connect', () => {
    console.log('connected peer', peerId);
    swarm.update('peers');
  });

  peer.on('data', rawData => {
    console.log('data (channel) from', peerId);
    swarm.emit('data', rawData);
  });

  peer.on('stream', stream => {
    let remoteStreamInfo =
      peer.remoteStreamIds &&
      peer.remoteStreamIds.find(([, id]) => id === stream.id);
    let name = remoteStreamInfo && remoteStreamInfo[0];
    let remoteStreams = [...swarm.remoteStreams];
    let i = remoteStreams.findIndex(
      streamObj =>
        streamObj.peerId === peerId && (!name || streamObj.name === name)
    );
    if (i === -1) i = remoteStreams.length;
    remoteStreams[i] = {stream, name, peerId};
    swarm.set('remoteStreams', remoteStreams);
    swarm.emit('stream', stream, name, peer);
  });
  // WARNING: this uses undocumented internals of simple-peer
  peer._pc.addEventListener('track', ({track, transceiver}) => {
    if (track.kind === 'video')
      console.log('got remote video mid', transceiver.mid);
  });

  peer.on('error', err => {
    console.log('error', err);
  });
  peer.on('close', () => {
    removePeer(peerId, peer);
  });
  return peer;
}

function removePeer(peerId, peer) {
  let {peers} = swarm;
  if (!peers[peerId] || (peer && peer !== peers[peerId])) return;
  console.log('removing peer', peerId);
  delete peers[peerId];
  let {remoteStreams} = swarm;
  if (remoteStreams.find(streamObj => streamObj.peerId === peerId)) {
    swarm.set(
      'remoteStreams',
      remoteStreams.filter(streamObj => streamObj.peerId !== peerId)
    );
  }
  swarm.update('peers');
}

function addPeerMetaData(peer, data) {
  if (!data) return;
  try {
    console.log('adding metadata', data);
    for (let key in data) {
      peer[key] = data[key];
    }
  } catch (err) {
    console.error(err);
  }
}

function addStreamToPeers(stream, name) {
  console.log('addStreamToPeers', stream, name);
  let {peers} = swarm;
  console.log('peers', peers);
  for (let peerId in peers) {
    let peer = peers[peerId];
    // TODO maybe some condition for what peers we will add stream? (e.g. only connected peers)
    let oldStream = peer.streams[name];
    let addStream = () => {
      console.log('adding stream to', peerId, name);
      peer.streams[name] = stream;
      if (stream) peer.addStream(stream);
    };
    // console.log(kind, 'old', oldStream, 'new', stream);
    if (oldStream) {
      if (oldStream === stream) return; // avoid error if listener is called twice
      peer.removeStream(oldStream);
      // this code path throws an error if the stream already existed at the peer earlier
      // -- but that shouldn't happen!
      // if it should ever do, maybe we could use replaceTrack() instead of removeStream()
      // in the catch handler
      addStream();
    } else {
      addStream();
    }
  }
}

function connect() {
  // don't auto-reconnect (fixes hot reloading!)
  if (swarm.hub) return;
  if (!swarm.room || !swarm.url) {
    return console.error(
      'Must call swarm.config(url, room) before connecting!'
    );
  }
  let myConnId = randomHex4();
  console.log('connecting. peers', swarm.peers, 'conn id', myConnId);
  let hub = signalhub(swarm.room, swarm.url);
  let {myPeerId} = swarm;
  hub
    .broadcast('connect-me', {
      peerId: myPeerId,
      connId: myConnId,
    })
    .then(() => {
      swarm.set('connected', true);
    })
    .catch(err => {
      console.error('error connecting to signalhub');
      console.error(err);
      disconnect();
    });

  hub.connId = myConnId;
  swarm.hub = hub;

  hub.subscribe('connect-me', ({peerId, connId}) => {
    if (peerId === myPeerId) return;
    console.log('got connect-me', peerId, {peerId, connId});
    if (myPeerId > peerId) {
      console.log('i initiate, and override any previous peer!');
      createPeer(peerId, connId, true);
    } else {
      console.log('i dont initiate, but will prepare a new peer');
      hub.broadcast(`no-you-connect-${peerId}`, {
        peerId: myPeerId,
        connId: myConnId,
        yourConnId: connId,
      });
      console.log('sent no-you-connect', peerId);
      createPeer(peerId, connId, false);
    }
  });

  hub.subscribe(
    `no-you-connect-${myPeerId}`,
    ({peerId, connId, yourConnId}) => {
      if (peerId === myPeerId) return;
      console.log('got no-you-connect', peerId, {peerId, connId, yourConnId});
      if (yourConnId !== myConnId) {
        console.warn('no-you-connect to old connection, should be ignored');
        console.log('ignoring msg to old connection', yourConnId);
      } else {
        // only accept back-connection if connect request was made
        console.log('i initiate, but dont override if i already have a peer');
        // (because no-you-connect can only happen after i sent connect, at which point i couldn't have had peers,
        // so the peer i already have comes from a racing connect from the other peer)
        let {peers} = swarm;
        if (!peers[peerId]) {
          console.log('creating peer because i didnt have one');
          createPeer(peerId, connId, true);
        } else if (peers[peerId].connId !== connId) {
          console.log('creating peer because the connId was outdated');
          createPeer(peerId, connId, true);
        } else {
          console.log('not creating peer');
        }
      }
    }
  );

  hub.subscribe(`signal-${myPeerId}`, ({peerId, data, connId, yourConnId}) => {
    console.log('signal received from', peerId, connId, data.type);
    if (yourConnId !== myConnId) {
      console.warn('signal to old connection, should be ignored');
      console.log('ignoring msg to old connection', yourConnId);
      return;
    }
    let peer = swarm.peers[peerId];
    if (peer && !peer.destroyed) {
      addPeerMetaData(peer, data.meta);
      peer.signal(data);
    } else {
      console.log('no peer to receive signal');
      if (data && data.type === 'offer') {
        console.log('i got an offer and will create a new peer to receive it');
        peer = createPeer(peerId, connId, false);
        addPeerMetaData(peer, data.meta);
        peer.signal(data);
      }
    }
  });
}

function disconnect() {
  let {hub, peers} = swarm;
  if (hub) hub.close();
  swarm.hub = null;
  swarm.set('connected', false);
  for (let peerId in peers) {
    try {
      peers[peerId].destroy();
      removePeer(peerId);
    } catch (e) {}
  }
}

function reconnect() {
  disconnect();
  connect();
}

function randomHex4() {
  return ((Math.random() * 16 ** 4) | 0).toString(16).padStart(4, '0');
}