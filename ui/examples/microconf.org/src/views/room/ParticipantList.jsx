import React, {useState} from 'react';

import {components, use, useJam} from 'jam-core-react';

const {Avatar, DisplayName} = components.v1;

import './ParticipantList.scss';
import {ContextMenu} from '../../components/ContextMenu.jsx';
import {useConference} from '../../ConferenceProvider.jsx';

export const ParticipantList = ({entries, type}) => {
  const [{conference, roomId}, conferenceApi] = useConference();

  const [jamState, jamApi] = useJam();

  let [contextMenuPeerId, setContextMenuPeerId] = useState(null);

  let [room, myIdentity, identities, iAmModerator, iAmOwner] = use(jamState, [
    'room',
    'myIdentity',
    'identities',
    'iAmModerator',
    'iAmOwner',
  ]);

  const getInfo = id =>
    id === myIdentity.info.id ? myIdentity.info : identities[id] || {id};

  const hostsMenuItems = id => [
    {
      text: 'Make speaker',
      handler: () => conferenceApi.makeSpeaker(roomId, info.id),
    },
    {
      text: 'Remove from hosts',
      handler: () => jamApi.removeModerator(roomId, id),
    },
  ];

  const panelistsMenuItems = id => [
    {
      text: 'Make speaker',
      handler: () => conferenceApi.makeSpeaker(roomId, id),
    },
    {
      text: 'Make moderator',
      handler: () => jamApi.addModerator(roomId, id),
    },
    {
      text: 'Remove from panel',
      handler: () => conferenceApi.removeFromPanel(roomId, id),
    },
  ];

  const audienceMenuItems = id => [
    {
      text: 'Invite to panel',
      handler: () => conferenceApi.inviteToPanel(roomId, id),
    },
  ];

  const menuItems = {
    hosts: hostsMenuItems,
    panelists: panelistsMenuItems,
    audience: audienceMenuItems,
  };

  return (
    <ul className="panel-list">
      {entries.map(id => (
        <li
          className="panel-member"
          key={id}
          onClick={() =>
            setContextMenuPeerId(currentId => (currentId === id ? null : id))
          }
        >
          <Avatar
            {...{
              peerId: id,
              canSpeak: true,
              videoAvatar: true,
            }}
          />
          <DisplayName {...{peerId: id}} />
          {(iAmModerator || iAmOwner) && contextMenuPeerId === id && (
            <ContextMenu
              title={getInfo(id).name}
              show={true}
              menuItems={menuItems[type](id)}
            />
          )}
        </li>
      ))}
    </ul>
  );
};
