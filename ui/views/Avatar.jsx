import React, {useEffect, useState} from 'react';
import {avatarUrl, displayName} from '../lib/avatar';
import animateEmoji from '../lib/animate-emoji';
import {useMqParser} from '../lib/tailwind-mqp';
import {colors, isDark} from '../lib/theme';

export function StageAvatar({
  room,
  speaking,
  canSpeak,
  moderators,
  peerId,
  peerState,
  reactions,
  info,
  onClick,
}) {
  let mqp = useMqParser();
  let {micMuted, inRoom = null} = peerState || {};
  let reactions_ = reactions[peerId];
  info = info || {id: peerId};
  let isSpeaking = speaking.has(peerId);
  let isModerator = moderators.includes(peerId);
  const colorTheme = room?.color ?? 'default';
  const roomColor = colors(colorTheme, room.customColor);

  const textColor = isDark(roomColor.avatarBg)
    ? roomColor.text.light
    : roomColor.text.dark;

  const iconColor = isDark(roomColor.background)
    ? roomColor.icons.light
    : roomColor.icons.dark;

  return (
    inRoom && (
      <div
        className="p-3 m-2 rounded-lg w-36 h-46"
        style={{backgroundColor: roomColor.avatarBg}}
      >
        <div className="relative flex flex-col items-center">
          <div
            className="w-16 h-16 border-2 rounded-full mx-auto"
            style={{
              borderColor: isSpeaking ? roomColor.buttons.primary : 'white',
            }}
          >
            <img
              className="w-full h-full rounded-full cursor-pointer"
              alt={displayName(info, room)}
              src={avatarUrl(info, room)}
              onClick={onClick}
            />
          </div>

          {(!!micMuted || !canSpeak) && (
            <div
              className="absolute bottom-0 mt-4 right-2 rounded-full p-2"
              style={{backgroundColor: roomColor.background}}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke={iconColor}
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                />

                <line
                  y1="4.5"
                  x2="40"
                  y2="25"
                  stroke={iconColor}
                  stroke-width="2"
                />
              </svg>
            </div>
          )}
        </div>

        <Reactions
          reactions={reactions_}
          className={mqp(
            'absolute text-5xl  pt-4 md:pt-5 human-radius w-20 h-20 md:w-16 md:h-16 border text-center'
          )}
          emojis={room.customEmojis}
          style={{backgroundColor: roomColor.buttons.primary}}
        />

        <div class="w-full mb-2 text-center">
          <div className="flex justify-center items-center">
            <div>
              <span
                className={mqp(
                  'text-sm md:text-base whitespace-nowrap w-22 md:w-30 font-medium'
                )}
                style={{color: textColor}}
              >
                <span
                  className={
                    isModerator
                      ? 'flex-none inline-block leading-3 bg-gray-600 text-white w-3 h-3 rounded-full -ml-3'
                      : 'hidden'
                  }
                  style={{
                    backgroundColor: roomColor.background,
                    color: roomColor.buttons.primary,
                  }}
                >
                  <svg
                    className="inline-block w-2 h-2"
                    style={{margin: '-3px 0 0 0'}}
                    x="0px"
                    y="0px"
                    viewBox="0 0 1000 1000"
                    enableBackground="new 0 0 1000 1000"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M894.5,633.4L663.3,500l231.1-133.4c39.1-22.6,52.4-72.5,29.9-111.6c-22.6-39.1-72.5-52.4-111.6-29.9L581.7,358.5V91.7c0-45.1-36.6-81.7-81.7-81.7c-45.1,0-81.7,36.6-81.7,81.7v266.9L187.2,225.1c-39.1-22.6-89-9.2-111.6,29.9c-22.6,39.1-9.2,89,29.9,111.6L336.7,500L105.5,633.4C66.5,656,53.1,705.9,75.6,745c22.6,39.1,72.5,52.4,111.6,29.9l231.1-133.4v266.9c0,45.1,36.6,81.7,81.7,81.7c45.1,0,81.7-36.6,81.7-81.7V641.5l231.1,133.4c39.1,22.6,89,9.2,111.6-29.9C946.9,705.9,933.5,656,894.5,633.4z" />
                  </svg>
                </span>
                {displayName(info, room).substring(0, 12)}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  );
}

export function AudienceAvatar({
  room,
  peerId,
  peerState,
  reactions,
  info,
  handRaised,
  onClick,
}) {
  let mqp = useMqParser();
  let {inRoom = null} = peerState || {};
  let reactions_ = reactions[peerId];
  info = info || {id: peerId};
  const colorTheme = room?.color ?? 'default';
  const roomColor = colors(colorTheme, room.customColor);
  const textColor = isDark(roomColor.avatarBg)
    ? roomColor.text.light
    : roomColor.text.dark;

  return (
    inRoom && (
      <div
        className="p-3 m-2 rounded-lg w-36 h-46"
        style={{backgroundColor: roomColor.avatarBg}}
      >
        <div className="flex flex-col items-center">
          <div
            className="w-16 h-16 border-2 rounded-full mx-auto"
            style={{
              borderColor: 'white',
            }}
          >
            <img
              className="w-full h-full rounded-full cursor-pointer"
              alt={displayName(info, room)}
              src={avatarUrl(info, room)}
              onClick={onClick}
            />
          </div>
          <div className={handRaised ? 'relative' : 'hidden'}>
            <div
              className={mqp(
                'absolute w-9 h-9 bottom-2 left-2 rounded-full bg-white text-lg border-2 border-gray-400 flex items-center justify-center'
              )}
            >
              ✋🏽
            </div>
          </div>
        </div>

        <Reactions
          reactions={reactions_}
          className={mqp(
            'absolute text-5xl  pt-4 md:pt-5 human-radius w-20 h-20 md:w-16 md:h-16 border text-center'
          )}
          emojis={room.customEmojis}
          style={{backgroundColor: roomColor.buttons.primary}}
        />

        <div
          className="overflow-hidden whitespace-nowrap text-center mt-2"
          style={{color: textColor}}
        >
          {displayName(info, room)}
        </div>
      </div>
    )
  );
}

function Reactions({reactions, className, emojis}) {
  if (!reactions) return null;

  return (
    <>
      {reactions.map(
        ([r, id]) =>
          emojis.includes(r) && (
            <AnimatedEmoji
              key={id}
              emoji={r}
              className={className}
              style={{
                alignSelf: 'center',
              }}
            />
          )
      )}
    </>
  );
}

function AnimatedEmoji({emoji, ...props}) {
  let [element, setElement] = useState(null);
  useEffect(() => {
    if (element) animateEmoji(element);
  }, [element]);
  return (
    <div ref={setElement} {...props}>
      {emoji}
    </div>
  );
}
