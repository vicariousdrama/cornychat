import React, {useEffect} from 'react';
import {use, useJam, components} from 'jam-core-react';

const {Avatar, DisplayName} = components.v1;
import {useConference} from '../ConferenceProvider';
import {Actions} from '../components/Actions';

import './Lobby.scss';

export const Lobby = () => {
  const [{conference}] = useConference();
  const [state, {enterRoom, leaveRoom, setProps}] = useJam();
  let [myVideo, myId, peers, peerState] = use(state, [
    'myVideo',
    'myId',
    'peers',
    'peerState',
  ]);

  const enter = async () => {
    await setProps('roomId', conference.id);
    await enterRoom(conference.id);
  };

  useEffect(() => {
    enter();
  });

  const joinedPeers = peers.filter(id => peerState[id]?.inRoom);

  return (
    <div className="lobby">
      <ol className="lobby-guests">
        <li className="lobby-guest" key={myId}>
          <Avatar {...{peerId: myId, canSpeak: true, videoAvatar: true}} />
          <DisplayName {...{peerId: myId}} />
        </li>
        {joinedPeers.map(id => (
          <li className="lobby-guest" key={id}>
            <Avatar {...{peerId: id, canSpeak: true, videoAvatar: true}} />
            <DisplayName {...{peerId: id}} />
          </li>
        ))}
      </ol>
      <Actions />
    </div>
  );
};
