import React, {useState, useMemo} from 'react';
import {use} from 'use-minimal-state';
import EnterRoom from './EnterRoom';
import RoomHeader from './RoomHeader';
import useWakeLock from '../lib/use-wake-lock';
import Navigation from './Navigation';
import {userAgent} from '../lib/user-agent';
import {colors, isDark} from '../lib/theme.js';
import {usePushToTalk, useCtrlCombos} from '../lib/hotkeys';
import {useJam} from '../jam-core-react';
import RoomSlides from './RoomSlides';
import RoomMembers from './RoomMembers';
import {useJamState} from '../jam-core-react/JamContext';
import {get} from '../jam-core/backend';

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
    identities,
    speaking,
    iSpeak,
    iOwn,
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
    'identities',
    'speaking',
    'iAmSpeaker',
    'iAmOwner',
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
  const [showLinks, setShowLinks] = useState(false);
  const [showSlides, setShowSlides] = useState(false);
  const inRoomPeerIds = peers.filter(id => peerState[id]?.inRoom);
  sessionStorage.setItem(roomId + '-peerIds', JSON.stringify([...inRoomPeerIds]));
  const nJoinedPeers = inRoomPeerIds.length;
  const [audience, setAudience] = useState(state.peers.length + 1);
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
    owners,
    closed,
    stageOnly,
    lud16,
  } = room || {};

  // Cache identities in session if I'm a moderator
  function CacheIdentities(identities) {
    for(let i = 0; i < identities.length; i ++) {
      let jamId = identities[i];
      const sessionStoreIdent = sessionStorage.getItem(jamId);
      if (sessionStoreIdent == null) {
        (async () => {
          let [remoteIdent, ok] = await get(`/identities/${jamId}`);
          if (ok) {
            sessionStorage.setItem(jamId, JSON.stringify(remoteIdent));
          }
        })();
      }
    }
  }
  if (iModerate) {
    CacheIdentities(moderators);
    CacheIdentities(speakers);
  }

  if (!iMayEnter) {
    return <EnterRoom roomId={roomId} name={name} forbidden={true} />;
  }

  if (!iOwn && closed) {
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
        closed={closed}
      />
    );
  }

  let myPeerId = myInfo.id;
  let stagePeers = stageOnly ? peers : (speakers ?? []).filter(id => peers.includes(id));
  let audiencePeers = stageOnly ? [] : peers.filter(id => !stagePeers.includes(id));
  const nJoinedAudiencePeers = audiencePeers.filter(id => peerState[id]?.inRoom).length;

  () => setAudience(stagePeers.length + audiencePeers.length + 1);

  let {noLeave} = uxConfig;

  const colorTheme = state.room?.color ?? 'default';
  const roomColor = colors(colorTheme, state.room.customColor);
  const textColor = isDark(roomColor.avatarBg) ? roomColor.text.light : roomColor.text.dark;
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
            closed,
            lud16,
            room,
          }}
          audience={(nJoinedPeers+1)}
        />


        {isRecording && (
        <div className="rounded-md mx-4 mt-2 mb-4" style={{backgroundColor: 'red', color: 'white'}}>
          RECORDING IN PROGRESS
        </div>
        )}
      </div>


      <div
        // className="overflow-y-scroll"
        // className={mqp('flex flex-col justify-between pt-2 md:pt-10 md:p-10')}
      >

        <div style={{height: isRecording ? '156px' : '128px'}}></div>

        <div className="w-full">
          <RoomSlides
            colors={roomColor}
            {...{
              roomSlides,
              currentSlide,
            }}
          />
        </div>

        <div className="hidden rounded-md m-0 p-0 mt-2 mb-4" style={{backgroundColor: audienceBarBG, color: audienceBarFG}}>
          MOTD: None set
        </div>

        <RoomMembers
          {...{
            audienceBarBG,
            audienceBarFG,
            audiencePeers,
            hasMicFailed,
            identities,
            iModerate,
            iOwn,
            iSpeak,
            moderators,
            myIdentity,
            myInfo,
            myPeerId,
            myPeerState,
            owners,
            peerState,
            reactions,
            room,
            speaking,
            stageOnly,
            stagePeers,
            state,            
          }}
        />

        <div className="h-40"></div>
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
