import React, {useState} from 'react';
import {components, useJam, use} from 'jam-core-react';

import './Audience.scss';
import {ContextMenu} from '../../components/ContextMenu.jsx';
import {useConference} from '../../ConferenceProvider.jsx';

const {Avatar, DisplayName} = components.v1;

export const Audience = () => {
  const [{roomId}] = useConference();

  const [jamState, jamApi] = useJam();

  let [room, myId, peers, iAmModerator, identities] = use(jamState, [
    'room',
    'myId',
    'peers',
    'iAmModerator',
    'identities',
  ]);

  let [contextMenuPeerId, setContextMenuPeerId] = useState(null);

  const audience = [myId, ...peers].filter(id => !room.speakers.includes(id));

  return (
    audience.length > 0 && (
      <div className="audience">
        <h3 className="legend">audience</h3>
        <ul className="audience-list">
          {audience.map(id => (
            <li
              className="audience-member"
              key={id}
              onClick={() =>
                iAmModerator &&
                setContextMenuPeerId(currentId =>
                  currentId === id ? null : id
                )
              }
            >
              <Avatar {...{peerId: id}} />
              <DisplayName {...{peerId: id}} />
              <ContextMenu
                {...{
                  show: contextMenuPeerId === id,
                  title: identities[id]?.name,
                  menuItems: [
                    {
                      text: 'Invite to panel',
                      handler: () => jamApi.addSpeaker(roomId, id),
                    },
                  ],
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    )
  );
};
