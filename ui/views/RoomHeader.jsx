import React, {useState} from 'react';
import ReactMarkdown from 'react-markdown';
import {isDark} from '../lib/theme';
import {useJamState} from '../jam-core-react/JamContext';
import {MicOnSvg} from './Svg';

export default function RoomHeader({
  colors,
  name,
  description,
  logoURI,
  buttonURI,
  buttonText,
  audience,
  editRoom,
  closeRoom,
}) {
  let [isRecording, isPodcasting] = useJamState([
    'isSomeoneRecording',
    'isSomeonePodcasting',
  ]);

  isRecording = isRecording || isPodcasting;
  const textColor = isDark(colors.background)
    ? colors.text.light
    : colors.text.dark;
  return (
    <div className="flex justify-between w-full py-4 px-10 items-center">
      <div className="flex">
        {logoURI && (
          <div className="flex-none">
            <img
              alt={'room icon'}
              className="w-8 h-8 border rounded p-1 m-2 mt-0"
              src={logoURI}
              style={{objectFit: 'cover'}}
            />
          </div>
        )}
        <div className="flex flex-wrap">
          <p className="text-sm mr-2" style={{color: textColor}}>
            {name} |
          </p>
          <p className="text-sm opacity-70" style={{color: textColor}}>
            {description}
          </p>
        </div>
      </div>
      <div className="flex-none align-center flex">
        <div className={buttonURI && buttonText ? 'call-to-action' : 'hidden'}>
          <a
            href={buttonURI}
            className="rounded-lg px-5 m-auto py-1.5 mx-1.5 whitespace-nowrap text-sm"
            target="_blank"
            rel="noreferrer"
            style={{
              color: isDark(colors.buttons.primary)
                ? colors.text.light
                : colors.text.dark,
              backgroundColor: colors.buttons.primary,
            }}
          >
            {buttonText}
          </a>
        </div>
        <div
          className="flex rounded-lg m-auto px-2 py-2 mx-1.5 justify-between align-center text-sm"
          style={{
            color: isDark(colors.buttons.primary)
              ? colors.text.light
              : colors.text.dark,
            backgroundColor: colors.buttons.primary,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke={
                isDark(colors.buttons.primary)
                  ? colors.icons.light
                  : colors.icons.dark
              }
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
          <div className="px-1">{audience}</div>
        </div>
        {isRecording && (
          <div aria-label="Recording" className="flex items-center w-8 h-6">
            <MicOnSvg className="h-5" stroke="#f80000" />
          </div>
        )}
        {closeRoom ? (
          <div className={'text-sm mr-2'} style={{color: textColor}}>
            Room is closed
          </div>
        ) : null}
        {editRoom && (
          <div
            role="button"
            aria-label="Room settings"
            className="w-8 h-6 cursor-pointer"
            onClick={editRoom}
            style={{
              color: isDark(colors.background)
                ? colors.icons.light
                : colors.icons.dark,
            }}
          >
            <EditSvg />
          </div>
        )}
      </div>
    </div>
  );
}

function EditSvg() {
  return (
    <svg
      className="w-6 h-6"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
