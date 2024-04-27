import React, {useEffect, useState} from 'react';
import {avatarUrl, displayName} from '../lib/avatar';
import {isValidNostr} from '../nostr/nostr';
import animateEmoji from '../lib/animate-emoji';
import {useMqParser} from '../lib/tailwind-mqp';
import {colors, isDark} from '../lib/theme';
import {useApiQuery} from '../jam-core-react';

export function StageAvatar({
  room,
  speaking,
  canSpeak,
  moderators,
  owners,
  peerId,
  peerState,
  reactions,
  info,
  onClick,
}) {
  return (
    <Avatar {...{
      room,
      moderators,
      owners,
      speaking,
      canSpeak,    
      peerId,
      peerState,
      reactions,
      info,
      onClick,    
    }}
    />
  );
}

export function AudienceAvatar({
  room,
  moderators,
  owners,
  peerId,
  peerState,
  reactions,
  info,
  onClick,
}) {
  let speaking = undefined;
  let canSpeak = false;
  return (
    <Avatar {...{
      room,
      moderators,
      owners,
      speaking,
      canSpeak,    
      peerId,
      peerState,
      reactions,
      info,
      onClick,
    }}
    />
  );
}

function userIdentity(info) {
  const hasIdentity = info?.hasOwnProperty('identities');
//    console.log('in Profile.userIdentity',info?.name, info?.identities);
  if (hasIdentity && (info?.identities?.length > 0)) {
    return info.identities[0]?.id;
  }

  return undefined;
}

function Avatar({
  room,
  moderators,
  owners,
  speaking,
  canSpeak,
  peerId,
  peerState,
  reactions,
  info,
  onClick,
}) {
  let isSpeaking = false;
  if (speaking) {
    if (speaking.has(peerId)) {
      isSpeaking = true;
    }
  }
  let {micMuted, inRoom = null, handType} = peerState || {};

  let mqp = useMqParser();
  let reactions_ = reactions[peerId];
  info = info || {id: peerId};

  let isModerator = moderators?.includes(peerId) || false;
  let isOwner = owners?.includes(peerId) || false;
  let [peerAdminStatus] = useApiQuery(`/admin/${peerId}`, {fetchOnMount: true});
  let isAdmin = peerAdminStatus?.admin ?? false;

  const colorTheme = room?.color ?? 'default';
  const roomColor = colors(colorTheme, room.customColor);
  const iconColor = isDark(roomColor.background) ? roomColor.icons.light : roomColor.icons.dark;
  const avatarCardBG = !inRoom ? 'rgba(21,21,21,.5)' : (isSpeaking ? roomColor.buttons.primary : roomColor.avatarBg);
  const avatarCardFG = !inRoom ? 'rgba(69,69,69,.75)' : (isDark(avatarCardBG) ? roomColor.text.light : roomColor.text.dark);
  let userNpub = userIdentity(info);

  let ghostsEnabled = ((localStorage.getItem('ghostsEnabled') ?? 'false') == 'true');
  if (!inRoom && !ghostsEnabled) {
    return (
      <></>
    );
  }

  return (
    (
      <div
        className="py-0 w-12 mr-1 mb-1 rounded-lg"
        style={{backgroundColor: avatarCardBG, color: avatarCardFG}}
      >
        <div className="relative flex flex-col items-center">

          {inRoom && (
          <Reactions
            reactions={reactions_}
            className={mqp(
              'absolute text-md pt-4 md:pt-5 human-radius w-6 h-6 md:w-6 md:h-6 text-center'
            )}
            emojis={room.customEmojis}
            style={{backgroundColor: roomColor.buttons.primary, zIndex: '15'}}
          />
          )}

          <table><tr><td width="75%" style={{borderWidth: '0px', textAlign:'center'}}>
            <div className="w-12 h-8 human-radius mx-auto flex" style={{marginTop: '0px'}}>
              <div className="w-4 h-8" />
              <img
                className="w-8 h-8 human-radius cursor-pointer"
                src={avatarUrl(info, room)}
                style={{opacity: inRoom ? 1 : .15}}
                onClick={onClick}
              />
            </div>

            {inRoom && canSpeak && micMuted /*(!!micMuted || !canSpeak)*/ && (
            <div
              className="absolute mt-0 rounded-full p-1"
              style={{backgroundColor: roomColor.background, top: '0px', left: '0px'}}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-3 h-3"
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
                  stroke-width="1"
                />
              </svg>
            </div>
            )}

            {inRoom && (
            <StickyHand 
              {...{roomColor, handType}}
            />
            )}
          </td></tr></table>
        </div>

      </div>
    )
  );
}

