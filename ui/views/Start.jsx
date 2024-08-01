import React, {useState, useEffect} from 'react';
import {navigate} from '../lib/use-location';
import {useJam,useJamState} from '../jam-core-react';
import {colors, isDark} from '../lib/theme';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import StartRoomSimple from './StartRoomSimple';
import StartScheduledEvent from './StartScheduledEvent';
import StartMyRoomSimple from './StartMyRoomSimple';

export default function Start({newRoom = {}, urlRoomId, roomFromURIError}) {
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomList, setRoomList] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventList, setEventList] = useState([]);
  const [loadingMyRooms, setLoadingMyRooms] = useState(false);
  const [myRoomList, setMyRoomList] = useState([]);
  const [{room}, {enterRoom, setProps, createRoom, listRooms, listScheduledEvents, listMyRooms}] = useJam();
  const [viewMode, setViewMode] = useState('liverooms');
  let {stageOnly = false, videoEnabled = false} = newRoom;
  const mainroomonly = [{"roomId":"mainchat","name":"Main Chat","description":"","logoURI":"","userCount":"0","userInfo":[]}];
  let myId = useJamState('myId');
  useEffect(() => {
    const loadRooms = async () => {
      setLoadingRooms(true);
      let roomlist = await(listRooms());
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
      let eventlist = await(listScheduledEvents());
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
      if (window.DEBUG) console.log(myId)
      let myroomlist = await(listMyRooms(myId));
      if (window.DEBUG) console.log(myroomlist);
      if (myroomlist.length > 0) {
        setMyRoomList(myroomlist[0]);
      } else {
        setMyRoomList([]);
      }
      setLoadingMyRooms(false);
    };
    loadMyRooms();
    if ((roomList.length == 0) && (myRoomList.length != 0)) {
      setViewMode("myrooms");
    }
  }, []);

  let submit = e => {
    let result = confirm('Are you sure you want to create a new room?');
    if (result != true) {
      return;
    }
    e.preventDefault();
    setProps('userInteracted', true);
    let roomId;
    const mn = bip39.generateMnemonic(wordlist).split(' ');
    const roomNum = (Math.floor(Math.random() * 1000)+1).toString();
    roomId = mn[0] + mn[1] + roomNum;

    (async () => {
      let roomPosted = {stageOnly, videoEnabled, currentSlide: 1, updateTime: Date.now(), roomSlides : [
        ["/img/tutorial/tutorial-01.png","Tutorial Start"],
        ["/img/tutorial/tutorial-02.png","Room Settings"],
        ["/img/tutorial/tutorial-03.png","Basic Room Info"],
        ["/img/tutorial/tutorial-04.png","Designer Settings"],
        ["/img/tutorial/tutorial-05.png","Managing Links"],
        ["/img/tutorial/tutorial-06.png","Managing Slides"],
        ["/img/tutorial/tutorial-07.png","Custom Emojis"],
        ["/img/tutorial/tutorial-08.png","Owners, Moderators, and Speakers"],
        ["/img/tutorial/tutorial-09.png","Scheduling Events"],
        ["/img/tutorial/tutorial-10.png","Tutorial Conclusion"]
      ]};
      let ok = await createRoom(roomId, roomPosted);
      if (ok) {
        if (urlRoomId !== roomId) navigate('/' + roomId);
        enterRoom(roomId);
      }
    })();
  };

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
        The Room ID <code className="text-gray-900 bg-yellow-200">{urlRoomId}</code> is not valid.
        <br />
        {((urlRoomId ?? '').length < 4) && (
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
          <p style={{color: textColor, backgroundColor: roomColors.background}} className="room-header">
            Corny Chat is your place for chatting with friends!
          </p>
          <div style={{color: textColor}} className="jam">
            <p style={{color: textColor, backgroundColor: roomColors.background}} className="room-header">
            For technical support, contact <a href="https://njump.me/npub1yx6pjypd4r7qh2gysjhvjd9l2km6hnm4amdnjyjw3467fy05rf0qfp7kza" style={{textDecoration: 'underline'}}>Vic on Nostr</a>
            </p>
            <p style={{color: textColor, backgroundColor: roomColors.background}} className="room-header">
            <a href="/about" style={{textDecoration: 'underline'}}>About Corny Chat</a>
            </p>
          </div>
          <a className={'hidden'} href="me">identity</a>
        </div>

        <div className="flex flex-wrap justify-center">
          <div className="cursor-pointer text-white mt-2 mb-2" style={{border:'1px solid rgb(1,111,210)', width: '100px', backgroundColor: (viewMode == 'liverooms' ? 'rgb(1,111,210)' : roomColors.background)}}
            onClick={async (e) => {
              e.stopPropagation();
              setViewMode('liverooms');
            }}          
          >Live Rooms</div>
          <div className="cursor-pointer text-white m-2" style={{border:'1px solid rgb(110,47,210)', width: '100px', backgroundColor: (viewMode == 'myrooms' ? 'rgb(110,47,218)' : roomColors.background)}}
            onClick={async (e) => {
              e.stopPropagation();
              setViewMode('myrooms');
            }}
          >My Rooms</div>
          <div className="cursor-pointer text-white mt-2 mb-2" style={{border:'1px solid rgb(7,74,40)', width: '100px', backgroundColor: (viewMode == 'scheduled' ? 'rgb(7,74,40)' : roomColors.background)}}
            onClick={async (e) => {
              e.stopPropagation();
              setViewMode('scheduled');
            }}          
          >Scheduled</div>
        </div>
        <div style={{align: 'center'}}>
          <div style={{display:'block',color:`rgb(244,244,244)`}}>
            { viewMode == 'liverooms' && (
              <>
              {roomList.length == 0 && (
                <>
                <h1>No Live Rooms.</h1>
                <p>Do you want to start one?</p>
                </>
              )}
              {roomList.length > 0 && (
                roomList.map((roomInfo,i) => {
                  return <StartRoomSimple roomInfo={roomInfo} index={i} key={i} />
                })
              )}
              </>
            )}
            { viewMode == 'myrooms' && (
              <>
              {myRoomList.length == 0 && (
                <>
                <h1>No room associations</h1>
                <p>No rooms were found where you are an owner, moderator or speaker for this device</p>
                </>
              )}
              {myRoomList.length > 0 && (
                myRoomList.map((myRoomInfo,i) => {
                  return <StartMyRoomSimple roomInfo={myRoomInfo} index={i} myId={myId} key={i} />
                })
              )}
              </>
            )}
            { viewMode == 'scheduled' && (
              <>
              {eventList.length == 0 && (
                <>
                <h1>No scheduled events</h1>
                <p>No scheduled events were found at this time.  You can schedule an event for the future by creating a room and accessing room settings.</p>
                </>
              )}
              {eventList.length > 0 && (
                eventList.map((eventInfo,i) => {
                  return <StartScheduledEvent eventInfo={eventInfo} index={i} key={i} />
                })
              )}
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

      </div>
    </div>
  );
}
