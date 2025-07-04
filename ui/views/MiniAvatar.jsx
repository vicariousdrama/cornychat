import React, {useEffect, useState} from 'react';
import {avatarUrl} from '../lib/avatar';
import {getNpubFromInfo} from '../nostr/nostr';
import animateEmoji from '../lib/animate-emoji';
import animateEmojiToPeer from '../lib/animate-emojiToPeer';
import {useMqParser} from '../lib/tailwind-mqp';
import {colors, isDark} from '../lib/theme';
import {useApiQuery} from '../jam-core-react';
import {MicMuted, MicStick} from './Svg';

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
  iAmAdmin,
}) {
  return (
    <Avatar
      {...{
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
        iAmAdmin,
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
  iAmAdmin,
}) {
  let speaking = undefined;
  let canSpeak = false;
  return (
    <Avatar
      {...{
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
        iAmAdmin,
      }}
    />
  );
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
  iAmAdmin,
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
  let userNpub = getNpubFromInfo(info);

  let isModerator =
    moderators?.includes(peerId) ||
    (userNpub != undefined && moderators?.includes(userNpub)) ||
    false;
  let isOwner =
    owners?.includes(peerId) ||
    (userNpub != undefined && owners?.includes(userNpub)) ||
    false;
  let isAdmin = false;
  if (iAmAdmin) {
    let [peerAdminStatus] = useApiQuery(`/admin/${peerId}`, {
      fetchOnMount: true,
    });
    isAdmin = peerAdminStatus?.admin ?? false;
  }
  let hasTalkingStick = (room?.isTS ?? false) && (room?.tsID ?? '') == peerId;

  const colorTheme = room?.color ?? 'default';
  const roomColor = colors(colorTheme, room.customColor);
  const iconColor = isDark(roomColor.background)
    ? roomColor.icons.light
    : roomColor.icons.dark;
  const avatarCardBG = !inRoom
    ? 'rgba(21,21,21,.5)'
    : isSpeaking
    ? roomColor.buttons.primary
    : roomColor.avatarBg;
  const avatarCardFG = !inRoom
    ? 'rgba(69,69,69,.75)'
    : isDark(avatarCardBG)
    ? roomColor.text.light
    : roomColor.text.dark;

  let ghostsEnabled =
    (localStorage.getItem('ghostsEnabled') ?? 'false') == 'true';
  if (!inRoom && !ghostsEnabled) {
    return <></>;
  }

  return (
    <div
      className="py-0 w-12 mr-1 mb-1 rounded-lg cursor-pointer"
      style={{backgroundColor: avatarCardBG, color: avatarCardFG}}
      onClick={onClick}
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

        <table>
          <tbody>
            <tr>
              <td width="75%" style={{borderWidth: '0px', textAlign: 'center'}}>
                <div
                  className="w-12 h-8 human-radius mx-auto flex"
                  style={{marginTop: '0px'}}
                >
                  <div className="w-4 h-8" />
                  <img
                    className="w-8 h-8 human-radius"
                    src={avatarUrl(info, room)}
                    style={{opacity: inRoom ? 1 : 0.15}}
                  />
                </div>

                {inRoom &&
                  canSpeak &&
                  !(room?.isTS ?? false) &&
                  micMuted /*(!!micMuted || !canSpeak)*/ && (
                    <div
                      className="absolute mt-0 rounded-full p-1"
                      style={{
                        backgroundColor: roomColor.background,
                        top: '0px',
                        left: '0px',
                      }}
                    >
                      <MicMuted
                        className="w-3 h-3"
                        color={iconColor}
                        strokeWidth="1"
                      />
                    </div>
                  )}

                {inRoom && canSpeak && hasTalkingStick && (
                  <div
                    className="absolute mt-0 rounded-full p-1"
                    style={{
                      backgroundColor: roomColor.background,
                      top: '0px',
                      left: '0px',
                    }}
                  >
                    <MicStick
                      className="w-3 h-3"
                      color={iconColor}
                      strokeWidth="1"
                    />
                  </div>
                )}

                {inRoom && <StickyHand {...{roomColor, handType}} />}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StickyHand({handType, roomColor}) {
  let mqp = useMqParser();
  let isHandRH = handType == 'RH';
  let isHandTU = handType == 'TU';
  let isHandTD = handType == 'TD';
  let isHandOther = handType.length > 0 && !isHandRH && !isHandTU && !isHandTD;

  return (
    <>
      {isHandRH && (
        <div className={'relative'}>
          <div
            className={mqp(
              'absolute w-6 h-6 rounded-full bg-white text-xl border-1 border-gray-400 flex items-center justify-center'
            )}
            style={{
              backgroundColor: roomColor.background,
              bottom: '0px',
              left: '0px',
            }}
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
            style={{
              backgroundColor: `rgba(17,170,17,1)`,
              bottom: '0px',
              left: '0px',
            }}
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
            style={{
              backgroundColor: `rgba(170,17,17,1)`,
              bottom: '0px',
              left: '0px',
            }}
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
            style={{
              backgroundColor: `rgb(217,217,217)`,
              color: 'red',
              bottom: '0px',
              left: '0px',
            }}
          >
            {handType.toString().toUpperCase().startsWith('E') ? (
              <img
                src={`/img/emojis/emoji-${handType
                  .toString()
                  .toUpperCase()}.png`}
                style={{
                  width: '24px',
                  height: 'auto',
                  border: '0px',
                  display: 'inline',
                }}
              />
            ) : handType.toString().startsWith('https://') ? (
              <img
                src={handType.toString()}
                style={{
                  width: '24px',
                  height: 'auto',
                  border: '0px',
                  display: 'inline',
                }}
              />
            ) : (
              <span
                className={mqp(
                  handType.toString().charCodeAt(0) < 255
                    ? 'text-xs'
                    : 'text-md'
                )}
                style={{
                  textShadow:
                    handType.toString().charCodeAt(0) > 255
                      ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
                      : '',
                }}
              >
                {handType}
              </span>
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
              emojiO={r}
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

function AnimatedEmoji({emojiO, ...props}) {
  let [element, setElement] = useState(null);
  // 20250629 - emojis can be a string or an object. if an object, the emoji is the reaction property
  let emoji = '';
  let targetPeerId = undefined;
  if (typeof emojiO == 'object') {
    emoji = emojiO.reaction;
    targetPeerId = emojiO.peerId;
  }
  if (typeof emojiO == 'string') {
    emoji = emojiO;
  }
  useEffect(() => {
    if (element && !targetPeerId) animateEmoji(element);
    if (element && targetPeerId) {
      let f = false;
      let ps = targetPeerId.split(',');
      for (let t of ps) {
        let peerElement = document.getElementById('div_' + t);
        if (peerElement) {
          f = true;
          animateEmojiToPeer(element, peerElement);
        }
      }
      if (!f) {
        animateEmoji(element);
      }
    }
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
          src={`/img/emojis/emoji-${emoji.toString().toUpperCase()}.png`}
          style={{
            width: '100%',
            height: 'auto',
            border: '0px',
            zIndex: '15',
          }}
        />
      </div>
    );
  } else if (emoji.startsWith('https://') && emoji.length > 1) {
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
          src={emoji.toString()}
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
        <div
          ref={setElement}
          {...props}
          style={{
            zIndex: '15',
            color: 'yellow',
            textShadow:
              '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
          }}
        >
          {emoji}
        </div>
      );
    } else {
      return (
        <div
          ref={setElement}
          {...props}
          style={{
            zIndex: '15',
            color: 'yellow',
            fontSize: '2em',
            textShadow:
              '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
          }}
        >
          {emoji}
        </div>
      );
    }
  }
}
