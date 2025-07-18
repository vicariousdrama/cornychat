import React, {useState, useEffect} from 'react';
import {navigate} from '../lib/use-location';
import {useJam, useJamState} from '../jam-core-react';
import {colors, isDark} from '../lib/theme';
import * as bip39 from '@scure/bip39';
import {wordlist} from '@scure/bip39/wordlists/english';
import StartRoomSimple from './StartRoomSimple';
import StartScheduledEvent from './StartScheduledEvent';
import StartMyRoomSimple from './StartMyRoomSimple';
import ZapGoalBar from './ZapGoalBar';
import {useMqParser} from '../lib/tailwind-mqp';
import {loadFavoriteRooms} from '../nostr/nostr';

export default function Start({newRoom = {}, urlRoomId, roomFromURIError}) {
  const [editingMOTD, setEditingMotd] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomList, setRoomList] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventList, setEventList] = useState([]);
  const [loadingMyRooms, setLoadingMyRooms] = useState(false);
  const [myRoomList, setMyRoomList] = useState([]);
  const [myFavoritedRooms, setMyFavoritedRooms] = useState([]);
  const [loadingZapGoal, setLoadingZapGoal] = useState(false);
  const [showDeleteOldRooms, setShowDeleteOldRooms] = useState(true);
  const [zapGoal, setZapGoal] = useState({});
  const [loadingScores, setLoadingScores] = useState(false);
  const [highScores, setHighScores] = useState([]);
  const [
    {room},
    {
      enterRoom,
      getRoom,
      setProps,
      createRoom,
      deleteOldRooms,
      listRooms,
      listScheduledEvents,
      listMyRooms,
      listHighScores,
      getZapGoal,
      getMOTD,
      setMOTD,
    },
  ] = useJam();
  const [viewMode, setViewMode] = useState('liverooms');
  const colorGroupLive = `rgba(1,111,210,1)`;
  const colorGroupMyRooms = `rgba(110,47,210,1)`;
  const colorGroupScheduled = `rgba(7,74,40,1)`;
  const [borderActiveGroup, setBorderActiveGroup] = useState(colorGroupLive);
  const [backgroundColorActive, setBackgroundColorActive] = useState(
    colorGroupLive.replace(')', ',.25)')
  );
  let {stageOnly = false, videoEnabled = false} = newRoom;
  const mainroomonly = [
    {
      roomId: 'mainchat',
      name: 'Main Chat',
      description: '',
      logoURI: '',
      userCount: '0',
      userInfo: [],
    },
  ];
  const [motd, setMotd] = useState(undefined);
  let mqp = useMqParser();
  let myId = useJamState('myId');
  let iAmAdmin = (localStorage.getItem('iAmAdmin') || 'false') == 'true';
  let motdCurrent = '';
  useEffect(() => {
    const loadHighScores = async () => {
      if (!loadingScores) {
        setLoadingScores(true);
        let hs = await loadHighScores();
        localStorage.setItem('scores' + hs.week, JSON.stringify(hs.scores));
        setLoadingScores(false);
        if (window.DEBUG) console.log(hs);
      }
    };
    const loadZapGoal = async () => {
      setLoadingZapGoal(true);
      let zg = await getZapGoal('🌽');
      zg = zg[0];
      if (zg.created_at > 0) {
        setZapGoal(zg);
        sessionStorage.setItem('serverPubkey', zg.pubkey);
      }
      setLoadingZapGoal(false);
      if (window.DEBUG) console.log(zapGoal);
    };
    loadZapGoal();
    const loadRooms = async () => {
      setLoadingRooms(true);
      let roomlist = await listRooms();
      if (roomlist[0].length > 0) {
        setRoomList(roomlist[0]);
      } else {
        setRoomList([]); //mainroomonly);
      }
      setLoadingRooms(false);
      if (window.DEBUG) console.log(roomlist);
    };
    loadRooms();
    const loadEvents = async () => {
      setLoadingEvents(true);
      let eventlist = await listScheduledEvents();
      if (eventlist[0].length > 0) {
        setEventList(eventlist[0]);
      } else {
        setEventList([]);
      }
      setLoadingEvents(false);
      if (window.DEBUG) console.log(eventlist);
    };
    loadEvents();
    const loadMyRooms = async () => {
      setLoadingMyRooms(true);
      if (window.DEBUG) console.log(myId);
      let myroomlist = await listMyRooms(myId);
      if (window.DEBUG) console.log(myroomlist);
      if (myroomlist.length > 0) {
        setMyRoomList(myroomlist[0]);
      } else {
        setMyRoomList([]);
      }
      setLoadingMyRooms(false);
    };
    loadMyRooms();
    const loadMOTD = async () => {
      let motdinfo = await getMOTD();
      if (motdinfo && motdinfo[1]) {
        motdCurrent = motdinfo[0].motd || 'No MOTD';
        setMotd(motdCurrent);
      }
    };
    loadMOTD();
    if (roomList.length == 0 && myRoomList.length != 0) {
      setViewMode('myrooms');
    }
    const loadMyFavoritedRooms = async () => {
      let myFavoritedRooms = await loadFavoriteRooms();
      if (myFavoritedRooms) {
        setMyFavoritedRooms(myFavoritedRooms);
      }
    };
    loadMyFavoritedRooms();
  }, []);

  let submit = e => {
    e.preventDefault();
    setProps('userInteracted', true);
    let roomId;
    const mn = bip39.generateMnemonic(wordlist).split(' ');
    const roomNum = (Math.floor(Math.random() * 1000) + 1).toString();
    roomId = mn[0] + mn[1] + roomNum;
    roomId = prompt(
      'Set your desired room id for the room url or use this randomly selected one',
      roomId
    );
    if (roomId == null || roomId == undefined) return;
    let match = roomId.match(/^[a-z0-9]{4,24}$/);
    if (!match) {
      alert(
        'The room id must be between 4 and 24 lowercase characters and numbers'
      );
      return;
    }
    roomId = match[0];
    (async () => {
      try {
        let currentroom = await getRoom(roomId);
        if (currentroom?.owners) {
          alert('The room id specified already exists');
          return;
        }
      } catch (e) {
        // room probably doesnt exist
      }
      let theTime = Date.now();
      let addTutorialSlides = false;
      let tutorialSlides = [
        ['/img/tutorial/tutorial-01.png', 'Tutorial Start'],
        ['/img/tutorial/tutorial-02.png', 'Room Settings'],
        ['/img/tutorial/tutorial-03.png', 'Basic Room Info'],
        ['/img/tutorial/tutorial-04.png', 'Designer Settings'],
        ['/img/tutorial/tutorial-05.png', 'Managing Links'],
        ['/img/tutorial/tutorial-06.png', 'Managing Slides'],
        ['/img/tutorial/tutorial-07.png', 'Custom Emojis'],
        ['/img/tutorial/tutorial-08.png', 'Owners, Moderators, and Speakers'],
        ['/img/tutorial/tutorial-09.png', 'Scheduling Events'],
        ['/img/tutorial/tutorial-10.png', 'Tutorial Conclusion'],
      ];
      let roomPosted = {
        name: roomId,
        stageOnly,
        videoEnabled,
        updateTime: theTime,
        createdTime: theTime,
      };
      if (addTutorialSlides) {
        roomPosted['roomSlides'] = tutorialSlides;
        roomPosted['currentSlide'] = 1;
      }
      let ok = await createRoom(roomId, roomPosted);
      if (ok) {
        if (urlRoomId !== roomId) navigate('/' + roomId);
        enterRoom(roomId);
      }
      if (!ok) {
        alert('An error occurred creating a room with this id.');
      }
    })();
  };

  let adminDeleteOldRooms = e => {
    e.preventDefault();
    setProps('userInteracted', true);
    (async () => {
      let r = await deleteOldRooms();
      setShowDeleteOldRooms(!r);
    })();
  };

  async function saveMotd(e) {
    e.preventDefault();
    (async () => {
      let r = await setMOTD(motd);
    })();
    motdCurrent = motd;
    setEditingMotd(false);
  }

  async function cancelMotd(e) {
    e.preventDefault();
    setMotd(motdCurrent);
    setEditingMotd(false);
  }

  const colorTheme = room?.color ?? 'default';
  const roomColors = colors(colorTheme, room.customColor);

  const textColor = isDark(roomColors.background)
    ? roomColors.text.light
    : roomColors.text.dark;

  return (
    <div className="p-2 max-w-s flex flex-col justify-evenly m-auto text-center items-center">
      <div
        className={
          roomFromURIError
            ? 'mb-12 p-4 text-gray-700 rounded-lg border border-yellow-100 bg-yellow-50'
            : 'hidden'
        }
      >
        The Room ID{' '}
        <code className="text-gray-900 bg-yellow-200">{urlRoomId}</code> is not
        valid.
        <br />
        {(urlRoomId ?? '').length < 4 && (
          <>
            The Room ID must be at least 4 characters.
            <br />
          </>
        )}
        You can use the button below to start a new room.
      </div>

      <br />
      <img src="/img/homepage-header.png" />

      <div>
        <div style={{color: textColor}} className="jam">
          <p
            style={{color: textColor, backgroundColor: roomColors.background}}
            className="room-header"
          >
            Corny Chat is your place for chatting with friends!
          </p>
        </div>

        {zapGoal.hasOwnProperty('content') && (
          <center>
            <div style={{width: '320px'}}>
              <center>
                <ZapGoalBar
                  zapgoal={zapGoal}
                  textColorTitle={textColor}
                  backgroundColorTitle={'rgb(1,111,210)'}
                  textColorFilled={textColor}
                  backgroundColorFilled={'rgb(24,128,24)'}
                  textColorUnfilled={textColor}
                  backgroundColorUnfilled={'rgb(64,32,0)'}
                  borderColorUnfilled={'rgb(255,128,0)'}
                />
              </center>
            </div>
          </center>
        )}

        {motd && (
          <div
            className="text-white p-2 mt-2 mr-1 ml-1 rounded-md"
            style={{
              border: '1px solid rgb(210, 84, 0)',
              width: '100%',
              backgroundColor: roomColors.background,
            }}
          >
            {editingMOTD && (
              <div className="flex">
                <input
                  className={mqp(
                    'rounded placeholder-black bg-gray-400 text-black w-full mx-1 md:w-full'
                  )}
                  type="text"
                  placeholder=""
                  value={motd}
                  autoComplete="off"
                  style={{
                    borderWidth: '0px',
                    fontSize: '15px',
                  }}
                  onChange={e => {
                    setMotd(e.target.value);
                  }}
                ></input>
                <button
                  className="px-2 mx-1 h-10 text-sm rounded-md"
                  style={{
                    color: 'rgb(204,204,204)',
                    backgroundColor: 'rgb(10,104,0)',
                  }}
                  onClick={e => saveMotd(e)}
                >
                  Save
                </button>
                <button
                  className="px-2 mx-1 h-10 text-sm rounded-md"
                  style={{
                    color: 'rgb(204,204,204)',
                    backgroundColor: 'rgb(104,10,0)',
                  }}
                  onClick={e => cancelMotd(e)}
                >
                  Cancel
                </button>
              </div>
            )}
            {!editingMOTD && (
              <p
                className="text-md mr-1 text-gray-200"
                style={{
                  cursor: iAmAdmin ? 'pointer' : 'default',
                  whiteSpace: 'pre-line',
                }}
                onClick={() => {
                  if (iAmAdmin) {
                    setEditingMotd(true);
                  }
                }}
              >
                {motd}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-center">
          <div
            className="cursor-pointer text-white p-2 mt-2 mr-1 rounded-t-md"
            style={{
              border: `1px solid ${colorGroupLive}`,
              width: '100px',
              backgroundColor:
                viewMode == 'liverooms'
                  ? colorGroupLive
                  : roomColors.background,
            }}
            onClick={async e => {
              e.stopPropagation();
              setViewMode('liverooms');
              setBorderActiveGroup(colorGroupLive);
              setBackgroundColorActive(colorGroupLive.replace(',1)', ',.25)'));
            }}
          >
            Live Rooms
          </div>
          <div
            className="cursor-pointer text-white p-2 mt-2 mr-1 ml-1 rounded-t-md"
            style={{
              border: `1px solid ${colorGroupMyRooms}`,
              width: '100px',
              backgroundColor:
                viewMode == 'myrooms'
                  ? colorGroupMyRooms
                  : roomColors.background,
            }}
            onClick={async e => {
              e.stopPropagation();
              setViewMode('myrooms');
              setBorderActiveGroup(colorGroupMyRooms);
              setBackgroundColorActive(
                colorGroupMyRooms.replace(',1)', ',.25)')
              );
            }}
          >
            My Rooms
          </div>
          <div
            className="cursor-pointer text-white p-2 mt-2 ml-1 rounded-t-md"
            style={{
              border: `1px solid ${colorGroupScheduled}`,
              width: '100px',
              backgroundColor:
                viewMode == 'scheduled'
                  ? colorGroupScheduled
                  : roomColors.background,
            }}
            onClick={async e => {
              e.stopPropagation();
              setViewMode('scheduled');
              setBorderActiveGroup(colorGroupScheduled);
              setBackgroundColorActive(
                colorGroupScheduled.replace(',1)', ',.25)')
              );
            }}
          >
            Discovery
          </div>
        </div>
        <div style={{align: 'center'}}>
          <div
            className="rounded-md w-full"
            style={{
              display: 'inline-block',
              color: `rgb(244,244,244)`,
              border: `3px solid ${borderActiveGroup}`,
              backgroundColor: backgroundColorActive,
              align: 'center',
            }}
          >
            {viewMode == 'liverooms' && (
              <>
                {roomList.length == 0 && (
                  <>
                    <h1>No Live Rooms on this instance.</h1>
                    <p>
                      View live activities on other instances and services via
                      the Discover tab. Or, click the button below to start a
                      new room.
                    </p>
                  </>
                )}
                {roomList.length > 0 &&
                  roomList.map((roomInfo, i) => {
                    return (
                      <StartRoomSimple
                        roomInfo={roomInfo}
                        index={i}
                        key={i}
                        myFavoritedRooms={myFavoritedRooms}
                      />
                    );
                  })}
              </>
            )}
            {viewMode == 'myrooms' && (
              <>
                {myRoomList.length == 0 && (
                  <>
                    <h1>No room associations</h1>
                    <p>
                      No rooms were found where you are an owner, moderator or
                      speaker for this device
                    </p>
                  </>
                )}
                {myRoomList.length > 0 &&
                  myRoomList.map((myRoomInfo, i) => {
                    return (
                      <StartMyRoomSimple
                        roomInfo={myRoomInfo}
                        index={i}
                        myId={myId}
                        key={i}
                        myFavoritedRooms={myFavoritedRooms}
                      />
                    );
                  })}
                {myRoomList.length > 0 && iAmAdmin && showDeleteOldRooms && (
                  <button
                    onClick={adminDeleteOldRooms}
                    className="select-none h-12 px-6 text-lg rounded-lg mt-3 p-2 absolute"
                    style={{
                      backgroundColor: `rgb(255,102,0)`,
                      color: `rgb(244,244,244)`,
                      bottom: '110px',
                      right: '5px',
                    }}
                  >
                    Delete Old Rooms
                  </button>
                )}
              </>
            )}
            {viewMode == 'scheduled' && (
              <>
                {eventList.length == 0 && (
                  <>
                    <h1>No scheduled events</h1>
                    <p>
                      No scheduled events were found at this time. You can
                      schedule an event for the future by creating a room and
                      accessing room settings.
                    </p>
                  </>
                )}
                {eventList.length > 0 &&
                  eventList.map((eventInfo, i) => {
                    return (
                      <StartScheduledEvent
                        eventInfo={eventInfo}
                        index={i}
                        key={i}
                      />
                    );
                  })}
              </>
            )}
          </div>
        </div>

        <button
          onClick={submit}
          className="select-none h-12 px-6 text-lg rounded-lg mt-3"
          style={{
            backgroundColor: roomColors.buttons.primary,
            color: isDark(roomColors.buttons.primary)
              ? roomColors.text.light
              : roomColors.text.dark,
          }}
        >
          Start a new room
        </button>

        <div style={{color: textColor}} className="jam">
          <div style={{color: textColor}} className="jam">
            <p
              style={{color: textColor, backgroundColor: roomColors.background}}
              className="room-header"
            >
              For technical support, contact{' '}
              <a
                href="https://njump.me/npub1yx6pjypd4r7qh2gysjhvjd9l2km6hnm4amdnjyjw3467fy05rf0qfp7kza"
                style={{textDecoration: 'underline'}}
              >
                Vic on Nostr
              </a>
            </p>
            <p
              style={{color: textColor, backgroundColor: roomColors.background}}
              className="room-header"
            >
              <a href="/about" style={{textDecoration: 'underline'}}>
                About Corny Chat
              </a>
            </p>
          </div>
          <a className={'hidden'} href="me">
            identity
          </a>
        </div>
      </div>
    </div>
  );
}
