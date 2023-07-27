import React, {useEffect} from 'react';
import {components, useJam, use} from 'jam-core-react';
import {Actions} from '../../components/Actions';

import './Speaker.scss';

const {Avatar, DisplayName} = components.v1;

export const Speaker = ({conferenceRoom}) => {
  const [state] = useJam();

  let [
    myId,
    myScreen,
    myVideo,
    remoteScreenStreams,
    remoteVideoStreams,
  ] = use(state, [
    'myId',
    'myScreen',
    'myVideo',
    'remoteScreenStreams',
    'remoteVideoStreams',
  ]);

  const {speaker} = conferenceRoom;

  const iAmSpeaker = speaker === myId;

  const screenStreamRef = React.createRef();
  const videoStreamRef = React.createRef();

  const screenStream = iAmSpeaker
    ? myScreen
    : remoteScreenStreams?.find(so => so.peerId === speaker)?.stream;

  const videoStream = iAmSpeaker
    ? myVideo
    : remoteVideoStreams?.find(so => so.peerId === speaker)?.stream;

  useEffect(() => {
    if (screenStreamRef.current)
      screenStreamRef.current.srcObject = screenStream;
  }, [screenStream, screenStreamRef]);
  useEffect(() => {
    if (videoStreamRef.current) videoStreamRef.current.srcObject = videoStream;
  }, [videoStream, videoStreamRef]);

  return (
    <div className="speaker">
      <div className="main-video-container">
        <video
          className="main-video"
          ref={screenStream ? screenStreamRef : videoStreamRef}
          autoPlay
          playsInline
        />
        {!!screenStream && (
          <Avatar {...{canSpeak: true, peerId: speaker, videoAvatar: true}} />
        )}
        <div
          className={`display-name-container ${
            !screenStream ? 'display-name-only' : ''
          }`}
        >
          <DisplayName {...{peerId: speaker}} />
        </div>
      </div>
      <Actions />
    </div>
  );
};
