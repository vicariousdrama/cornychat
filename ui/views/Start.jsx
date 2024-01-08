import React, {useState, useEffect} from 'react';
import {navigate} from '../lib/use-location';
import {useJam} from '../jam-core-react';
import {colors, isDark} from '../lib/theme';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import StartRoomCard from './StartRoomCard';
import StartEventCard from './StartEventCard';

export default function Start({newRoom = {}, urlRoomId, roomFromURIError}) {
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomList, setRoomList] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventList, setEventList] = useState([]);
  const [{room}, {enterRoom, setProps, createRoom, listRooms, listStaticRooms, listStaticEvents}] = useJam();
  let {stageOnly = false} = newRoom;

  useEffect(() => {
    const loadRooms = async () => {
      setLoadingRooms(true);
      let roomlist = await(listStaticRooms());
      setRoomList(roomlist[0]);
      setLoadingRooms(false);
      console.log(roomlist);
    };
    const loadEvents = async () => {
      setLoadingEvents(true);
      let eventlist = await(listStaticEvents());
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
      let roomPosted = {stageOnly};
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
        The Room ID{' '}
        <code className="text-gray-900 bg-yellow-200">{urlRoomId}</code> is not
        valid.
        <br />
        <br />
        <br />
        You can use the button below to start a room.
      </div>

      <br />
      <a href="https://nostrudel.ninja/#/u/npub1ymt2j3n8tesrlr0yhaheem6yyqmmwrr7actslurw6annls6vnrcslapxnz/notes">
      <div class="pictureFrame">
        <img src="./img/startImage.jpg" class="pictureImage" />
        <br />
        Art by TheNoshole
      </div>
      </a>

      <div>
        <p style={{color: textColor}}>
          Nostr Live Audio Spaces is for chatting, brainstorming, debating, jamming,
          <br />
          micro-conferences and more. Join an existing room or start a new one using the buttons below.
        </p>
        <br />

        <div style={{align: 'center'}}>
        { loadingEvents ? (<h4>Loading...</h4>) : (eventList?.map((eventInfo) => {
          return <StartEventCard eventInfo={eventInfo} key={eventInfo.eventId} />
          }))
        }
        </div>

        <div style={{align: 'center'}}>
        { loadingRooms ? (<h4>Loading...</h4>) : (roomList?.map((roomInfo) => {
          return <StartRoomCard roomInfo={roomInfo} key={roomInfo.roomId} />
          }))
        }
        </div>

        <br /><br />

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

        <br /><br /><br />

        <div style={{color: textColor}} className="jam">
          <p style={{color: textColor, backgroundColor: roomColors.background}} className="room-header">
          Built by Nostr Live Audio Spaces Developers as a fork of Jam by Jam Systems Developers.
          </p>
          <p style={{color: textColor, backgroundColor: roomColors.background}} className="room-header">
          Download from <a href="https://github.com/diamsa/jam">github.com/diamsa/jam</a> to host and run your own instance.
          </p>
        </div>
      </div>
    </div>
  );
}
