const WebSocket = require('ws');
const querystring = require('querystring');
const {get, set, del} = require('../services/redis');
const {ssrVerifyToken} = require('../ssr');
const {saveCSAR} = require('../nostr/csar');
const {getNpubs} = require('../nostr/nostr');
const {grantPubkeyToRelays} = require('../relayacl/relayACL');

module.exports = {
  addWebsocket,
  activeUserCount,
  activeUsers,
  activeUsersInRoom,
  broadcast,
  sendRequest,
  sendDirect,
};

const VERIFY_BUILDDATE_ONSOCKET = true;
const VERIFY_BUILDDATE_ONENTRY = true;
const VERIFY_BUILDDATE_ONPING = false;

// pub sub websocket

const REQUEST_TIMEOUT = 20000;
const reservedTopics = ['server', 'peers', 'add-peer', 'remove-peer'];

function broadcast(roomId, topic, message) {
  publish(roomId, 'server', {t: 'server', d: {t: topic, d: message}});
}

async function sendDirect(roomId, peerId, topic, message) {
  let connection = getConnections(roomId).find(c => c.peerId === peerId);
  if (connection === undefined) throw Error('Peer is not connected');
  sendMessage(connection, {t: 'server', d: {t: topic, d: message}});
}

async function sendRequest(roomId, peerId, topic, message) {
  let connection = getConnections(roomId).find(c => c.peerId === peerId);
  if (connection === undefined) throw Error('Peer is not connected');
  let {id, promise} = newRequest();
  sendMessage(connection, {t: 'server', d: {t: topic, d: message}, r: id});
  return promise;
}

// allows forward-server to create an equivalent sendDirect / sendRequest interface
function handleMessageFromServer(serverConnection, msg) {
  let {t: topic, d: data, r: requestId, ro: roomId, p: receiverId} = msg;
  let connection = getConnections(roomId).find(c => c.peerId === receiverId);
  if (connection === undefined) {
    console.error(
      "Peer is not connected, can't forward message to them",
      roomId,
      receiverId
    );
    return;
  }
  if (topic === 'response') {
    sendMessage(connection, {t: 'response', d: data, r: requestId});
  } else if (requestId === undefined) {
    sendMessage(connection, {t: 'server', d: {t: topic, d: data}});
  } else {
    newForwardRequest(serverConnection, requestId);
    sendMessage(connection, {
      t: 'server',
      d: {t: topic, d: data},
      r: requestId,
    });
  }
}

