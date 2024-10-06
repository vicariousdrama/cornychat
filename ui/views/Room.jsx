import React, {useState, useMemo} from 'react';
import {use} from 'use-minimal-state';
import EnterRoom from './EnterRoom';
import RoomHeader2 from './RoomHeader2';
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
import {getNpubFromInfo, getUserMetadata} from '../nostr/nostr'
import {nip19} from 'nostr-tools';

const inWebView =
  userAgent.browser?.name !== 'JamWebView' &&
  (userAgent.browser?.name === 'Chrome WebView' ||
    (userAgent.os?.name === 'iOS' &&
      userAgent.browser?.name !== 'Mobile Safari'));

const nameSymbols = [
  {"name":"Marie","symbol":"🌹","title":"Valentine"},
  {"npub":"npub1el3mgvtdjpfntdkwq446pmprpdv85v6rs85zh7dq9gvy7tgx37xs2kl27r","symbol":"🌹","title":"Valentine"},
  {"name":"TheNoshole","symbol":"🌹","title":"Puzzles Valentine"},
  {"npub":"npub1ymt2j3n8tesrlr0yhaheem6yyqmmwrr7actslurw6annls6vnrcslapxnz","symbol":"🌹","title":"Puzzles Valentine"},
  {"name":"island","symbol":"🥃","title":"Likes Bourbon"},
  {"npub":"npub1jzuma368395gu523y4vk4d34p0lxgctk436hggn4qcuj93075qgqtn3vm0","symbol":"🥃","title":"Likes Bourbon"},
  {"name":"Sai","symbol":"🎭","title":"Tragic Comedy"},
  {"npub":"npub16tnq9ruem6evwmywhu69xxl0qk802f03vf8hftvkuvw0n7mmz83stxcvw5","symbol":"🎭","title":"Tragic Comedy"},
  {"name":"puzzles","symbol":"🧩","title":"Retired Puzzle Maker"},
  {"npub":"npub12r0yjt8723ey2r035qtklhmdj90f0j6an7xnan8005jl7z5gw80qat9qrx","symbol":"🧩","title":"Retired Puzzle Maker"},
  {"npub":"npub1xd5apfmrpzfpr7w9l7uezm2fn8ztrdhvrtj3tlrmvvv8l6czqatshccdx5","symbol":"🐝","title":"Sweet Honeybee"},
  {"npub":"npub1l8zv3fhdntxq00u3nmrxvmrwpenpgway8y67z663t92x6hd98w3qkfkw83","symbol":"📚","title":"Well Read"},
  {"npub":"npub1xswmtflr4yclfyy4mq4y4nynnnu2vu5nk8jp0875khq9gnz0cthsc0p4xw","symbol":"🦩","title":"Flightless Bird Leader"},
  {"npub":"npub18u5f6090tcvd604pc8mgvr4t956xsn3rmfd04pj36szx8ne4h87qsztxdp","symbol":"🖋️","title":"May your pen always be inked!"},
  {"npub":"npub1tx5ccpregnm9afq0xaj42hh93xl4qd3lfa7u74v5cdvyhwcnlanqplhd8g","symbol":"🎨","title":"Painting one of a kinds"},
];

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

  let myInfo = myIdentity.info;
  let hasEnteredRoom = inRoom === roomId;

  let [showMyNavMenu, setShowMyNavMenu] = useState(false);
  let [showChat, setShowChat] = useState(false);
  let fullsizeAvatars = (localStorage.getItem('fullsizeAvatars') ?? 'true') == 'true';
  let [iAmAdmin, setIAmAdmin] = useState((localStorage.getItem('iAmAdmin') || 'false') == 'true');
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
      // get user identity info from server
      let id = identities[i];
      if (id.length == 43) {
        let jamId = id;
        let sessionStoreIdent = sessionStorage.getItem(jamId);
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
        // attempt to fetch user metadata from relays as needed, with incremental delay to
        // try to avoid overwhelming/spamming relays with parallel fetch requests. if this
        // still results in errors, then may need to do a bulk request for all metadata of
        // users in room in one go?
        /*
        sessionStoreIdent = sessionStorage.getItem(jamId);
        if (sessionStoreIdent) {
          const npub = getNpubFromInfo(sessionStoreIdent);
          if (npub) {
            let mc = sessionStorage.getItem(`${npub}`);
            if (!mc) {
              (async () => {
                let timeoutMC = setTimeout(() => {
                  (async () => {
                  const userPubkey = nip19.decode(npub).data;
                  const userInfo = await getUserMetadata(userPubkey, jamId);
                  })();
                }, 1000 * i);
              })();
            }
          }          
        }
        */
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
        <RoomHeader2
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

        { showChat && !fullsizeAvatars ? (
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
            nameSymbols,
          }}
        />
        )}

        {showChat && (
          <RoomChat
            {...{
              room,
              iModerate,
              iOwn,
              iAmAdmin,
              identities,
              myIdentity,
              peers,
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
        }}
      />
    </div>
  );
}
