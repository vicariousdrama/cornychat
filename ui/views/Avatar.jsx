import React, {useEffect, useState} from 'react';
import {avatarUrl, displayName} from '../lib/avatar';
import animateEmoji from '../lib/animate-emoji';
import {useMqParser} from '../lib/tailwind-mqp';
import {colors, isDark} from '../lib/theme';
import {ModeratorIcon} from './Svg';
import {InvoiceModal} from './Invoice';
import {openModal} from './Modal';
import {useApiQuery} from '../jam-core-react';

export function StageAvatar({
  room,
  speaking,
  canSpeak,
  moderators,
  peerId,
  peerState,
  reactions,
  info,
  handRaised,
  handType,
  onClick,
}) {
  let mqp = useMqParser();
  let {micMuted, inRoom = null} = peerState || {};
  let reactions_ = reactions[peerId];
  info = info || {id: peerId};
  let isSpeaking = speaking.has(peerId);
  let isModerator = moderators.includes(peerId);
  let [peerAdminStatus] = useApiQuery(`/admin/${peerId}`, {fetchOnMount: true});
  let isAdmin = peerAdminStatus?.admin ?? false;
  const colorTheme = room?.color ?? 'default';
  const roomColor = colors(colorTheme, room.customColor);
  let isHandRH = (handType == 'RH');
  let isHandTU = (handType == 'TU');
  let isHandTD = (handType == 'TD');
  let isHandOther = (handRaised && !isHandRH && !isHandTU && !isHandTD);
  if (handRaised && !isHandTU && !isHandTD && !isHandOther) {
    isHandRH = true;
  }


  const textColor = isDark(roomColor.avatarBg)
    ? roomColor.text.light
    : roomColor.text.dark;

  const iconColor = isDark(roomColor.background)
    ? roomColor.icons.light
    : roomColor.icons.dark;

  const dimSatSymbolColor = `rgba(80,80,80,.15)`;

  const hasNostrIdentity = checkNostrIdentity(info.identities);

  function checkNostrIdentity(identities) {
    const hasNostrIdentity = identities?.some(
      identity => identity.type === 'nostr'
    );

    return hasNostrIdentity;
  }

  const adminSymbol = '🐲';
  const ownerSymbol = '♔';
  const moderatorSymbol = '👁️';

  return (
    inRoom && (
      <div
        className="py-0 w-24 mr-2 mb-2 rounded-lg"
        style={{
              backgroundColor: isSpeaking ? roomColor.buttons.primary : roomColor.avatarBg,
        }}
      >
        <div className="relative flex flex-col items-center">

        <Reactions
          reactions={reactions_}
          className={mqp(
            'absolute text-5xl pt-0 md:pt-0 human-radius w-20 h-20 md:w-16 md:h-16 text-center'
          )}
          emojis={room.customEmojis}
          style={{backgroundColor: roomColor.buttons.primary, zIndex: '15'}}
        />


          <table><tr><td width="25%">
            {hasNostrIdentity ? (
              <div
                className="flex justify-center cursor-pointer"
                onClick={() => {
                  close();
                  openModal(InvoiceModal, {info: info, room: room});
                }}
              >
                <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center">
                  <span>⚡</span>
                </div>
              </div>
            ) : (
              <div
                className="flex justify-center"
              >
                <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center">
                  <span style={{color:dimSatSymbolColor}}>⚡</span>
                </div>
              </div>

            )}

            {isAdmin ? (
              <div title="Admin">
              {adminSymbol}
              </div>
            ) : null }
            {isModerator && !isAdmin ? (
              <div style={{color:roomColor.buttons.primary}} title="Moderator">
              {moderatorSymbol}
              </div>
            ) : null}

          </td><td width="75%">
          <div
            className="w-16 h-16 border-2 human-radius mx-auto"
            style={{
              borderColor: isSpeaking ? roomColor.buttons.primary : `rgba(255,255,255,0)`,
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
              className="absolute mt-0 rounded-full p-1"
              style={{backgroundColor: roomColor.background, top: '0px', right: '0px'}}
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

          {handRaised && isHandRH && (
          <div className={isHandRH ? 'relative' : 'hidden'}>
            <div
              className={mqp(
                'absolute w-6 h-6 rounded-full bg-white text-xl border-2 border-gray-400 flex items-center justify-center'
              )}
              style={{backgroundColor: roomColor.background, top: '-69px', right: '18px'}}
            >
              ✋
            </div>
          </div>
          )}
          {handRaised && isHandTU && (
          <div className={isHandTU ? 'relative' : 'hidden'}>
            <div
              className={mqp(
                'absolute w-6 h-6 rounded-full bg-white text-xl border-2 border-gray-400 flex items-center justify-center'
              )}
              style={{backgroundColor: `rgb(17,170,17)`, top: '-69px', right: '18px'}}
            >
              👍
            </div>
          </div>
          )}
          {handRaised && isHandTD && (
          <div className={isHandTD ? 'relative' : 'hidden'}>
            <div
              className={mqp(
                'absolute w-6 h-6 rounded-full bg-white text-xl border-2 border-gray-400 flex items-center justify-center'
              )}
              style={{backgroundColor: `rgb(170,17,17)`, top: '-69px', right: '18px'}}
            >
              👎
            </div>
          </div>
          )}
          {handRaised && isHandOther && (
          <div className={isHandOther ? 'relative' : 'hidden'}>
            <div
              className={mqp(
                'absolute w-6 h-6 rounded-full bg-white text-xs border-2 border-gray-400 flex items-center justify-center'
              )}
              style={{backgroundColor: `rgb(17,17,170)`, color: 'yellow', top: '-69px', right: '18px'}}
            >
              {handType}
            </div>
          </div>
          )}

          </td></tr></table>
        </div>


        <div
          className="overflow-hidden whitespace-nowrap text-s mt-0 w-24"
          style={{color: textColor, width: '95px',overflow:'hidden'}}
        >
          {displayName(info, room)}
        </div>


      </div>
    )
  );
}

export function AudienceAvatar({
  room,
  peerId,
  peerState,
  moderators,
  reactions,
  info,
  handRaised,
  handType,
  onClick,
}) {
  let mqp = useMqParser();
  let {inRoom = null} = peerState || {};
  let reactions_ = reactions[peerId];
  info = info || {id: peerId};
  let isModerator = moderators.includes(peerId);
  let [peerAdminStatus] = useApiQuery(`/admin/${peerId}`, {fetchOnMount: true});
  let isAdmin = peerAdminStatus?.admin ?? false;
  let isHandRH = handRaised && (handType == 'RH');
  let isHandTU = handRaised && (handType == 'TU');
  let isHandTD = handRaised && (handType == 'TD');
  let isHandOther = (handRaised && !isHandRH && !isHandTU && !isHandTD);
  if (handRaised && !isHandTU && !isHandTD && !isHandOther) {
    isHandRH = true;
  }
  const colorTheme = room?.color ?? 'default';
  const roomColor = colors(colorTheme, room.customColor);
  const textColor = isDark(roomColor.avatarBg)
    ? roomColor.text.light
    : roomColor.text.dark;
  const dimSatSymbolColor = `rgba(80,80,80,.15)`;

  const hasNostrIdentity = checkNostrIdentity(info.identities);

  const adminSymbol = '🐲';
  const moderatorSymbol = '👁️';

  function checkNostrIdentity(identities) {
    const hasNostrIdentity = identities?.some(
      identity => identity.type === 'nostr'
    );

    return hasNostrIdentity;
  }

  return (
    inRoom && (
      <div
        className="py-0 w-24 mr-2 mb-2 rounded-lg"
        style={{backgroundColor: roomColor.avatarBg}}
      >
        <div className="flex flex-col items-center">

        <Reactions
          reactions={reactions_}
          className={mqp(
            'absolute text-5xl  pt-4 md:pt-5 human-radius w-20 h-20 md:w-16 md:h-16 text-center'
          )}
          emojis={room.customEmojis}
          style={{backgroundColor: roomColor.buttons.primary, zIndex: '15'}}
        />

          <table><tr><td width="25%">
            {hasNostrIdentity ? (
              <div
                className="flex justify-center cursor-pointer"
                onClick={() => {
                  close();
                  openModal(InvoiceModal, {info: info, room: room});
                }}
              >
                <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center">
                  <span>⚡</span>
                </div>
              </div>
            ) : (
              <div
                className="flex justify-center"
              >
                <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center">
                  <span style={{color:dimSatSymbolColor}}>⚡</span>
                </div>
              </div>

            )}

            {isAdmin ? (
              <div title="Admin">
              {adminSymbol}
              </div>
            ) : null }
            {isModerator && !isAdmin ? (
              <div style={{color:roomColor.buttons.primary}} title="Moderator">
              {moderatorSymbol}
              </div>
            ) : null}


          </td><td width="75%">

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

          {handRaised && isHandRH && (
          <div className={isHandRH ? 'relative' : 'hidden'}>
            <div
              className={mqp(
                'absolute w-6 h-6 rounded-full bg-white text-xl border-2 border-gray-400 flex items-center justify-center'
              )}
              style={{backgroundColor: roomColor.background, top: '-69px', right: '18px'}}
            >
              ✋
            </div>
          </div>
          )}
          {handRaised && isHandTU && (
          <div className={isHandTU ? 'relative' : 'hidden'}>
            <div
              className={mqp(
                'absolute w-6 h-6 rounded-full bg-white text-xl border-2 border-gray-400 flex items-center justify-center'
              )}
              style={{backgroundColor: `rgb(17,170,17)`, top: '-69px', right: '18px'}}
            >
              👍
            </div>
          </div>
          )}
          {handRaised && isHandTD && (
          <div className={isHandTD ? 'relative' : 'hidden'}>
            <div
              className={mqp(
                'absolute w-6 h-6 rounded-full bg-white text-xl border-2 border-gray-400 flex items-center justify-center'
              )}
              style={{backgroundColor: `rgb(170,17,17)`, top: '-69px', right: '18px'}}
            >
              👎
            </div>
          </div>
          )}
          {handRaised && isHandOther && (
          <div className={isHandOther ? 'relative' : 'hidden'}>
            <div
              className={mqp(
                'absolute w-6 h-6 rounded-full bg-white text-xs border-2 border-gray-400 flex items-center justify-center'
              )}
              style={{backgroundColor: `rgb(17,17,170)`, color: 'yellow', top: '-69px', right: '18px'}}
            >
              {handType}
            </div>
          </div>
          )}

          </td></tr></table>
        </div>

        <div
          className="overflow-hidden whitespace-nowrap text-s mt-0 w-24"
          style={{color: textColor, width: '95px',overflow:'hidden'}}
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
  if (emoji.startsWith('E')) {
    return (
      <div
        ref={setElement}
        style={{
          width: '96px',
          height: '96px',
          border: '0px',
          zIndex: '15',
        }}
        {...props}
      >
        <img
          src={`/img/emoji-${emoji}.png`}
          style={{
            width: '100%',
            height: 'auto',
            border: '0px',
            zIndex: '15',
          }}
        />
      </div>
    );
  } else {
    return (
      <div ref={setElement} {...props} style={{zIndex: '15'}}>
        {emoji}
      </div>
    );
  }
}