async function handleMessage(connection, roomId, msg) {
  // TODO: allow unsubscribe
  let {s: subscribeTopics, t: topic, d: data} = msg;
  let senderId = connection.peerId;
  if (subscribeTopics !== undefined) {
    subscribe(connection, roomId, subscribeTopics);
  }

  if (topic === undefined || reservedTopics.includes(topic)) return;

  switch (topic) {
    // special topics (not subscribable)
    // messages to server
    case 'response': {
      let {r: requestId} = msg;
      requestAccepted(requestId, data);
      break;
    }
    case 'mediasoup': {
      let {r: requestId} = msg;
      forwardMessage(topic, {
        t: topic,
        d: data,
        ro: roomId,
        r: requestId,
        p: senderId,
      });
      break;
    }
    // messages where sender decides who gets it
    case 'direct': {
      // send to one specific peer
      let {p: receiverId} = msg;
      let receiver = getConnections(roomId).find(c => c.peerId === receiverId);
      if (receiver !== undefined) {
        sendMessage(receiver, {t: 'direct', d: data, p: senderId});
      }
      if (data.type != undefined) {
        if (data.type == 'peer-event') {
          if (data.data != undefined && data.data.t != undefined) {
            if (data.data.t == 'text-chat') {
              if (data.data.d != undefined && data.data.d.t != undefined) {
                let t = data.data.d.t;
                if (t.length > 0) {
                  saveCSAR(senderId, roomId, 'sendprivatemessage');
                }
              }
            }
          }
        }
      }
      break;
    }
    case 'moderator': {
      // send to all mods
      let outgoingMsg = {t: 'direct', d: data, p: senderId};
      let {moderators = [], owners = []} = (await get('rooms/' + roomId)) ?? {};
      for (let receiver of getConnections(roomId)) {
        let rpubkey = getPublicKey(receiver);
        if (moderators.includes(rpubkey) || owners.includes(rpubkey)) {
          sendMessage(receiver, outgoingMsg);
        }
      }
      break;
    }
    case 'csar': {
      saveCSAR(senderId, roomId, data);
      break;
    }
    case 'all': {
      publish(roomId, topic, {t: topic, d: data, p: senderId});
      if (data.type != undefined) {
        if (data.type == 'peer-event') {
          if (data.data != undefined && data.data.t != undefined) {
            if (data.data.t == 'reaction') {
              if (
                data.data.d != undefined &&
                typeof data.data.d == 'string' &&
                data.data.d == '🌽'
              ) {
                saveCSAR(senderId, roomId, 'sendcorn');
              }
              if (
                data.data.d != undefined &&
                typeof data.data.d == 'object' &&
                data.data.d.reaction != undefined &&
                typeof data.data.d.reaction == 'string' &&
                data.data.d.reaction == '🌽'
              ) {
                saveCSAR(senderId, roomId, 'sendcorn');
              }
            }
            if (data.data.t == 'text-chat') {
              if (data.data.d != undefined && data.data.d.t != undefined) {
                let t = data.data.d.t;
                if (t.indexOf('tipped the room owner ⚡') > -1) {
                  saveCSAR(senderId, roomId, 'tiproom');
                }
                if (t.indexOf('tipped the corny chat dev ⚡') > -1) {
                  saveCSAR(senderId, roomId, 'tipdev');
                }
                if (t.indexOf('zapped ⚡') > -1) {
                  if (t.indexOf('to the room goal') > -1) {
                    saveCSAR(senderId, roomId, 'zaproomgoal');
                  }
                  if (t.indexOf('to the dev') > -1) {
                    saveCSAR(senderId, roomId, 'zapservergoal');
                  }
                }
                if (t.indexOf('cashu') == 0) {
                  saveCSAR(senderId, roomId, 'sendcashu');
                }
                let spoilermatches = t.match(/\|\|(.*?)\|\|/);
                if (spoilermatches) {
                  saveCSAR(senderId, roomId, 'sendspoiler');
                }
              }
            }
          }
        }
        if (data.type == 'shared-state') {
          if (data.data != undefined && data.data.state != undefined) {
            if (data.data.state.handType != undefined) {
              if (data.data.state.handType == 'RH') {
                saveCSAR(senderId, roomId, 'sethandup');
              }
              if (data.data.state.handType == 'TU') {
                saveCSAR(senderId, roomId, 'setthumbup');
              }
              if (data.data.state.handType == 'TD') {
                saveCSAR(senderId, roomId, 'setthumbdown');
              }
            }
          }
        }
      }
      break;
    }
    default:
      //console.log(`in pantry services/ws.js handleMessage topic ${topic}, data: ${data}`);
      // normal topic that everyone can subscribe
      publish(roomId, topic, {t: topic, d: data, p: senderId});
  }
}

const PING_CHECK_INTERVAL = 5000;
const PING_MAX_INTERVAL = 25000;

