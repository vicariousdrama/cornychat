import React, {useEffect, useState} from 'react';
import {avatarUrl, displayName} from '../lib/avatar';
import {isValidNostr, getNpubFromInfo, getRelationshipPetname} from '../nostr/nostr';
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
  let userNpub = getNpubFromInfo(info);

  let isModerator = moderators?.includes(peerId) || (userNpub != undefined && moderators?.includes(userNpub)) || false;
  let isOwner = owners?.includes(peerId) || (userNpub != undefined && owners?.includes(userNpub)) || false;
  let [peerAdminStatus] = useApiQuery(`/admin/${peerId}`, {fetchOnMount: true});
  let isAdmin = peerAdminStatus?.admin ?? false;

  const colorTheme = room?.color ?? 'default';
  const roomColor = colors(colorTheme, room.customColor);
  const iconColor = isDark(roomColor.background) ? roomColor.icons.light : roomColor.icons.dark;
  const avatarCardBG = !inRoom ? 'rgba(21,21,21,.5)' : (isSpeaking ? roomColor.buttons.primary : roomColor.avatarBg);
  const avatarCardFG = !inRoom ? 'rgba(69,69,69,.75)' : (isDark(avatarCardBG) ? roomColor.text.light : roomColor.text.dark);
  const roleName = (!inRoom ? 'Outside' : (isAdmin ? 'Admin' : (isOwner ? 'Room Owner' : (isModerator ? 'Moderator' : (canSpeak ? 'Speaker' : 'Audience')))));
  const roleSymbol = (!inRoom ? '🚪' : (isAdmin ? '🅰️' : (isOwner ? '👑' : (isModerator ? '🛡️' : (canSpeak ? '🎤' : '👂')))));
  let userDisplayName = info?.name ?? '';
  if (userDisplayName.length == 0) {
    userDisplayName = displayName(info, room);
  }
  if (userNpub != undefined) {
    userDisplayName = getRelationshipPetname(userNpub, userDisplayName);
  }
  const nameSymbols = [
    {"name":"Marie","symbol":"🌹","title":"Valentine"},
    {"npub":"npub1el3mgvtdjpfntdkwq446pmprpdv85v6rs85zh7dq9gvy7tgx37xs2kl27r","symbol":"🌹","title":"Valentine"},
    {"name":"TheNoshole","symbol":"🌹","title":"Puzzles Valentine"},
    {"npub":"npub1ymt2j3n8tesrlr0yhaheem6yyqmmwrr7actslurw6annls6vnrcslapxnz","symbol":"🌹","title":"Puzzles Valentine"},
    {"name":"island","symbol":"🥃","title":"Likes Bourbon"},
    {"npub":"npub1jzuma368395gu523y4vk4d34p0lxgctk436hggn4qcuj93075qgqtn3vm0","symbol":"🥃","title":"Likes Bourbon"},
    {"name":"Sai","symbol":"🎭","title":"Tragic Comedy"},
    {"npub":"npub16tnq9ruem6evwmywhu69xxl0qk802f03vf8hftvkuvw0n7mmz83stxcvw5","symbol":"🎭","title":"Tragic Comedy"},
    {"name":"puzzles","symbol":"🧩","title":"Retired Puzzle Maker"},
    {"npub":"npub12r0yjt8723ey2r035qtklhmdj90f0j6an7xnan8005jl7z5gw80qat9qrx","symbol":"🧩","title":"Retired Puzzle Maker"},
  ];
  let hasNameSymbol = false;
  let userSymbol = null;
  let userSymbolTitle = null;
  for(let nameSymbol of nameSymbols) {
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

  let ghostsEnabled = ((localStorage.getItem('ghostsEnabled') ?? 'false') == 'true');
  if (!inRoom && !ghostsEnabled) {
    return (
      <></>
    );
  }

  return (
    (
      <div
        className="py-0 w-24 mr-2 mb-2 rounded-lg"
        style={{backgroundColor: avatarCardBG, color: avatarCardFG}}
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

          <table><tr><td width="25%" style={{borderWidth: '0px', textAlign:'center'}} >
            <div title={roleName} style={{marginTop:'1px',
            textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
            }}>
              {roleSymbol}
            </div>
            {isValidNostr(info) ? (
            <div title={'Verified Signature by Nostr Pubkey'} style={{marginTop:'-2px'}}>
              <img
                style={{width:'24px',height:'auto',opacity:inRoom?1:.15}}
                alt={'Verified Signature by Nostr Pubkey'}
                src={'/img/symbols/nostr-icon-purple-256x256.png'}
              />
            </div>
            ) : (
            <div title={'Anonymous'} style={{marginTop:'-2px'}}>
              <img
                style={{width:'24px',height:'auto',opacity:inRoom?1:.15}}
                alt={'Anonymous'}
                src={'/img/symbols/guyfawkes.png'}
              />
            </div>
            )}
            {hasNameSymbol && (
            <div title={userSymbolTitle} style={{marginTop:'-2px'}}>
              {userSymbol}
            </div>
            )}
          </td><td width="75%" style={{borderWidth: '0px', textAlign:'center'}}>
            <div className="w-16 h-16 human-radius mx-auto" style={{marginTop: '3px'}}>
              <img
                className="w-full h-full human-radius cursor-pointer"
                alt={userDisplayName}
                src={avatarUrl(info, room)}
                style={{opacity: inRoom ? 1 : .15}}
                onClick={onClick}
              />
            </div>

            {inRoom && canSpeak && micMuted /*(!!micMuted || !canSpeak)*/ && (
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

            {inRoom && (
            <StickyHand 
              {...{roomColor, handType}}
            />
            )}

          </td></tr></table>
        </div>

        <div
          className="overflow-hidden whitespace-nowrap text-s mt-0 w-24"
          style={{color: avatarCardFG, width: '95px',overflow:'hidden',paddingLeft:'2px',paddingRight:'2px'}}
          title={userDisplayName}
        >
          {userDisplayName}
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
            'absolute w-7 h-7 rounded-full bg-white text-xl border-1 border-gray-400 flex items-center justify-center'
          )}
          style={{backgroundColor: roomColor.background, top: '-69px', right: '18px'}}
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
          style={{backgroundColor: `rgb(17,170,17)`, top: '-69px', right: '18px'}}
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
          style={{backgroundColor: `rgb(170,17,17)`, top: '-69px', right: '18px'}}
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
          style={{backgroundColor: `rgb(217,217,217)`, color: 'red', top: '-64px', right: '22px'}}
        >
          {handType.toString().toUpperCase().startsWith('E') ? (
          <img
            src={`/img/emojis/emoji-${handType.toString().toUpperCase()}.png`}
            style={{
              width: '24px',
              height: 'auto',
              border: '0px',
              display: 'inline',
            }}
          />
          ) : (
            <span className={mqp(handType.toString().charCodeAt(0) < 255 ? 'text-xs' : 'text-lg')}
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
