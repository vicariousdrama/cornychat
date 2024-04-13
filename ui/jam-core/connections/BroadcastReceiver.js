import shaka from 'shaka-player';

import {useUpdate, use} from '../../lib/state-tree';

export default function BroadcastReceiver({swarm}) {
  let update = useUpdate();

  let peerPlayers = new Map();

  let updating = false;

  return function BroadcastReceiver({
    roomId,
    shouldReceive,
    roomState,
    inRoom,
  }) {
    const peerState = use(swarm, 'peerState');
    if (!inRoom || !shouldReceive) {
      for (const player of peerPlayers.values()) {
        const element = player.getMediaElement();
        player.destroy();
        element.remove();
      }

      peerPlayers.clear();
      return peerPlayers;
    }

    if (!updating) {
      const stateDiff = needsUpdate(peerPlayers, peerState, roomState);
      if (stateDiff.toRemove.length > 0 || stateDiff.toAdd.length > 0) {
        updating = true;
        updatePeerPlayers({roomId, stateDiff}).then(update);
      }
    }

    return peerPlayers;
  };

  async function updatePeerPlayers({roomId, stateDiff}) {
    console.log(
      `Adding ${stateDiff.toAdd.length} players and removing ${stateDiff.toRemove.length}`,
      JSON.stringify(stateDiff)
    );

    const newPeerPlayers = new Map();

    for (const playerIdToRemove of stateDiff.toRemove) {
      const player = peerPlayers.get(playerIdToRemove);
      const element = player.getMediaElement();
      player.destroy();
      element.remove();
      peerPlayers.delete(playerIdToRemove);
    }

    for (const playerId of stateDiff.expectedPlayerIds) {
      const [source, peerId] = playerId.split('|');
      console.log(peerPlayers.has(playerId));

      if (peerPlayers.has(playerId)) {
        newPeerPlayers.set(playerId, peerPlayers.get(playerId));
      } else {
        newPeerPlayers.set(
          playerId,
          await createPeerPlayer({
            roomId,
            peerId,
            source,
          })
        );
      }
    }

    peerPlayers = newPeerPlayers;
    updating = false;
  }

  async function createPeerPlayer({roomId, peerId, source}) {
    const mediaElement = document.createElement('video');
    const broadcastUrl = `http://localhost:3001/stream/hls/${roomId}/${peerId}/${source}/index.m3u8`;
    const player = new shaka.Player(mediaElement);
    await player.load(broadcastUrl);
    return player;
  }

  function needsUpdate(remoteStreams, peerState, roomState) {
    const expectedPlayerIds = new Set();
    for (const speakerPeerId of roomState?.room?.speakers || []) {
      const peer = peerState[speakerPeerId];

      if (peer) {
        if (!peer.micMuted) {
          expectedPlayerIds.add(`main|${speakerPeerId}`);
        }
        if (
          roomState.room.presenters.includes(speakerPeerId) &&
          speakerPeerId &&
          !!peer.camOn
        ) {
          expectedPlayerIds.add(`main|${speakerPeerId}`);
        }
        if (
          roomState.room.presenters.includes(speakerPeerId) &&
          speakerPeerId &&
          !!peer.shareScreen
        ) {
          expectedPlayerIds.add(`screen|${speakerPeerId}`);
        }
      }
    }

    const currentPlayerIds = new Set([...peerPlayers.keys()]);

    const toAdd = [...expectedPlayerIds].filter(x => !currentPlayerIds.has(x));
    const toRemove = [...currentPlayerIds].filter(
      x => !expectedPlayerIds.has(x)
    );

    return {toRemove, toAdd, expectedPlayerIds};
  }
}