function handleConnection(ws, req) {
  let {roomId, peerId, subs, bd} = req;

  if (roomId === '~forward') {
    handleForwardingConnection(ws, req);
    return;
  }

  // 20240410 - Check that build date is provided in the connection `bd` querystring. Older clients
  // wont provide so we drop those connections instead of adding and publishing as a valid peer.
  // This prevents them from being counted as active in room, affecting counts and ghost users at
  // the door. They will however immediately attempt to reconnect.
  if (VERIFY_BUILDDATE_ONENTRY) {
    if (!bd) {
      let errmsg = 'client version not set. disconnecting';
      console.log(
        `[handleConnection] killing ws as no build date provided`,
        roomId,
        peerId
      );
      ws.send(JSON.stringify({t: 'error', d: errmsg}));
      ws.close();
      return;
    }
    if (bd != 'BUILD_DATE'.split('.')[0]) {
      let errmsg = 'client version contains unexpected value. disconnecting';
      console.log(
        `[handleConnection] killing ws as ping build date was invalid`,
        roomId,
        peerId,
        bd
      );
      ws.send(JSON.stringify({t: 'error', d: errmsg}));
      ws.close();
      return;
    }
  }

  //console.log('[handleConnection] ws open', roomId, peerId, subs); // ws open mainchat 9v32sRPpNqbpe0RYLlYdjtTeOxqXoMIvdpqTB3GQ1OM.da4f [ 'all' ]
  let lastPing = Date.now();
  let pingCount = 0;
  let interval = setInterval(() => {
    let timeSinceClientPing = Date.now() - lastPing;
    //console.log(`[handleConnection] timeSinceClientPing: ${timeSinceClientPing} from peer: ${peerId}`);
    if (timeSinceClientPing > PING_MAX_INTERVAL) {
      let errmsg = `client response time exceeds max time allowed (${timeSinceClientPing}ms > ${PING_MAX_INTERVAL} ms). disconnecting`;
      console.log(
        `[handleConnection] killing ws after ${timeSinceClientPing}ms`,
        roomId,
        peerId
      );
      ws.send(JSON.stringify({t: 'error', d: errmsg}));
      ws.close();
      closeWs();
    }
    const userId = peerId.split('.')[0];
    // 10 minutes in, track it
    if (pingCount % 120 == 119) {
      saveCSAR(userId, roomId, 'useroom');
    }
    // 45 seconds in, track it
    if (pingCount % 60 == 9) {
      const recordTime = async () => {
        let dt = new Date();
        let dti = dt.toISOString();
        let dts = dti.replaceAll('-', '').replace('T', '').slice(0, 10);
        // add to room
        let k = `usagetracking/${dts}/${roomId}`;
        let v = await get(k);
        if (v == undefined || v == null) {
          set(k, [userId]);
        } else if (!v.includes(userId)) {
          v.push(userId);
          set(k, v);
        }
        // track room accessed
        set(`activity/rooms/${roomId}/last-accessed`, Date.now());
        // track for user
        let dtm = dti.replaceAll('-', '').replace('T', '').slice(0, 6);
        let dtd = dti.replaceAll('-', '').replace('T', '').slice(6, 8);
        let dth = dti.replaceAll('-', '').replace('T', '').slice(8, 10);
        k = `usertracking/${userId}/${dtm}`;
        v = await get(k);
        if (v == undefined || v == null) {
          // not yet set for the month, initialize
          v = {};
          v[dtd] = [dth];
          set(k, v);
        } else {
          if (v.hasOwnProperty(dtd)) {
            // has day...
            if (!v[dtd].includes(dth)) {
              // but not the hour, add it
              v[dtd].push(dth);
              set(k, v);
            }
          } else {
            // does not have day
            v[dtd] = [dth];
            set(k, v);
          }
        }
      };
      recordTime();
    }
  }, PING_CHECK_INTERVAL);

  const connection = {ws, peerId};

  addPeer(roomId, connection);

  // inform every participant about new peer connection
  publish(roomId, 'add-peer', {t: 'add-peer', d: peerId});
  publishToServers({t: 'add-peer', d: peerId, ro: roomId});

  // auto subscribe to updates about connected peers
  subscribe(connection, roomId, reservedTopics);
  if (subs !== undefined) subscribe(connection, roomId, subs);

  // inform about peers immediately
  sendMessage(connection, {t: 'peers', d: getPeers(roomId)});

  ws.on('message', jsonMsg => {
    let msg = parseMessage(jsonMsg);
    // console.log('[handleConnection] ws message', msg);
    if (msg !== undefined) {
      if (msg.t === 'ping') {
        if (VERIFY_BUILDDATE_ONPING) {
          // 20240410 - check that build date is provided in the periodic ping.
          // older clients wont do this and we want to drop those connections
          let b = msg.b;
          if (!b) {
            let errmsg = 'client version not set. disconnecting';
            console.log(
              `[handleConnection] killing ws as no build date provided`,
              roomId,
              peerId
            );
            ws.send(JSON.stringify({t: 'error', d: errmsg}));
            ws.close();
            closeWs();
            return;
          } else {
            if (b.split('.')[0] != 'BUILD_DATE'.split('.')[0]) {
              let errmsg =
                'client version contains unexpected value. disconnecting';
              console.log(
                `[handleConnection] killing ws as ping build date was invalid`,
                roomId,
                peerId,
                b
              );
              ws.send(JSON.stringify({t: 'error', d: errmsg}));
              ws.close();
              closeWs();
              return;
            }
          }
        }
        pingCount = pingCount + 1;
        lastPing = Date.now();
      } else {
        handleMessage(connection, roomId, msg);
      }
    }
  });

  ws.on('close', closeWs);

  ws.on('error', error => {
    console.log('[handleConnection] ws error', error);
  });

  async function closeWs() {
    clearInterval(interval);
    console.log('[closeWs] ws closed', roomId, peerId);
    removePeer(roomId, connection);
    unsubscribeAll(connection);
    //removeKeys(roomId, peerId);

    publish(roomId, 'remove-peer', {t: 'remove-peer', d: peerId});
    publishToServers({t: 'remove-peer', d: peerId, ro: roomId});
  }
}

