import React from 'react';
import {useJam, use} from 'jam-core-react';
import {useConference} from '../ConferenceProvider';

export const Actions = () => {
  const [jamState, jamApi] = useJam();
  const [{conference, rooms, roomId}, conferenceApi] = useConference();

  const [
    myId,
    myScreen,
    myVideo,
    micMuted,
    iAmSpeaker,
    iAmPresenter,
    iAmModerator,
    iAmOwner,
    isServerRecording,
  ] = use(jamState, [
    'myId',
    'myScreen',
    'myVideo',
    'micMuted',
    'iAmSpeaker',
    'iAmPresenter',
    'iAmModerator',
    'iAmOwner',
    'isServerRecording',
  ]);

  const iAmConferenceSpeaker =
    roomId && conference.rooms[roomId]?.speaker === myId;

  return (
    <div className="actions">
      {iAmConferenceSpeaker &&
        (myScreen ? (
          <button className="main-button" onClick={jamApi.stopScreenShare}>
            Stop Sharing
          </button>
        ) : (
          <button className="main-button" onClick={jamApi.startScreenShare}>
            Share Screen
          </button>
        ))}
      {iAmSpeaker &&
        (micMuted ? (
          <button
            className="main-button"
            onClick={() => jamApi.setProps('micMuted', false)}
          >
            Unmute
          </button>
        ) : (
          <button
            className="main-button"
            onClick={() => jamApi.setProps('micMuted', true)}
          >
            Mute
          </button>
        ))}
      {iAmPresenter &&
        (myVideo ? (
          <button
            className="main-button"
            onClick={() => jamApi.setCameraOn(false)}
          >
            Stop Camera
          </button>
        ) : (
          <button
            className="main-button"
            onClick={() => jamApi.setCameraOn(true)}
          >
            Start Camera
          </button>
        ))}
      {roomId &&
        (iAmModerator || iAmOwner) &&
        (isServerRecording ? (
          <button className="main-button" onClick={jamApi.stopServerRecording}>
            Stop Recording
          </button>
        ) : (
          <button className="main-button" onClick={jamApi.startServerRecording}>
            Start Recording
          </button>
        ))}
      {}
    </div>
  );
};
