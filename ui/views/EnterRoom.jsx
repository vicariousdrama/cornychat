import React, {useState} from 'react';
import {use} from 'use-minimal-state';
import {useMqParser, useWidth} from '../lib/tailwind-mqp';
import {useJam} from '../jam-core-react';
import {colors, isDark} from '../lib/theme.js';
import {signInExtension, signInPrivateKey} from '../nostr/nostr';

const iOS =
  /^iP/.test(navigator.platform) ||
  (/^Mac/.test(navigator.platform) && navigator.maxTouchPoints > 4);

const macOS = /^Mac/.test(navigator.platform) && navigator.maxTouchPoints === 0;

export default function EnterRoom({
  roomId,
  name,
  description,
  schedule,
  closed,
  forbidden,
}) {
  const [
    state,
    {enterRoom, setProps, updateInfo, addNostrPrivateKey},
  ] = useJam();
  let mqp = useMqParser();
  let otherDevice = use(state, 'otherDeviceInRoom');
  let room = use(state, 'room');
  let [nostrPrivateKey, setNostrPrivateKey] = React.useState('');
  let [loadingExtension, setLoadingExtension] = useState(false);
  let [loadingNsec, setLoadingNsec] = useState(false);
  let width = useWidth();
  let leftColumn = width < 720 ? 'hidden' : 'w-full';
  let rightColum =
    width < 720 ? 'w-full bg-white p-10' : 'w-9/12 bg-white p-10';
  const colorTheme = room?.color ?? 'default';
  const roomColor = colors(colorTheme);

  const textColor = isDark(roomColor.buttons.primary)
    ? roomColor.text.light
    : roomColor.text.dark;

  const LoadingIcon = () => {
    return (
      <div className="flex justify-center">
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 6.627 5.373 12 12 12v-4c-3.313 0-6-2.687-6-6z"
          ></path>
        </svg>
      </div>
    );
  };

  const handlerSignIn = async type => {
    if (type === 'nsec') {
      setLoadingNsec(true);
      const ok = await signInPrivateKey(
        nostrPrivateKey,
        state,
        setProps,
        updateInfo,
        enterRoom,
        addNostrPrivateKey
      );
      if (!ok) setLoadingNsec(false);
    }

    if (type === 'extension') {
      setLoadingExtension(true);
      const ok = await signInExtension(
        state.id,
        state.roomId,
        setProps,
        updateInfo,
        enterRoom
      );
      if (!ok) setLoadingExtension(false);
    }
  };

  return (
    <div className="flex h-screen">
      <div
        className={leftColumn}
        style={{backgroundColor: roomColor.background, opacity: '90%'}}
      ></div>
      <div className={rightColum}>
        {otherDevice && (
          <div
            className={
              'mt-5 mb--1 p-4 text-gray-700 rounded-lg border border-yellow-100 bg-yellow-50'
            }
          >
            <span className="text-gray-900 bg-yellow-200">Warning:</span> You
            already joined this room from a different device or browser tab.
            Click {`'`}
            Join{`'`} to switch to this tab.
          </div>
        )}
        {forbidden && (
          <div
            className={
              'mt-5 mb--1 p-4 text-gray-700 rounded-lg border border-yellow-100 bg-yellow-50'
            }
          >
            <span className="text-gray-900 bg-yellow-200">Warning:</span>
            <br />
            You are not allowed to enter this room. Move along!
          </div>
        )}
        <div className="text-center my-3">
          <p className="text-xl">{name}</p>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>

        <button
          onClick={() => {
            setProps({userInteracted: true});
            enterRoom(roomId);
          }}
          className={
            closed || forbidden
              ? 'hidden'
              : 'mt-5 select-none w-full h-12 px-6 text-lg text-white bg-gray-600 rounded-lg focus:shadow-outline active:bg-gray-600'
          }
          style={{
            backgroundColor: roomColor.buttons.primary,
            color: textColor,
          }}
        >
          Join
        </button>
        <button
          onClick={() => {
            handlerSignIn('extension');
          }}
          className={
            closed || forbidden
              ? 'hidden'
              : 'mt-5 select-none w-full h-12 px-6 text-lg text-white bg-gray-600 rounded-lg focus:shadow-outline active:bg-gray-600'
          }
          style={{
            backgroundColor: roomColor.buttons.primary,
            color: textColor,
          }}
        >
          {loadingExtension ? <LoadingIcon /> : 'Join with nostr extension'}
        </button>
        <div className="my-3 w-full text-center">
          <p>Or</p>
        </div>

        <div className="flex w-full justify-between">
          <input
            className={mqp(
              'rounded w-full placeholder-gray-400 bg-gray-50 w-full md:w-96'
            )}
            value={nostrPrivateKey}
            type="text"
            placeholder="Your nostr nsec"
            name="jam-room-topic"
            autoComplete="off"
            onChange={e => {
              setNostrPrivateKey(e.target.value);
            }}
          ></input>
          <button
            onClick={() => {
              handlerSignIn('nsec');
            }}
            className="select-none px-5 h-12 text-lg text-white focus:shadow-outline"
            style={{
              backgroundColor: roomColor.buttons.primary,
              color: textColor,
            }}
          >
            {loadingNsec ? <LoadingIcon /> : 'Join'}
          </button>
        </div>
        <div className="my-3 w-full text-center">
          <p className="text-gray-600 text-sm">
            Your private key is going to be deleted once you leave the room.
          </p>
        </div>
        <a
          className={
            schedule
              ? 'block mt-5 text-center h-12 p-3 px-6 text-lg text-gray-500'
              : 'hidden'
          }
          href={`/${roomId}.ics`}
          download={`${name || 'room'}.ics`}
        >
          🗓 Add to Calendar
        </a>

        <div className={iOS ? 'mt-40 text-gray-800 text-center' : 'hidden'}>
          🎧 Use headphones or earbuds
          <br />
          for the best audio experience on iOS
        </div>

        <div className={macOS ? 'mt-40 text-gray-800 text-center' : 'hidden'}>
          🎧 Use Chrome or Firefox instead of Safari
          <br />
          for the best audio experience on macOS
        </div>
        {/*
            if it is a future/scheduled room this button could be replaced with
        */}
        <button className="hidden h-12 px-6 text-lg text-black bg-gray-200 rounded-lg focus:shadow-outline active:bg-gray-300">
          ⏰ Alert me 5 min before
        </button>

        <button className="hidden h-12 px-6 text-lg text-black bg-gray-200 rounded-lg focus:shadow-outline active:bg-gray-300">
          🗓 Add this to my calendar
        </button>
      </div>
    </div>
  );
}
