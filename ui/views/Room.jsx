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
import RoomSlides from './RoomSlides';
import RoomMembers from './RoomMembers';
import {useJamState} from '../jam-core-react/JamContext';

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

  let [isRecording, isPodcasting] = useJamState([
    'isSomeoneRecording',
    'isSomeonePodcasting',
  ]);
  isRecording = isRecording || isPodcasting;

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

  let [showMyNavMenu, setShowMyNavMenu] = useState(false);
  const [audience, setAudience] = useState(state.peers.length + 1);
  const [showLinks, setShowLinks] = useState(false);
  const [showSlides, setShowSlides] = useState(false);

  useMemo(() => setAudience(state.peers.length + 1), [state.peers]);

  let {
    name,
    description,
    schedule,
    logoURI,
    roomLinks,
    roomSlides,
    currentSlide,
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

  () => setAudience(stagePeers.length + audiencePeers.length + 1);

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
            currentSlide,
            audience,
            closed,
          }}
        />


        {isRecording && (
        <div className="w-full mx-4" style={{backgroundColor: 'red', color: 'white'}}>
          RECORDING IN PROGRESS
        </div>
        )}
      </div>


      <div
        // className="overflow-y-scroll"
        // className={mqp('flex flex-col justify-between pt-2 md:pt-10 md:p-10')}
      >

        <div style={{height:'128px'}}></div>

        <div className="w-full">
          <RoomSlides
            colors={roomColor}
            {...{
              roomSlides,
              currentSlide,
            }}
          />
        </div>

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
          {!stageOnly && (!iSpeak || audiencePeers.length > 0) && (
          <div className="m-0 p-0" style={{backgroundColor: audienceBarBG, color: audienceBarFG}}>
            Audience
          </div>
          )}
          {!stageOnly &&  (!iSpeak || audiencePeers.length > 0) && (
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
          showMyNavMenu,
          setShowMyNavMenu,
        }}
      />
    </div>
  );
}
