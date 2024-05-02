import React, {useState, useEffect} from 'react';
import {navigate} from '../lib/use-location';
import {useJam} from '../jam-core-react';
import {colors, isDark} from '../lib/theme';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import StartRoomSimple from './StartRoomSimple';
import StartScheduledEvent from './StartScheduledEvent';

export default function Start({newRoom = {}, urlRoomId, roomFromURIError}) {
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomList, setRoomList] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventList, setEventList] = useState([]);
  const [{room}, {enterRoom, setProps, createRoom, listRooms, listScheduledEvents}] = useJam();
  let {stageOnly = false, videoEnabled = false} = newRoom;
  const mainroomonly = [{"roomId":"mainchat","name":"Main Chat","description":"","logoURI":"","userCount":"0","userInfo":[]}];

  useEffect(() => {
    const loadRooms = async () => {
      setLoadingRooms(true);
      let roomlist = await(listRooms());
      if (roomlist[0].length > 0) {
        setRoomList(roomlist[0]);
      } else {
        setRoomList(); //mainroomonly);
      }
      setLoadingRooms(false);
      console.log(roomlist);
    };
    const loadEvents = async () => {
      setLoadingEvents(true);
      let eventlist = await(listScheduledEvents());
      setEventList(eventlist[0]);
      setLoadingEvents(false);
      console.log(eventlist);
    };
    loadRooms();
    loadEvents();
  }, []);

  let submit = e => {
    e.preventDefault();
    setProps('userInteracted', true);
    let roomId;
    const mn = bip39.generateMnemonic(wordlist).split(' ');
    const roomNum = (Math.floor(Math.random() * 1000)+1).toString();
    roomId = mn[0] + mn[1] + roomNum;

    (async () => {
      let roomPosted = {stageOnly, videoEnabled, currentSlide: 1, roomSlides : [
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
        You can use the button below to start a new room named room.
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

        { loadingRooms ? (<h4 style={{align: 'center'}}>Loading...</h4>) : (
        <>
          { roomList?.length > 0 && (
        <div style={{align: 'center'}}>
          <div style={{display:'block',color:`rgb(244,244,244)`}}>
            <h1>Live Rooms</h1>
          </div>
          {
            roomList?.map((roomInfo) => {
              return <StartRoomSimple roomInfo={roomInfo} key={roomInfo.roomId} />
            })
          }
        </div>
        )}
        </>
        )}

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

        { eventList?.length > 0 && (
        <div style={{align: 'center'}}>
        <div style={{display:'block',color:`rgb(244,244,244)`}}>
        <h1>Scheduled Events</h1>
        </div>
        <div className="flex flex-wrap justify-center">
        { loadingEvents ? (<h4>Loading...</h4>) : (eventList?.map((eventInfo) => {
          return <StartScheduledEvent eventInfo={eventInfo} key={eventInfo.location} />
          }))
        }
        </div>
        </div>
        )}

      </div>
    </div>
  );
}
