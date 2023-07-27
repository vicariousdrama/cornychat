import React from 'react';
import {useJam, use} from 'jam-core-react';

import './Panel.scss';
import {useConference} from '../../ConferenceProvider.jsx';
import {ParticipantList} from './ParticipantList.jsx';

export const Panel = () => {
  const [{conference, roomId}, conferenceApi] = useConference();

  const [jamState] = useJam();

  let [room] = use(jamState, ['room']);

  const conferenceSpeakerId = conference?.rooms[roomId]?.speaker;

  const panelists = room.speakers.filter(id => !room.moderators.includes(id));

  const hosts = room.moderators.filter(id => id !== conferenceSpeakerId);

  return (
    <div className="panel">
      {hosts.length > 0 && (
        <>
          <h3 className="legend">host{hosts > 1 ? 's' : ''}</h3>
          <ParticipantList entries={hosts} type={'hosts'} />
        </>
      )}
      {panelists.length > 0 && (
        <>
          <h3 className="legend">panel</h3>
          <ParticipantList entries={panelists} type={'panelists'} />
        </>
      )}
    </div>
  );
};
