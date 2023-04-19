import React, {useState} from 'react';
import {components, useJam, use} from 'jam-core-react';

import './Panel.scss';
import {ContextMenu} from '../../components/ContextMenu.jsx';
import {useConference} from '../../ConferenceProvider.jsx';

const {Avatar, DisplayName} = components.v1;

export const Panel = () => {
  const [{conference, roomId}, conferenceApi] = useConference();

  const [jamState, jamApi] = useJam();

  let [room, myIdentity, identities] = use(jamState, [
    'room',
    'myIdentity',
    'identities',
  ]);

  const conferenceSpeakerId = conference?.rooms[roomId]?.speaker;

  let [contextMenuPeerId, setContextMenuPeerId] = useState(null);

  const panelists = room.speakers.filter(id => !room.moderators.includes(id));

  const hosts = room.moderators.filter(id => id !== conferenceSpeakerId);

  return (
    <div className="panel">
      {hosts.length > 0 && (
        <>
          <h3 className="legend">host{hosts > 1 ? 's' : ''}</h3>
          <ul className="panel-list">
            {hosts.map(id => (
              <li
                className="panel-member"
                key={id}
                onClick={() =>
                  setContextMenuPeerId(currentId =>
                    currentId === id ? null : id
                  )
                }
              >
                <Avatar
                  {...{
                    peerId: id,
                    canSpeak: true,
                    videoAvatar: true,
                    info: myIdentity.info,
                  }}
                />
                <DisplayName {...{peerId: id, info: myIdentity.info}} />
              </li>
            ))}
          </ul>
        </>
      )}
      {panelists.length > 0 && <h3 className="legend">panel</h3>}
      <ul className="panel-list">
        {panelists.map(id => (
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
                info: myIdentity.info,
              }}
            />
            <DisplayName {...{peerId: id, info: myIdentity.info}} />
            <ContextMenu
              {...{
                title: identities[id]?.name,
                show: contextMenuPeerId === id,
                menuItems: [
                  {
                    text: 'Make speaker',
                    handler: () => conferenceApi.makeSpeaker(roomId, id),
                  },
                  {
                    text: 'Remove from panel',
                    handler: () => jamApi.removeSpeaker(roomId, id),
                  },
                ],
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};