function StickyHand({
  handType,
  roomColor,
}) {
  let mqp = useMqParser();
  let isHandRH = (handType == 'RH');
  let isHandTU = (handType == 'TU');
  let isHandTD = (handType == 'TD');
  let isHandOther = (handType.length > 0 && !isHandRH && !isHandTU && !isHandTD);

  return (
    <>
      {isHandRH && (
      <div className={'relative'}>
        <div
          className={mqp(
            'absolute w-6 h-6 rounded-full bg-white text-xl border-1 border-gray-400 flex items-center justify-center'
          )}
          style={{backgroundColor: roomColor.background, bottom: '0px', left: '0px'}}
        >
          ✋
        </div>
      </div>
      )}
      {isHandTU && (
      <div className={'relative'}>
        <div
          className={mqp(
            'absolute w-6 h-6 rounded-full bg-white text-xl border-1 border-gray-400 flex items-center justify-center'
          )}
          style={{backgroundColor: `rgba(17,170,17,1)`, bottom: '0px', left: '0px'}}
        >
          👍
        </div>
      </div>
      )}
      {isHandTD && (
      <div className={'relative'}>
        <div
          className={mqp(
            'absolute w-6 h-6 rounded-full bg-white text-xl border-1 border-gray-400 flex items-center justify-center'
          )}
          style={{backgroundColor: `rgba(170,17,17,1)`, bottom: '0px', left: '0px'}}
        >
          👎
        </div>
      </div>
      )}
      {isHandOther && (
      <div className={'relative'}>
        <div
          className={mqp(
            'absolute w-6 h-6 rounded-full bg-white border-1 border-gray-400 flex items-center justify-center'
          )}
          style={{backgroundColor: `rgb(217,217,217)`, color: 'red', bottom: '0px', left: '0px'}}
        >
          {handType.toString().toUpperCase().startsWith('E') ? (
          <img
            src={`/img/emoji-${handType.toString().toUpperCase()}.png`}
            style={{
              width: '24px',
              height: 'auto',
              border: '0px',
              display: 'inline',
            }}
          />
          ) : (
            <span className={mqp(handType.toString().charCodeAt(0) < 255 ? 'text-xs' : 'text-md')}
              style={{textShadow: handType.toString().charCodeAt(0) > 255 ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000': ''}}
            >{handType}</span>
          )}
        </div>
      </div>
      )}
    </>
  );
}

function Reactions({reactions, className, emojis}) {
  if (!reactions) return null;
  return (
    <>
      {reactions.map(
        ([r, id]) =>
          (true || emojis.includes(r)) && (
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
  if (emoji.toUpperCase().startsWith('E') && emoji.length > 1) {
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
          src={`/img/emoji-${emoji.toString().toUpperCase()}.png`}
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
    if (emoji.charCodeAt(0) > 255) {
      return (
        <div ref={setElement} {...props} style={{
          zIndex: '15',
          color: 'yellow',
          textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
        }} >
          {emoji}
        </div>
      );
    } else {
      return (
        <div ref={setElement} {...props} style={{
          zIndex: '15',
          color: 'yellow',
          fontSize: '2em',
          textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000'
        }} >
          {emoji}
        </div>
      );
    }
  }
}