function handleForwardingConnection(ws, req) {
  let {peerId: serverId, subs: topics} = req;
  console.log(
    '[handleForwardingConnection] ws start forwarding',
    serverId,
    topics
  );

  const connection = {ws, serverId};

  addForwardServer(connection, topics);

  ws.on('message', jsonMsg => {
    let msg = parseMessage(jsonMsg);
    if (msg !== undefined) handleMessageFromServer(connection, msg);
  });

  ws.on('close', () => {
    removeForwardServer(connection);
  });

  ws.on('error', error => {
    console.log('[handleForwardingConnection] ws error', error);
  });
}

function activeUserCount() {
  return [...roomConnections.keys()]
    .map(roomId => activeUsersInRoom(roomId).length)
    .reduce((aggregate, current) => aggregate + current, 0);
}
function activeUsersInRoom(roomId) {
  let peersInRoom = getPeers(roomId).map(
    combinedPeerId => combinedPeerId.split('.')[0]
  );
  // make list unique
  return [...new Set(peersInRoom)];
}
function activeUsers() {
  let activeUsersList = [...roomConnections.keys()]
    .map(roomId => activeUsersInRoom(roomId))
    .reduce((peerList, currentRoomPeers) => {
      for (let crp of currentRoomPeers) {
        if (!peerList.includes(crp)) {
          peerList.push(crp);
        }
      }
      return peerList;
    }, []);
  return activeUsersList;
}

// ws server, handles upgrade requests for http server

