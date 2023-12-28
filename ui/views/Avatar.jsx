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
        className="p-0 m-0 ml-2 mb-2 rounded-lg"
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
            'absolute text-5xl  pt-4 md:pt-5 human-radius w-20 h-20 md:w-16 md:h-16 text-center'
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
                      ? 'flex-none inline-block leading-3 text-white w-4 h-4 rounded-full -ml-3'
                      : 'hidden'
                  }
                  style={{
                    color: roomColor.buttons.primary,
                  }}
                >
                  <svg
                    className="inline-block w-5 h-5"
                    style={{margin: '-3px 0 0 0'}}
                    x="0px"
                    y="0px"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    viewBox="0 0 100 100"
                    enableBackground="new 0 0 100 100"
                    xml:space="preserve">
<path d="M31.375,40.219l1.249,1.563l-5.475,4.379C27.676,48.357,29.645,50,32,50c2.527,0,4.622-1.885,4.954-4.32l5.849-2.508
       c2.944,2.451,7.337,2.297,10.097-0.465c2.924-2.924,2.924-7.682,0-10.606l0.707-0.707c1.605,1.605,2.49,3.739,2.49,6.011
       c0,1.328-0.311,2.607-0.884,3.764l0,0c-0.196,0.396-0.425,0.775-0.681,1.14c-0.024,0.034-0.05,0.066-0.074,0.1
       c-0.256,0.353-0.536,0.692-0.851,1.007c-0.276,0.276-0.57,0.523-0.873,0.752c-0.07,0.053-0.143,0.101-0.213,0.15
       c-0.252,0.179-0.51,0.344-0.775,0.492c-1.508,0.844-3.216,1.203-4.894,1.057C45.944,52.158,40.545,57,34,57l2,22h28
       c0-9.957,2.698-18.563,5.535-25.822C64.908,57.412,58.751,60,52,60v-1c13.785,0,25-11.215,25-25S65.785,9,52,9h-1v10h-1v-4h-7
       c-3.866,0-7,3.134-7,7c0,1.831-16,7.76-16,16c0,3.38,2.395,6.199,5.58,6.855L31.375,40.219z M45.485,20.143l1.029,1.715l-5,3
       l-1.029-1.715L45.485,20.143z M23.445,38.168l3-2l1.109,1.664l-3,2L23.445,38.168z M69,80c1.1,0,2,0.9,2,2s-0.9,2-2,2H31
       c-1.1,0-2-0.9-2-2s0.9-2,2-2H69z M76,89c0,2.2-1.8,4-4,4H28c-2.2,0-4-1.8-4-4s1.8-4,4-4h44C74.2,85,76,86.8,76,89z"/>
</svg>
                  </span>{'  '}                    
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
        className="p-0 m-0 ml-2 mb-2 rounded-lg"
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
                'absolute w-9 h-9 top-0 right-0 md:top-0 md:right-0 rounded-full bg-white text-lg border-2 border-gray-400 flex items-center justify-center'
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
  if(emoji.startsWith('E')) {
    return (
      <div ref={setElement} style={{
        width: '96px',
        height: '96px',
        border: '0px',
      }} {...props}>
        <img
          src={`/img/emoji-${emoji}.png`}
          style={{
            width: '100%',
            height: 'auto',
            border: '0px',
        }} />
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
