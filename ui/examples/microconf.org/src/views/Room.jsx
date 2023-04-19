import React, {useState, useEffect} from 'react';
import {useJam, use} from 'jam-core-react';
import {Panel} from './room/Panel';
import {Speaker} from './room/Speaker';
import {Audience} from './room/Audience';

import './Room.scss';
import {useConference} from '../ConferenceProvider.jsx';

export const Room = ({roomId}) => {
  const [{conference}] = useConference();

  const conferenceRoom = conference.rooms[roomId];

  const [state, {enterRoom, leaveRoom, setProps}] = useJam();
  let [inRoom] = use(state, ['inRoom']);

  const enter = async () => {
    await setProps('roomId', roomId);
    await enterRoom(roomId);
  };

  const [showParticipants, setShowParticipants] = useState(true);
  const toggleParticipants = () => setShowParticipants(s => !s);

  useEffect(() => {
    enter();
  });

  return (
    <div className="room">
      {inRoom ? (
        <>
          <Speaker {...{conferenceRoom, roomId}} />
          <div className="participants">
            <h2
              onClick={toggleParticipants}
              className={`participants-header ${
                !showParticipants && 'participants-hidden'
              }`}
            >
              participants
            </h2>
            {showParticipants && (
              <>
                <Panel />
                <Audience />
              </>
            )}
          </div>
        </>
      ) : (
        <button onClick={enter}>Enter</button>
      )}
    </div>
  );
};
