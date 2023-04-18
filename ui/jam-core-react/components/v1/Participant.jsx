import React, {useEffect, useState} from 'react';
import {useJam} from '../../JamContext';
import {avatarUrl, displayName} from '../../../lib/avatar';
import animateEmoji from '../../../lib/animate-emoji';
import {use} from 'use-minimal-state';
import {MicOffSvg} from './Svg';

const reactionEmojis = ['❤️', '💯', '😂', '😅', '😳', '🤔'];

const getInfo = (peerId, state) => {
  let [identities, myId, myIdentity] = use(state, [
    'identities',
    'myId',
    'myIdentity',
  ]);

  return peerId === myId ? myIdentity.info : identities[peerId] || {id: peerId};
};

export function DisplayName({peerId}) {
  const [state] = useJam();

  let [room] = use(state, ['room']);

  let info = getInfo(peerId, state);

  return <span className="display-name">{displayName(info, room)}</span>;
}

function getInitials(peerDisplayName) {
  if (!peerDisplayName || peerDisplayName.length === 0) {
    return 'NN';
  }
  const initials = peerDisplayName.split(' ').map(n => n.substring(0, 1));
  if (initials.length === 1) {
    return initials[0];
  }
  const {0: first, length: l, [l - 1]: last} = initials;
  return `${first}${last}`;
}

export function Avatar({
  canSpeak,
  peerId,
  speakerRing = false,
  useInitialsAsDefault = true,
  videoAvatar = false,
}) {
  const [state, api] = useJam();

  let [
    myId,
    room,
    peerState,
    reactions,
    myVideo,
    remoteVideoStreams,
  ] = use(state, [
    'myId',
    'room',
    'peerState',
    'reactions',
    'myVideo',
    'remoteVideoStreams',
  ]);

  let speaking = speakerRing ? use(state, 'speaking') : new Map();

  let micMuted = peerId === myId ? use(state, 'micMuted') : peerState?.micMuted;
  let participantReactions = reactions[peerId];
  let info = getInfo(peerId, state);

  let isSpeaking = speakerRing && speaking.has(peerId);

  const peerAvatarUrl = avatarUrl(
    info,
    room,
    useInitialsAsDefault ? '__no_avatar__' : undefined
  );
  const peerDisplayName = displayName(info, room);

  const videoStreamRef = React.createRef();
  const videoStream =
    peerId === myId
      ? myVideo
      : remoteVideoStreams?.find(so => so.peerId === peerId)?.stream;

  useEffect(() => {
    if (videoAvatar && videoStreamRef.current)
      videoStreamRef.current.srcObject = videoStream;
  }, [videoStream, videoStreamRef]);

  return (
    <div key={peerId} title={peerDisplayName} className="avatar">
      {speakerRing && (
        <div className={`speaker-ring ${isSpeaking ? 'active' : ''}`} />
      )}
      <div className="avatar-image">
        {videoAvatar && videoStream ? (
          <video
            className="avatar-image-content"
            ref={videoStreamRef}
            autoPlay
            playsInline
          />
        ) : peerAvatarUrl !== '__no_avatar__' ? (
          <img
            className="avatar-image-content"
            alt={peerDisplayName}
            src={peerAvatarUrl}
          />
        ) : (
          <svg
            className="avatar-image-content"
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="96.666px"
            height="96.666px"
            viewBox="0 0 96.666 96.666"
            fill="currentColor"
          >
            <text
              style={{font: '40px sans-serif'}}
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {getInitials(peerDisplayName)}
            </text>
          </svg>
        )}
        <Reactions reactions={participantReactions} />
      </div>

      {(!!micMuted || !canSpeak) && (
        <div className="mic-muted">
          <MicOffSvg fill={!canSpeak ? 'red' : undefined} />
        </div>
      )}
    </div>
  );
}

function Reactions({reactions}) {
  if (!reactions) return null;
  return (
    <>
      {reactions.map(
        ([r, id]) =>
          reactionEmojis.includes(r) && <AnimatedEmoji key={id} emoji={r} />
      )}
    </>
  );
}

function AnimatedEmoji({emoji, ...props}) {
  let [element, setElement] = useState(null);
  useEffect(() => {
    if (element) animateEmoji(element);
  }, [element]);
  return (
    <div ref={setElement} className="animated-emoji">
      {emoji}
    </div>
  );
}
