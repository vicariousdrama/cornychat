import React, {useState} from 'react';
import {components, useJam, use} from 'jam-core-react';

import './Audience.scss';
import {ContextMenu} from '../../components/ContextMenu.jsx';
import {useConference} from '../../ConferenceProvider.jsx';
import {ParticipantList} from './ParticipantList.jsx';

export const Audience = () => {
  const [jamState] = useJam();

  let [room, myId, peers] = use(jamState, ['room', 'myId', 'peers']);

  const audience = [myId, ...peers].filter(id => !room.speakers.includes(id));

  return (
    audience.length > 0 && (
      <div className="audience">
        <h3 className="legend">audience</h3>
        <ParticipantList entries={audience} type={'audience'} />
      </div>
    )
  );
};
