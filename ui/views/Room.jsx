import React, {useState, useMemo} from 'react';
import {use} from 'use-minimal-state';
import EnterRoom from './EnterRoom';
import RoomHeader from './RoomHeader';
import useWakeLock from '../lib/use-wake-lock';
import {AudienceAvatar, StageAvatar} from './Avatar';
import Navigation from './Navigation';
import {userAgent} from '../lib/user-agent';
import {colors, isDark} from '../lib/theme.js';
import {usePushToTalk, useCtrlCombos} from '../lib/hotkeys';
import {useJam} from '../jam-core-react';
import {openModal} from './Modal';
import {Profile} from './Profile';

const inWebView =
  userAgent.browser?.name !== 'JamWebView' &&
  (userAgent.browser?.name === 'Chrome WebView' ||
    (userAgent.os?.name === 'iOS' &&
      userAgent.browser?.name !== 'Mobile Safari'));

export default function Room({room, roomId, uxConfig}) {
  // room = {name, description, moderators: [peerId], speakers: [peerId], access}
  const [state] = useJam();
  useWakeLock();
  usePushToTalk();
  useCtrlCombos();

  let [
    reactions,
    handRaised,
    handType,
    identities,
    speaking,
    iSpeak,
    iModerate,
    iMayEnter,
    myIdentity,
    inRoom,
    peers,
    peerState,
    myPeerState,
    hasMicFailed,
  ] = use(state, [
    'reactions',
    'handRaised',
    'handType',
    'identities',
    'speaking',
    'iAmSpeaker',
    'iAmModerator',
    'iAmAuthorized',
    'myIdentity',
    'inRoom',
    'peers',
    'peerState',
    'myPeerState',
    'hasMicFailed',
  ]);

  let myInfo = myIdentity.info;
  let hasEnteredRoom = inRoom === roomId;

  let [editSelf, setEditSelf] = useState(false);
  const [audience, setAudience] = useState(state.peers.length);
  const [showLinks, setShowLinks] = useState(false);

  useMemo(() => setAudience(state.peers.length), [state.peers]);

  let {
    name,
    description,
    schedule,
    logoURI,
    roomLinks,
    speakers,
    moderators,
    closed,
    stageOnly,
    shareUrl,
  } = room || {};

  if (!iMayEnter) {
    return <EnterRoom roomId={roomId} name={name} forbidden={true} />;
  }

  if (!iModerate && closed) {
    return (
      <EnterRoom
        roomId={roomId}
        name={name}
        description={description}
        schedule={schedule}
        closed={closed}
      />
    );
  }

  if (!hasEnteredRoom) {
    return (
      <EnterRoom
        roomId={roomId}
        name={name}
        description={description}
        schedule={schedule}
      />
    );
  }

  let myPeerId = myInfo.id;
  let stagePeers = stageOnly
    ? peers
    : (speakers ?? []).filter(id => peers.includes(id));
  let audiencePeers = stageOnly
    ? []
    : peers.filter(id => !stagePeers.includes(id));

  () => setAudience(stagePeers.length + audiencePeers.length);
//  useMemo(() => setAudience(stagePeers.length + audiencePeers.length), [state.peers]);

  let {noLeave} = uxConfig;

  const colorTheme = state.room?.color ?? 'default';
  const roomColor = colors(colorTheme, state.room.customColor);
  const textColor = isDark(roomColor.avatarBg)
    ? roomColor.text.light
    : roomColor.text.dark;

  const audienceBarBG = roomColor.buttons.primary;
  const audienceBarFG = isDark(audienceBarBG) ? roomColor.text.light : roomColor.text.dark;

  return (
    <div className="h-screen w-screen flex flex-col justify-between overflow-y-scroll">
      <div style={{zIndex: '10', position:'absolute', top: '0px'}} className="w-screen flex flex-col justify-between">
        <RoomHeader
          colors={roomColor}
          {...{
            name,
            description,
            logoURI,
            roomLinks,
            showLinks,
            setShowLinks,
            audience,
            closed,
          }}
        />

      </div>

      <div
        // className="overflow-y-scroll"
        // className={mqp('flex flex-col justify-between pt-2 md:pt-10 md:p-10')}
      >
        <div
          className={
            inWebView && !uxConfig.noWebviewWarning && false
              ? 'rounded bg-blue-50 border border-blue-150 text-gray-600 ml-2 p-3 mb-3 inline text-center'
              : 'hidden'
          }
        >
          <svg
            className="w-5 h-5 inline mr-2 -mt-1"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Open in {userAgent.os?.name === 'iOS' ? 'Safari' : 'Chrome'} for best
          experience.
          <br />
          <a
            className="underline"
            href="https://gitlab.com/jam-systems/jam"
            target="_blank"
            rel="nofollow noreferrer"
          >
            Learn more
          </a>
          .
        </div>

        <div style={{height:'64px'}}></div>
        <div className="hidden m-0 p-0" style={{backgroundColor: audienceBarBG, color: audienceBarFG}}>
          MOTD: None set
        </div>

        {/* Main Area */}
        <div className="h-full rounded-lg mx-4">
          {/* Stage */}
          <div className="">
            <ol className="flex flex-wrap justify-center">
              {iSpeak && (
                <StageAvatar
                  key={myPeerId}
                  peerId={myPeerId}
                  {...{speaking, moderators, reactions, room}}
                  canSpeak={!hasMicFailed}
                  peerState={myPeerState}
                  info={myInfo}
                  handRaised={handRaised}
                  handType={handType}
                  onClick={() => {
                    openModal(Profile, {
                      info: state.myIdentity.info,
                      room,
                      peerId: myPeerId,
                      iModerate,
                      actorIdentity: myIdentity,
                    });
                  }}
                />
              )}
              {stagePeers.map(peerId => (
                <StageAvatar
                  key={peerId}
                  {...{speaking, moderators, room}}
                  {...{peerId, peerState, reactions}}
                  canSpeak={true}
                  peerState={peerState[peerId]}
                  info={identities[peerId]}
                  handRaised={peerState[peerId]?.handRaised}
                  handType={peerState[peerId]?.handType}
                  onClick={() => {
                    openModal(Profile, {
                      info: identities[peerId],
                      room,
                      peerId,
                      iModerate,
                      actorIdentity: myIdentity,
                    });
                  }}
                />
              ))}
            </ol>
          </div>

          <br />
          {/* Audience */}
          <div className="m-0 p-0" style={{backgroundColor: audienceBarBG, color: audienceBarFG}}>
            Audience
          </div>
          {!stageOnly && (
            <>
              <ol className="flex flex-wrap justify-center">
                {!iSpeak && (
                  <AudienceAvatar
                    {...{moderators, reactions, room}}
                    peerId={myPeerId}
                    peerState={myPeerState}
                    info={myInfo}
                    handRaised={handRaised}
                    handType={handType}
                    onClick={() => {
                      openModal(Profile, {
                        info: state.myIdentity.info,
                        room,
                        peerId: myPeerId,
                        iModerate,
                        actorIdentity: myIdentity,
                      });
                    }}
                  />
                )}
                {audiencePeers.map(peerId => (
                  <AudienceAvatar
                    key={peerId}
                    {...{peerId, peerState, moderators, reactions, room}}
                    peerState={peerState[peerId]}
                    info={identities[peerId]}
                    handRaised={peerState[peerId]?.handRaised}
                    handType={peerState[peerId]?.handType}
                    onClick={() =>
                      openModal(Profile, {
                        info: identities[peerId],
                        room,
                        peerId,
                        iModerate,
                        actorIdentity: myIdentity,
                      })
                    }
                  />
                ))}
              </ol>
            </>
          )}
        </div>
        <div className="h-24"></div>
      </div>
      <Navigation
        {...{
          room,
          editSelf,
          setEditSelf,
        }}
      />
    </div>
  );
}
