import React, {useState, useMemo, useEffect} from 'react';
import {use} from 'use-minimal-state';
import EnterRoom from './EnterRoom';
import RoomHeader from './RoomHeader';
import useWakeLock from '../lib/use-wake-lock';
import Navigation from './Navigation';
import {userAgent} from '../lib/user-agent';
import {colors, isDark} from '../lib/theme.js';
import {usePushToTalk, useCtrlCombos} from '../lib/hotkeys';
import {useJam, useApiQuery} from '../jam-core-react';
import RoomSlides from './RoomSlides';
import RoomMembers from './RoomMembers';
import MiniRoomMembers from './MiniRoomMembers.jsx';
import RoomChat from './RoomChat';
import {useJamState} from '../jam-core-react/JamContext';
import {get} from '../jam-core/backend';
import {getNpubFromInfo} from '../nostr/nostr'

const inWebView =
  userAgent.browser?.name !== 'JamWebView' &&
  (userAgent.browser?.name === 'Chrome WebView' ||
    (userAgent.os?.name === 'iOS' &&
      userAgent.browser?.name !== 'Mobile Safari'));

export default function Room({room, roomId, uxConfig}) {
  // room = {name, description, moderators: [peerId], speakers: [peerId], access}
  const [state, {sendTextChat}] = useJam();
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
    myId,
    myIdentity,
    inRoom,
    peers,
    peerState,
    myPeerState,
    hasMicFailed,
    myVideo,
    remoteVideoStreams,
  ] = use(state, [
    'reactions',
    'identities',
    'speaking',
    'iAmSpeaker',
    'iAmOwner',
    'iAmModerator',
    'iAmAuthorized',
    'myId',
    'myIdentity',
    'inRoom',
    'peers',
    'peerState',
    'myPeerState',
    'hasMicFailed',
    'myVideo',
    'remoteVideoStreams',
  ]);

  let [myAdminStatus] = useApiQuery(`/admin/${myId}`, {fetchOnMount: true});
  let iAmAdmin = myAdminStatus?.admin || false;


  let myInfo = myIdentity.info;
  let hasEnteredRoom = inRoom === roomId;

  let [showMyNavMenu, setShowMyNavMenu] = useState(false);
  let [showChat, setShowChat] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const inRoomPeerIds = peers.filter(id => peerState[id]?.inRoom);
  const nJoinedPeers = inRoomPeerIds.length;
  const [audience, setAudience] = useState(state.peers.length + 1);
  useMemo(() => setAudience(state.peers.length + 1), [state.peers]);
  const sesPeerIds = `${roomId}.peerIds`;
  sessionStorage.setItem(sesPeerIds, JSON.stringify([...inRoomPeerIds])); // MyNavMenu depends on for Follow All

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
    isProtected,
    passphraseHash,
  } = room || {};

  function CacheAds() {
    const adskey = 'chatads';
    const chatads = sessionStorage.getItem(adskey);
    let fetchit = (chatads == null || chatads == undefined);
    if (fetchit) {
      (async () => {
        let [newchatads, ok] = await get(`/cimg/`);
        if (ok) {
          sessionStorage.setItem(adskey, JSON.stringify(newchatads));
        }
      })();
    }
  }
  if (jamConfig.handbill) {
    let theCacheAds = CacheAds();
  }

  // Cache identities in session
  function CacheIdentities(identities) {
    for(let i = 0; i < identities.length; i ++) {
      let id = identities[i];
      if (id.length == 43) {
        let jamId = id;
        const sessionStoreIdent = sessionStorage.getItem(jamId);
        let fetchit = false;
        if (sessionStoreIdent == null) {
          fetchit = true;
        }
        if (jamId == myInfo.id) {
          sessionStorage.setItem(jamId, JSON.stringify(myInfo));
          fetchit = false;
        }
        if (fetchit) {
          (async () => {
            let [remoteIdent, ok] = await get(`/identities/${jamId}`);
            if (ok) {
              sessionStorage.setItem(jamId, JSON.stringify(remoteIdent));
            }
          })();
        }
      }
    }
  }
  CacheIdentities(inRoomPeerIds);
  CacheIdentities([myInfo.id]);
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
        iAmAdmin={iAmAdmin}
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
        iAmAdmin={iAmAdmin}
      />
    );
  }
  let {textchats} = state;
  if (textchats.length == 0) {
    (async () => {await sendTextChat("*has entered the chat!*");})();
  }

  let myPeerId = myInfo.id;
  let stagePeers = stageOnly ? peers : [];
  if (!stageOnly) {
    for(let id of (speakers ?? [])) {
      if (peers.includes(id)) {
        if (!stagePeers.includes(id)) {
          stagePeers.push(id);
        }
      } else if (id.startsWith("npub")) {
        for (let n of peers) {
          if (stagePeers.includes(n)) {
            continue;
          }
          let o = sessionStorage.getItem(n);
          let p = getNpubFromInfo(o);
          if (p && p.startsWith(id)) {
            if (!stagePeers.includes(n)) {
              stagePeers.push(n);
            }
            break;
          }
        }
      }
    }
  }

  let audiencePeers = [];
  if (!stageOnly) {
    for (let n of peers) {
      // if there is no speakers, then everyone is in the audience
      if (!speakers) {
        if (!audiencePeers.includes(n)) {
          audiencePeers.push(n);
        }
        continue;
      }
      // if this person is on stage, they cant also be in the audience
      if (stagePeers.includes(n)) continue;
      let o = sessionStorage.getItem(n);
      let p = getNpubFromInfo(o);
      // if peer has no npub, or their npub is not in the speaker array, add to audience
      if (!p || !speakers.includes(p)) {
        if (!audiencePeers.includes(n)) {
          audiencePeers.push(n);
        }
        continue;
      }
    } 
  }

  () => setAudience(stagePeers.length + audiencePeers.length + 1);

  let {noLeave} = uxConfig;

  const colorTheme = state.room?.color ?? 'default';
  const roomColor = colors(colorTheme, state.room.customColor);
  const textColor = isDark(roomColor.avatarBg) ? roomColor.text.light : roomColor.text.dark;
  const audienceBarBG = roomColor.buttons.primary;
  const audienceBarFG = isDark(audienceBarBG) ? roomColor.text.light : roomColor.text.dark;

  let four_hours_duration = 4 * 60 * 60;
  let srfm = undefined;
  let srfmtime = sessionStorage.getItem(`${roomId}.srfm.time`);
  let srfmpeer = sessionStorage.getItem(`${roomId}.srfm.peer`);
  if (srfmtime && (srfmtime > (Math.floor(Date.now() / 1000) - four_hours_duration))) {
    srfm = sessionStorage.getItem(`${roomId}.srfm`);
  }

  return (
    <div className="h-screen w-screen flex flex-col justify-between overflow-y-scroll">

      <audio id="doorbellsound" src="/mp3/call-to-attention-123107.mp3" volume=".5" />

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
            roomId,
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

        <div style={{height: isRecording ? '156px' : '104px'}}></div>

        <div className="w-full">
          <RoomSlides
            colors={roomColor}
            {...{
              roomSlides,
              currentSlide,
              iAmAdmin,
            }}
          />
        </div>

        { srfm && (
        <div className="rounded-md m-0 p-0 mt-2 mb-4" style={{backgroundColor: audienceBarBG, color: audienceBarFG}}>
          {srfm}
        </div>
        )}

        { showChat ? (
        <MiniRoomMembers
          {...{
            audienceBarBG,
            audienceBarFG,
            audiencePeers,
            hasMicFailed,
            identities,
            iModerate,
            iOwn,
            iSpeak,
            iAmAdmin,
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
        ) : (
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
            iAmAdmin,
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
        )}

        {showChat && (
          <RoomChat
            {...{
              room,
            }}
          />
        )}

        <div className="h-40"></div>
      </div>
      <Navigation
        {...{
//          room,
          showMyNavMenu,
          setShowMyNavMenu,
          showChat,
          setShowChat,
          iAmAdmin,
//          isProtected,
//          passphraseHash,
        }}
      />
    </div>
  );
}
