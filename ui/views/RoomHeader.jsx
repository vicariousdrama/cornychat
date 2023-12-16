import React from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import {isDark} from '../lib/theme';
import {useJamState} from '../jam-core-react/JamContext';
import {MicOnSvg} from './Svg';

export default function RoomHeader({
  colors,
  name,
  description,
  logoURI,
  roomLinks,
  showLinks,
  setShowLinks,
  audience,
  closed,
}) {
  let [isRecording, isPodcasting] = useJamState([
    'isSomeoneRecording',
    'isSomeonePodcasting',
  ]);

  isRecording = isRecording || isPodcasting;
  const textColor = isDark(colors.background)
    ? colors.text.light
    : colors.text.dark;

  function linkSubstring(text) {
    return text.substring(0, 40);
  }
  return (
    <div className="flex justify-between w-full py-4 px-5 items-center">
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
        <div
          className="flex flex-wrap px-4 py-2 rounded-lg"
          style={{backgroundColor: colors.avatarBg}}
        >
          <p className="text-sm mr-2" style={{color: textColor}}>
            {name} |
          </p>
          <div style={{color: textColor}}>
            <ReactMarkdown className="text-sm opacity-70" plugins={[gfm]}>
              {description || ''}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      <div className="w-72 items-center flex justify-end">
        <div
          className="flex rounded-lg m-auto px-2 py-2 mx-1.5 justify-between cursor-pointer align-center text-sm"
          style={{backgroundColor: colors.avatarBg}}
          onClick={() => setShowLinks(!showLinks)}
        >
          {' '}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke={
                isDark(colors.avatarBg) ? colors.icons.light : colors.icons.dark
              }
              d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
            />
          </svg>
        </div>
        {showLinks ? (
          <div
            className="absolute mt-56 z-10 w-72 h-40 overflow-y-scroll p-3 rounded-lg"
            style={{backgroundColor: colors.avatarBg}}
          >
            {!roomLinks || roomLinks.length === 0 ? (
              <p className="text-xs" style={{color: textColor}}>
                This room has no Links
              </p>
            ) : (
              roomLinks.map(links => {
                return (
                  <div className="mb-2">
                    <a href={links[1]} target="_blank">
                      <p className="text-xs" style={{color: textColor}}>
                        {linkSubstring(links[0])}
                      </p>
                      <p
                        className="text-xs opacity-60"
                        style={{color: textColor}}
                      >
                        {linkSubstring(links[1])}
                      </p>
                    </a>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
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
        {closed ? (
          <div className={'text-sm mr-2'} style={{color: textColor}}>
            Room is closed
          </div>
        ) : null}
      </div>
    </div>
  );
}
