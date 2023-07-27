import React, {useState} from 'react';
import {useJam, use} from 'jam-core-react';
import {useConference} from '../ConferenceProvider';

import {ConfirmationModal} from '../components/ConfirmationModal';

import './Settings.scss';

export const Settings = () => {
  const [jamState, jamApi] = useJam();

  const [{conference, rooms, roomId}, conferenceApi] = useConference();

  const [
    availableMicrophones,
    selectedMicrophoneId,
    myIdentity,
    myId,
    iAmModerator,
  ] = use(jamState, [
    'availableMicrophones',
    'selectedMicrophoneId',
    'myIdentity',
    'myId',
    'iAmModerator',
  ]);

  const {selectMicrophone, switchCamera, updateInfo, updateRoom} = jamApi;
  const {updateConference} = conferenceApi;

  const selectMicrophoneFromDeviceId = deviceId => {
    selectMicrophone(
      availableMicrophones.find(mic => mic.deviceId === deviceId)
    );
  };

  const [showSettings, setShowSettings] = useState(false);

  const [showPersonal, setShowPersonal] = useState(false);
  const [showRoom, setShowRoom] = useState(false);
  const [showConference, setShowConference] = useState(false);

  const toggleShowPersonal = () => setShowPersonal(s => !s);
  const toggleShowRoom = () => setShowRoom(s => !s);
  const toggleShowConference = () => setShowConference(s => !s);

  const [recordingsDownloadLink, setRecordingsDownloadLink] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');

  const updateAndBroadcastRoom = async room => {
    await updateRoom(roomId, room);
    conferenceApi.broadcastRoomChange();
  };

  const [confirmationSettings, setConfirmationSettings] = useState({});

  return (
    <div className="settings">
      {confirmationSettings.question && (
        <ConfirmationModal
          {...{
            ...confirmationSettings,
            onNo: () => setConfirmationSettings({}),
          }}
        />
      )}
      <h2 className="settings-icon" onClick={() => setShowSettings(true)}>
        ⚙
      </h2>
      {showSettings && (
        <>
          <div className="settings-panel-background-blur" />
          <div className="settings-panel">
            <div
              className="close-button"
              onClick={() => setShowSettings(false)}
            >
              ×
            </div>
            <ul className="settings-category-list">
              <li className="settings-category">
                <h3 onClick={toggleShowPersonal}>personal</h3>
                {showPersonal && (
                  <ul className="settings-subcategory-list">
                    <li className="settings-subcategory">
                      <h4>devices</h4>
                      <div className="settings-item">
                        <span className="legend">microphone</span>
                        <select
                          className="input microphone-selector"
                          value={selectedMicrophoneId}
                          onChange={e =>
                            selectMicrophoneFromDeviceId(e.target.value)
                          }
                        >
                          {availableMicrophones.map(mic => (
                            <option key={mic.deviceId} value={mic.deviceId}>
                              {mic.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="settings-item">
                        <span className="legend">camera</span>
                        <button
                          className="input main-button camera-switch-button"
                          onClick={switchCamera}
                        >
                          Switch Camera
                        </button>
                      </div>
                    </li>
                    <li>
                      <h4>profile</h4>
                      <div className="settings-item">
                        <span className="legend">name</span>
                        <input
                          className="input name-input"
                          type="text"
                          defaultValue={myIdentity?.info?.name}
                          onBlur={e => updateInfo({name: e.target.value})}
                        />
                      </div>
                    </li>
                  </ul>
                )}
              </li>
              {roomId && iAmModerator && (
                <li className="settings-category">
                  <h3 onClick={toggleShowRoom}>room</h3>
                  {showRoom && (
                    <ul className="settings-subcategory-list">
                      <li className="settings-subcategory">
                        <h4>info</h4>
                        <div className="settings-item">
                          <span className="legend">name</span>
                          <input
                            className="input room-name-input"
                            type="text"
                            defaultValue={rooms[roomId].name}
                            onBlur={e =>
                              updateAndBroadcastRoom({
                                ...rooms[roomId],
                                name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="settings-item">
                          <span className="legend">description</span>
                          <textarea
                            className="input room-description-input"
                            defaultValue={rooms[roomId].description}
                            onBlur={e =>
                              updateAndBroadcastRoom({
                                ...rooms[roomId],
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                      </li>
                      <li className="settings-subcategory">
                        <h4>recordings</h4>
                        <div className="settings-item">
                          <span className="legend"></span>
                          <button
                            className="main-button download-recordings-button"
                            onClick={async () =>
                              setRecordingsDownloadLink(
                                await jamApi.getRecordingsDownloadLink(roomId)
                              )
                            }
                          >
                            create download link
                          </button>
                        </div>
                        {recordingsDownloadLink && (
                          <div className="settings-item">
                            <span className="legend"></span>
                            <a
                              target="_blank"
                              href={recordingsDownloadLink}
                              onClick={() => setRecordingsDownloadLink(null)}
                            >
                              recordings.zip
                            </a>
                          </div>
                        )}
                      </li>
                    </ul>
                  )}
                </li>
              )}
              {conference.admins.includes(myId) && (
                <li className="settings-category">
                  <h3 onClick={toggleShowConference}>conference</h3>
                  {showConference && (
                    <ul className="settings-subcategory-list">
                      <li className="settings-subcategory">
                        <h4>info</h4>
                        <div className="settings-item">
                          <span className="legend">name</span>
                          <input
                            className="input room-name-input"
                            type="text"
                            defaultValue={conference.name}
                            onBlur={e =>
                              updateConference({
                                ...conference,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="settings-item">
                          <span className="legend">description</span>
                          <textarea
                            className="input room-description-input"
                            defaultValue={conference.description}
                            onBlur={e =>
                              updateConference({
                                ...conference,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                      </li>
                      <li className="settings-subcategory">
                        <h4>appearance</h4>
                        <div className="settings-item">
                          <span className="legend">theme</span>
                          <select
                            className="input theme-selector"
                            value={conference.theme}
                            onChange={e =>
                              updateConference({
                                ...conference,
                                theme: e.target.value,
                              })
                            }
                          >
                            <option>scifi</option>
                            <option>whiteboard</option>
                          </select>
                        </div>
                      </li>
                      <li className="settings-subcategory">
                        <h4>rooms</h4>
                        {Object.keys(conference.rooms).map(roomId => (
                          <div key={roomId} className="settings-item">
                            <div className="room-list-info">
                              <div className="room-list-name">
                                {rooms[roomId].name}
                              </div>
                              <div className="legend room-list-description">
                                {rooms[roomId].description}
                              </div>
                            </div>
                            <button
                              className="main-button room-list-action-button"
                              onClick={() => {
                                setConfirmationSettings({
                                  question: `Really remove room "${rooms[roomId].name}"?`,
                                  answer: rooms[roomId].name,
                                  onYes: () => {
                                    conferenceApi.removeRoom(roomId);
                                    setConfirmationSettings({});
                                  },
                                });
                              }}
                            >
                              —
                            </button>
                          </div>
                        ))}
                        <div className="settings-item add-room-item">
                          <div className="room-list-info">
                            <div className="legend room-list-description">
                              add room
                            </div>
                            <input
                              className="add-room-name-input"
                              value={newRoomName}
                              type="text"
                              onChange={e => setNewRoomName(e.target.value)}
                            />
                          </div>
                          <button
                            className="main-button room-list-action-button"
                            onClick={() => {
                              conferenceApi.addRoom(newRoomName);
                              setNewRoomName('');
                            }}
                          >
                            ＋
                          </button>
                        </div>
                      </li>
                    </ul>
                  )}
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