function addWebsocket(server) {
  if (VERIFY_BUILDDATE_ONSOCKET) {
    console.log(
      '[addWebSocket] ws socket server configuring to verify that clients connect with build date: ',
      'BUILD_DATE'.split('.')[0]
    );
  }

  const wss = new WebSocket.Server({noServer: true});
  wss.on('connection', handleConnection);

  server.on('upgrade', async (req, socket, head) => {
    let [path, query] = req.url.split('?');
    let [roomId] = path.split('/').filter(t => t);
    let params = querystring.parse(query);
    let {id: peerId, subs, token, bd} = params;

    // this is for forwarding messages to other containers
    // TODO authenticate
    let internal = false;
    if (roomId === '~forward') {
      internal = true;
    }

    let roomInfo = await get('rooms/' + roomId);

    let publicKey = peerId?.split('.')[0];
    if (
      peerId === undefined ||
      ((roomId === undefined || !ssrVerifyToken(token, publicKey)) &&
        !internal) ||
      (roomInfo?.access?.identities &&
        !roomInfo.access.identities.includes(publicKey)) ||
      (VERIFY_BUILDDATE_ONSOCKET &&
        !internal &&
        (bd === undefined || bd.split('.')[0] != 'BUILD_DATE'.split('.')[0]))
    ) {
      console.log(
        '[addWebSocket] ws rejected!',
        req.url,
        'room',
        roomId,
        'peer',
        peerId
      );
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    req.peerId = peerId;
    req.roomId = roomId;
    req.subs = subs?.split(',').filter(t => t) ?? []; // custom encoding, don't use "," in topic names
    req.bd = bd?.split('.')[0] ?? '';

    // Grant the user access to the relay
    try {
      let peerNpubs = await getNpubs(publicKey);
      for (let peerNpub of peerNpubs) {
        let peerPubkey = nip19.decode(peerNpub).data;
        const grantReason = `${jamHost} npub: ${peerNpub}`;
        await grantPubkeyToRelays(true, peerPubkey, grantReason);
      }
    } catch (err) {
      console.log(
        `[addWebSocket] error granting pubkey access to relays when starting socket: ${err}`
      );
    }

    wss.handleUpgrade(req, socket, head, ws => {
      wss.emit('connection', ws, req);
    });
  });
}

// connection = {ws, peerId}

function getPublicKey({peerId}) {
  return peerId.split('.')[0];
}

// peer connections per room

const roomConnections = new Map(); // roomId => Set(connection)

function addPeer(roomId, connection) {
  let connections =
    roomConnections.get(roomId) ??
    roomConnections.set(roomId, new Set()).get(roomId);
  connections.add(connection);
  //console.log('[addPeer] all peers:', getPeers(roomId));
}
function removePeer(roomId, connection) {
  let connections = roomConnections.get(roomId);
  if (connections !== undefined) {
    connections.delete(connection);
    if (connections.size === 0) roomConnections.delete(roomId);
  }
  //console.log('[removePeer] all peers:', getPeers(roomId));
}

// async function removeKeys(roomId, userId) {
//   const newRoomId = roomId + 'Keys';
//   const newUserId = userId.split('.')[0];
//   const roomPeers = getPeers(roomId);
//   let roomsKeys = await get(newRoomId);

//   if (!roomsKeys) {
//     return;
//   }
//   const hasPrivateKeys = roomsKeys.hasOwnProperty(newUserId);

//   if (hasPrivateKeys) {
//     delete roomsKeys[`${newUserId}`];

//     if (roomPeers.length === 0) {
//       del(newRoomId);
//       return;
//     }

//     set(newRoomId, roomsKeys);
//   }
// }

function getConnections(roomId) {
  let connections = roomConnections.get(roomId);
  if (connections === undefined) return [];
  return [...connections];
}
function getPeers(roomId) {
  return getConnections(roomId).map(c => c.peerId);
}

// p2p pub sub

const subscriptions = new Map(); // "roomId/topic" => Set(connection)

function publish(roomId, topic, msg) {
  let key = `${roomId}/${topic}`;
  let subscribers = subscriptions.get(key);
  if (subscribers === undefined) return;
  for (let subscriber of subscribers) {
    sendMessage(subscriber, msg);
  }
}
function subscribe(connection, roomId, topics) {
  if (!(topics instanceof Array)) topics = [topics];
  for (let topic of topics) {
    let key = `${roomId}/${topic}`;
    let subscribers =
      subscriptions.get(key) ?? subscriptions.set(key, new Set()).get(key);
    subscribers.add(connection);
  }
}
function unsubscribeAll(connection) {
  for (let entry of subscriptions) {
    let [key, subscribers] = entry;
    subscribers.delete(connection);
    if (subscribers.size === 0) subscriptions.delete(key);
  }
}

// server side forwarding

const forwardServers = new Set(); // Set(connection)
const forwardServerTopics = new Map(); // topic => connection

function addForwardServer(connection, topics) {
  forwardServers.add(connection);
  for (let topic of topics) {
    forwardServerTopics.set(topic, connection);
  }
}

function removeForwardServer(connection) {
  forwardServers.delete(connection);
  for (let entry of forwardServerTopics) {
    let [topic, connection_] = entry;
    if (connection_ === connection) {
      forwardServerTopics.delete(topic);
    }
  }
}

function forwardMessage(serverTopic, msg) {
  let connection = forwardServerTopics.get(serverTopic);
  if (connection !== undefined) {
    sendMessage(connection, msg);
  }
}

function publishToServers(msg) {
  for (let connection of forwardServers) {
    sendMessage(connection, msg);
  }
}

// request / response

const serverId = Math.random().toString(32).slice(2, 12);
const requests = new Map();

let nextRequestId = 0;

function newRequest(timeout = REQUEST_TIMEOUT) {
  let requestId = `${serverId};${nextRequestId++}`;
  const request = {id: requestId};
  request.promise = new Promise((resolve, reject) => {
    request.accept = data => {
      clearTimeout(request.timeout);
      resolve(data);
    };
    request.timeout = setTimeout(() => {
      reject(new Error('request timeout'));
    }, timeout);
  });
  requests.set(requestId, request);
  return request;
}

function newForwardRequest(connection, requestId) {
  const request = {
    id: requestId,
    accept(data) {
      sendMessage(connection, {t: 'response', d: data, r: requestId});
    },
  };
  requests.set(requestId, request);
  return request;
}

function requestAccepted(requestId, data) {
  let request = requests.get(requestId);
  if (request === undefined) return;
  request.accept(data);
  requests.delete(requestId);
}

// json

function parseMessage(jsonMsg) {
  try {
    return JSON.parse(jsonMsg);
  } catch (err) {
    console.log('[parseMessage] ws: error parsing msg', jsonMsg);
    console.error(err);
  }
}

function sendMessage({ws}, msg) {
  let jsonMsg;
  try {
    jsonMsg = JSON.stringify(msg);
  } catch (err) {
    console.log('[sendMessage] ws: error stringifying', msg);
    console.error(err);
    return;
  }
  try {
    ws.send(jsonMsg);
    return true;
  } catch (err) {
    console.log('[sendMessage] ws: error sending', jsonMsg);
    console.error(err);
    return false;
  }
}
