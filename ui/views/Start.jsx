import React from 'react';
import {navigate} from '../lib/use-location';
import {useJam} from '../jam-core-react';
import {colors, isDark} from '../lib/theme';

export default function Start({newRoom = {}, urlRoomId, roomFromURIError}) {
  const [{room}, {enterRoom, setProps, createRoom}] = useJam();
  let {stageOnly = false} = newRoom;

  let submit = e => {
    e.preventDefault();
    setProps('userInteracted', true);
    let roomId;
    roomId = Math.random().toString(36).substr(2, 6);

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
  const roomColors = colors(colorTheme);

  const textColor = isDark(roomColors.background)
    ? roomColors.text.light
    : roomColors.text.dark;

  return (
    <div className="p-10 max-w-36 h-screen flex flex-col justify-evenly m-auto text-center items-center">
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
        <a
          href="https://gitlab.com/jam-systems/jam"
          target="_blank"
          rel="noreferrer"
          className="underline text-blue-800 active:text-blue-600"
        >
          Learn more about Room IDs
        </a>
        <br />
        <br />
        You can use the button below to start a room.
      </div>

      <div>
        <p style={{color: textColor}}>
          Create an audio space for chatting, brainstorming, debating, jamming,
          micro-conferences and more. Press the button below to start a room.
        </p>

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
          Start room
        </button>
      </div>
    </div>
  );
}
