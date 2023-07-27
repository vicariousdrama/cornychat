import React, {useState} from 'react';
import {useJam} from 'jam-core-react';

import {useConference} from '../ConferenceProvider';

import {Info} from '../components/Info';
import {Room} from './Room';
import {Lobby} from './Lobby';
import {Settings} from './Settings';

import './Conference.scss';

const lobbyDescription =
  'The lobby is the room where everyone can hangout and talk.';

export const Conference = () => {
  const [_, jamApi] = useJam();
  const [{conference, rooms, roomId}] = useConference();

  const [showRooms, setShowRooms] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);

  const theme = conference?.theme || 'default';

  document.getElementById('theme-variables').href = `/themes/${theme}.css`;
  document.title = `microconf - ${conference?.name}`;

  const toggleRooms = () => setShowRooms(state => !state);
  const toggleRoomInfo = () => setShowRoomInfo(state => !state);

  return (
    conference && (
      <div className="conference">
        <div className="plug">
          This microconference is powered by{' '}
          <a href="https://microconf.org">microconf</a> and{' '}
          <a href="https://jamshelf.com">Jam</a>
        </div>
        <div className="header">
          <div className="conference-info">
            <h1>
              <div className="legend">conference</div>
              {conference?.name} <Info onclick={toggleRooms}></Info>
            </h1>
            {showRooms && (
              <div className="rooms">
                <span className="legend">rooms</span>
                &nbsp;
                <button
                  className="main-button"
                  onClick={async () => {
                    await jamApi.leaveRoom();
                    document.location.hash = conference.id;
                  }}
                >
                  Lobby
                </button>
                &nbsp;
                {Object.keys(conference.rooms).map(id => {
                  return (
                    <button
                      className="main-button"
                      onClick={async () => {
                        await jamApi.leaveRoom();
                        document.location.hash = `${conference.id}/${id}`;
                      }}
                    >
                      {rooms[id].name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="room-info">
            <h2>
              <div className="legend">room</div>
              {roomId ? rooms[roomId]?.name : 'Lobby'}{' '}
              <Info onclick={toggleRoomInfo}></Info>
              {showRoomInfo && (
                <div className="legend">
                  {roomId
                    ? rooms[roomId].description || 'No description'
                    : lobbyDescription}
                </div>
              )}
            </h2>
          </div>
          <Settings />
        </div>
        {roomId ? <Room roomId={roomId} /> : <Lobby />}
      </div>
    )
  );
};
