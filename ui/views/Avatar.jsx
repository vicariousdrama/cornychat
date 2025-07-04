import React, {useEffect, useState, useRef} from 'react';
import {avatarUrl, displayName} from '../lib/avatar';
import {
  getNpubStatus,
  isValidNostr,
  getNpubFromInfo,
  getRelationshipPetname,
} from '../nostr/nostr';
import animateEmoji from '../lib/animate-emoji';
import animateEmojiToPeer from '../lib/animate-emojiToPeer';
import {useMqParser} from '../lib/tailwind-mqp';
import {colors, isDark} from '../lib/theme';
import {useApiQuery} from '../jam-core-react';
import {createLinksSanitized} from '../lib/sanitizedText';
import {createEmojiImages} from '../nostr/emojiText';
import {MicMuted, MicStick} from './Svg';

function startPressTimer(timerRef, isLongPress, peerId) {
  isLongPress.current = false;
  timerRef.current = setTimeout(() => {
    isLongPress.current = true;
    let ps = sessionStorage.getItem('peerSelected');
    if (ps && ps.length > 0) {
      document.getElementById('div_' + ps).style.border = '0px';
    }
    sessionStorage.setItem('peerSelected', peerId);
  }, 500);
}
function handleOnMouseDown(timerRef, isLongPress, peerId) {
  startPressTimer(timerRef, isLongPress, peerId);
}
function handleOnMouseUp(timerRef, peerId) {
  clearTimeout(timerRef.current);
}
function handleOnTouchStart(timerRef, isLongPress, peerId) {
  startPressTimer(timerRef, isLongPress, peerId);
}
function handleOnTouchEnd(timerRef, peerId) {
  clearTimeout(timerRef.current);
}

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
  nameSymbols,
}) {
  const timerRef = useRef();
  const isLongPress = useRef();
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
        nameSymbols,
        timerRef,
        isLongPress,
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
  nameSymbols,
}) {
  let speaking = undefined;
  let canSpeak = false;
  const timerRef = useRef();
  const isLongPress = useRef();
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
        nameSymbols,
        timerRef,
        isLongPress,
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
  nameSymbols,
  timerRef,
  isLongPress,
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
  let npubStatus = getNpubStatus(userNpub);
  let npubStatusText = '';
  if (npubStatus == 'anon') npubStatusText = 'User is anonymous';
  if (npubStatus == 'npubharmful')
    npubStatusText =
      'User is a known scammer, hacker, or actively works against nostr';
  if (npubStatus == 'lud16spammy')
    npubStatusText = 'Lightning Custodian creates spam accounts';
  if (npubStatus == 'lud16unfriendly')
    npubStatusText =
      'Lightning Custodian is not friendly, may not perform reciprocal actions';
  if (npubStatus == 'lud16centralized')
    npubStatusText =
      'Lightning Custodian is very large. May require KYC or be at risk of shotgun KYC, fund confiscation, etc';
  if (npubStatus == 'nip05spammy')
    npubStatusText = 'Nostr Address Custodian creates spam accounts';
  if (npubStatus == 'nip05unfriendly')
    npubStatusText =
      'Nostr Address Custodian is not friendly, may not perform reciprocal actions';
  if (npubStatus == 'nip05centralized')
    npubStatusText =
      'Nostr Address Custodian is very large, underdelivers, or does not properly vet accounts';

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

  const bShowAdmin = Math.floor(Date.now() / 1000) % 10 > 5;
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
  const roleName = !inRoom
    ? 'Outside'
    : isAdmin
    ? 'Admin'
    : isOwner
    ? 'Room Owner'
    : isModerator
    ? 'Moderator'
    : canSpeak
    ? 'Speaker'
    : 'Audience';
  const roleSymbol = !inRoom
    ? '🚪'
    : bShowAdmin && isAdmin
    ? '🅰️'
    : isOwner
    ? '👑'
    : isModerator
    ? '🛡️'
    : canSpeak
    ? '🎤'
    : '👂';
  let userDisplayName = info?.name ?? '';
  if (userDisplayName.length == 0) {
    userDisplayName = displayName(info, room);
  }
  let profileTags = [];
  if (userNpub != undefined) {
    userDisplayName = getRelationshipPetname(userNpub, userDisplayName);
    const tagCache = sessionStorage.getItem(`${userNpub}.kind0tags`) || '[]';
    profileTags = JSON.parse(tagCache);
  }
  let hasNameSymbol = false;
  let userSymbol = null;
  let userSymbolTitle = null;
  for (let nameSymbol of nameSymbols) {
    if (nameSymbol.name != undefined) {
      if (userDisplayName.trim().indexOf(nameSymbol.name) > -1) {
        hasNameSymbol = true;
        userSymbol = nameSymbol.symbol;
        userSymbolTitle = nameSymbol.title;
        break;
      }
    }
    if (nameSymbol.npub != undefined) {
      if (userNpub != undefined) {
        if (userNpub.trim().indexOf(nameSymbol.npub) > -1) {
          hasNameSymbol = true;
          userSymbol = nameSymbol.symbol;
          userSymbolTitle = nameSymbol.title;
          break;
        }
      }
    }
  }
  hasNameSymbol = inRoom && hasNameSymbol;
  if (hasNameSymbol && userSymbol && typeof userSymbol != 'string') {
    let uspl = userSymbol.length;
    let uspi = Math.floor(Date.now() / 1000) % uspl;
    userSymbol = userSymbol[uspi];
  }

  let ghostsEnabled =
    (localStorage.getItem('ghostsEnabled') ?? 'false') == 'true';
  if (!inRoom && !ghostsEnabled) {
    return <></>;
  }

  return (
    <div
      id={`div_${peerId}`}
      className="py-0 w-24 mr-2 mb-2 rounded-lg cursor-pointer"
      style={{
        backgroundColor: avatarCardBG,
        color: avatarCardFG,
        border:
          sessionStorage.getItem('peerSelected') == peerId
            ? '2px solid ' + roomColor.buttons.primary
            : '0px',
      }}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLongPress.current) {
          sessionStorage.setItem('peerSelected', '');
          onClick();
          document.getElementById('div_' + peerId).style.border = '0px';
        } else {
          sessionStorage.setItem('peerSelected', peerId);
          document.getElementById('div_' + peerId).style.border =
            '2px solid ' + roomColor.buttons.primary;
        }
      }}
      onMouseDown={e => {
        e.preventDefault();
        handleOnMouseDown(timerRef, isLongPress, peerId);
      }}
      onMouseUp={e => {
        e.preventDefault();
        handleOnMouseUp(timerRef, peerId);
      }}
      onTouchStart={e => {
        e.preventDefault();
        handleOnTouchStart(timerRef, isLongPress, peerId);
      }}
      onTouchEnd={e => {
        e.preventDefault();
        handleOnTouchEnd(timerRef, peerId);
      }}
    >
      <div className="relative flex flex-col items-center">
        {inRoom && (
          <Reactions
            reactions={reactions_}
            className={mqp(
              'absolute text-5xl  pt-4 md:pt-5 human-radius w-20 h-20 md:w-16 md:h-16 text-center'
            )}
            emojis={room.customEmojis}
            style={{backgroundColor: roomColor.buttons.primary, zIndex: '15'}}
          />
        )}

        <table>
          <tbody>
            <tr>
              <td width="25%" style={{borderWidth: '0px', textAlign: 'center'}}>
                <div
                  title={roleName}
                  style={{
                    marginTop: '1px',
                    textShadow:
                      '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                  }}
                >
                  {roleSymbol}
                </div>
                {npubStatus.length > 0 ? (
                  <div title={npubStatusText} style={{marginTop: '-2px'}}>
                    <img
                      style={{
                        width: '22px',
                        height: '22px',
                        opacity: inRoom ? 1 : 0.15,
                      }}
                      alt={npubStatusText}
                      src={`/img/symbols/${npubStatus}.png`}
                    />
                  </div>
                ) : isValidNostr(info) ? (
                  <div
                    title={'Verified Signature by Nostr Pubkey'}
                    style={{marginTop: '-2px'}}
                  >
                    <img
                      style={{
                        width: '24px',
                        height: '24px',
                        opacity: inRoom ? 1 : 0.15,
                      }}
                      alt={'Verified Signature by Nostr Pubkey'}
                      src={'/img/symbols/nostr-icon-purple-256x256.png'}
                    />
                  </div>
                ) : (
                  <div title={'Anonymous'} style={{marginTop: '-2px'}}>
                    <img
                      style={{
                        width: '24px',
                        height: '24px',
                        opacity: inRoom ? 1 : 0.15,
                      }}
                      alt={'Anonymous'}
                      src={'/img/symbols/guyfawkes.png'}
                    />
                  </div>
                )}
                {hasNameSymbol && (
                  <div title={userSymbolTitle} style={{marginTop: '-2px'}}>
                    {userSymbol}
                  </div>
                )}
              </td>
              <td width="75%" style={{borderWidth: '0px', textAlign: 'center'}}>
                <div
                  className="w-16 h-16 human-radius mx-auto"
                  style={{marginTop: '3px'}}
                >
                  <img
                    className="w-full h-full human-radius cursor-pointer"
                    alt={userDisplayName}
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
                        right: '0px',
                      }}
                    >
                      <MicMuted
                        className="w-4 h-4"
                        color={iconColor}
                        strokeWidth="2"
                      />
                    </div>
                  )}
                {inRoom && canSpeak && hasTalkingStick && (
                  <div
                    className="absolute mt-0 rounded-full p-1"
                    style={{
                      backgroundColor: roomColor.background,
                      top: '0px',
                      right: '0px',
                    }}
                  >
                    <MicStick
                      className="w-4 h-4"
                      color={iconColor}
                      strokeWidth="2"
                    />
                  </div>
                )}

                {inRoom && <StickyHand {...{roomColor, handType}} />}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        className="overflow-hidden whitespace-nowrap text-s mt-0 w-24"
        style={{
          color: avatarCardFG,
          width: '95px',
          overflow: 'hidden',
          paddingLeft: '2px',
          paddingRight: '2px',
        }}
        title={userDisplayName}
        dangerouslySetInnerHTML={{
          __html: createLinksSanitized(
            createEmojiImages(userDisplayName, profileTags),
            '1.125rem',
            false
          ),
        }}
      ></div>
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
              'absolute w-7 h-7 rounded-full bg-white text-xl border-1 border-gray-400 flex items-center justify-center'
            )}
            style={{
              backgroundColor: roomColor.background,
              top: '-69px',
              right: '18px',
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
              'absolute w-7 h-7 rounded-full bg-white text-xl border-1 border-gray-400 flex items-center justify-center'
            )}
            style={{
              backgroundColor: `rgb(17,170,17)`,
              top: '-69px',
              right: '18px',
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
              'absolute w-7 h-7 rounded-full bg-white text-xl border-1 border-gray-400 flex items-center justify-center'
            )}
            style={{
              backgroundColor: `rgb(170,17,17)`,
              top: '-69px',
              right: '18px',
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
              'absolute w-7 h-7 rounded-full bg-white border-1 border-gray-400 flex items-center justify-center'
            )}
            style={{
              backgroundColor: `rgb(217,217,217)`,
              color: 'red',
              top: '-64px',
              right: '22px',
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
                    : 'text-lg'
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
