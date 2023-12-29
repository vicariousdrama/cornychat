import React, {useEffect, useState} from 'react';
import {avatarUrl, displayName} from '../lib/avatar';
import animateEmoji from '../lib/animate-emoji';
import {useMqParser} from '../lib/tailwind-mqp';
import {colors, isDark} from '../lib/theme';
import {ModeratorIcon} from './Svg';

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
        className="py-2 w-24 ml-2 mb-2 rounded-lg"
        style={{backgroundColor: roomColor.avatarBg}}
      >
        <div className="relative flex flex-col items-center">
          <div
            className="w-16 h-16 border-2 human-radius mx-auto"
            style={{
              borderColor: isSpeaking ? roomColor.buttons.primary : 'white',
            }}
          >
            <img
              className="w-full h-full human-radius cursor-pointer"
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
            'absolute text-5xl pt-4 md:pt-5 human-radius w-20 h-20 md:w-16 md:h-16 text-center'
          )}
          emojis={room.customEmojis}
          style={{backgroundColor: roomColor.buttons.primary}}
        />

        <div class="w-full text-center">
          <div className="flex justify-center items-center">
            <div>
              <span
                className={mqp('text-xs whitespace-nowrap font-medium')}
                style={{color: textColor}}
              >
                {isModerator ? (
                  <ModeratorIcon color={roomColor.buttons.primary} />
                ) : null}

                {'  '}
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
        className="py-2 w-24 ml-2 my-2 rounded-lg"
        style={{backgroundColor: roomColor.avatarBg}}
      >
        <div className="flex flex-col items-center">
          <div
            className="w-16 h-16 border-2 human-radius mx-auto"
            style={{
              borderColor: 'white',
            }}
          >
            <img
              className="w-full h-full human-radius cursor-pointer"
              alt={displayName(info, room)}
              src={avatarUrl(info, room)}
              onClick={onClick}
            />
          </div>
          <div className={handRaised ? 'relative' : 'hidden'}>
            <div
              className={mqp(
                'absolute w-7 h-7 bottom-2 left-2 mb-1 rounded-full bg-white text-sm border-2 border-gray-400 flex items-center justify-center'
              )}
            >
              ✋🏽
            </div>
          </div>
        </div>

        <Reactions
          reactions={reactions_}
          className={mqp(
            'absolute text-5xl  pt-4 md:pt-5 human-radius w-20 h-20 md:w-16 md:h-16 text-center'
          )}
          emojis={room.customEmojis}
          style={{backgroundColor: roomColor.buttons.primary}}
        />

        <div
          className="overflow-hidden whitespace-nowrap text-center text-xs mt-2"
          style={{color: textColor}}
        >
          {displayName(info, room).substring(0, 12)}
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
  if (emoji.startsWith('E')) {
    return (
      <div
        ref={setElement}
        style={{
          width: '96px',
          height: '96px',
          border: '0px',
        }}
        {...props}
      >
        <img
          src={`/img/emoji-${emoji}.png`}
          style={{
            width: '100%',
            height: 'auto',
            border: '0px',
          }}
        />
      </div>
    );
  } else {
    return (
      <div ref={setElement} {...props}>
        {emoji}
      </div>
    );
  }
}
