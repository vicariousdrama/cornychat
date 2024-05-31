import React, {useState, useEffect} from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import {isDark} from '../lib/theme';
import {useJamState} from '../jam-core-react/JamContext';
import {useJam} from '../jam-core-react';
import {MicOnSvg, Links, Audience, InfoR} from './Svg';
import {Modal, openModal} from './Modal';
import {InvoiceModal} from './Invoice';
import {time4Tip, tipRoom, time4Ad, value4valueAdSkip} from '../lib/v4v';

export default function RoomHeader({
  colors,
  name,
  description,
  logoURI,
  roomLinks,
  showLinks,
  setShowLinks,
  currentSlide,
  audience,
  closed,
  lud16,
  room,
  roomId,
}) {
  let [isRecording, isPodcasting] = useJamState([
    'isSomeoneRecording',
    'isSomeonePodcasting',
  ]);

  const [state, {sendTextChat}] = useJam();
  let {textchats} = state;
  let {npub} = room || {};
  if (npub == undefined || npub == "") npub = `fakenpub-${roomId}`;
  let roomInfo = {identities:[{type:"nostr",id:npub}]};

  // Ensure required lightning address info stored in session
  if(sessionStorage.getItem(npub) == undefined && room.lud16) {
    sessionStorage.setItem(npub, JSON.stringify({lightningAddress: room.lud16}));
  }

  useEffect(() => {
    // Room Tipping
    const roomtipenabled = (localStorage.getItem(`v4vtiproom.enabled`) ?? 'false') == 'true';
    const roomtiptimeout = 3*60*1000;
    const roomtipinterval = 15*60*1000;
    let timeoutRoomTip = undefined;
    let intervalRoomTip = undefined;
    if (roomtipenabled) {
      timeoutRoomTip = setTimeout(() => {
        intervalRoomTip = setInterval(() => {
          if (time4Tip(roomId)) {
            const roomtipamount = Math.floor(localStorage.getItem(`v4vtiproom.amount`) ?? '0');
            let tipped = tipRoom(roomId, room.lud16, roomtipamount);
            if (tipped) {
              let chatText = `*tipped the room owner ⚡${roomtipamount} sats*`;
              (async () => {await sendTextChat(chatText);})(); // send to swarm (including us) as text-chat
            }
          }
        }, roomtipinterval)
      }, roomtiptimeout);
    }

    let adidx = Math.floor(Date.now() / 1000);
    let chatadinterval = 15*60*1000;
    
    const intervalAdSkip = setInterval(() => {
      let textchatAds = localStorage.getItem(`textchat.adsenabled`) ?? true;
      let bufferSize = localStorage.getItem(`textchat.bufferSize`) || 50;
      if(textchatAds) {
        if(time4Ad()) {
          const adskipamount = Math.floor(localStorage.getItem('v4v2skipad.amount') ?? '0');
          if (!value4valueAdSkip('RoomChat')) {
            adidx += 1;
            let adreqdt = Math.floor(Date.now() / 1000);
            let adPeerId = `ad-${adidx}`;
            let textchat = `/chatad:${adidx}:${adreqdt}`;
            if (!textchats) textchats = [];
            let lastline = textchats.slice(-1);
            if ((lastline.length == 0) || (lastline[0].length != 2) || (lastline[0][0] != adPeerId) || (lastline[0][1] != textchat)) {
              textchats.push([adPeerId, textchat]);
              state.textchats = textchats.slice(-1 * bufferSize);
              update(state, 'textchats');
              let n = Math.floor(sessionStorage.getItem(`${roomId}.textchat.unread`) ?? 0) + 1;
              sessionStorage.setItem(`${roomId}.textchat.unread`, n);
            }
          } else {
            let chatText = `*tipped the corny chat dev ⚡${adskipamount} sats*`;
            (async () => {await sendTextChat(chatText);})(); // send to swarm (including us) as text-chat
          }
        }
      }
    }, chatadinterval);

    // This function is called when component unmounts
    return () => {
      if(roomtipenabled) {
        clearInterval(intervalRoomTip);
        clearTimeout(timeoutRoomTip);
      }
      clearInterval(intervalAdSkip);
    }
  }, []);

  const [displayDescription, setDisplayDescription] = useState(false);

  isRecording = isRecording || isPodcasting;

  const textColor = isDark(colors.avatarBg)
    ? colors.text.light
    : colors.text.dark;

  const iconColor = isDark(colors.avatarBg)
    ? colors.icons.light
    : colors.icons.dark;

  function RoomLinks() {
    return (
      <div
        key="roomLinks"
        className="absolute z-10 w-72 mr-3 overflow-y-scroll p-3 rounded-lg"
        style={{backgroundColor: colors.avatarBg, maxHeight: '512px', top: '48px', left: '5%', width: '90%', border: '1px solid white'}}
        onClick={() => setShowLinks(false)}
      >
        {!roomLinks || roomLinks.length === 0 ? (
          <p className="text-xs" style={{color: textColor}}>
            This room has no Links
          </p>
        ) : (
          <p class="flex justify-center" style={{color: textColor}}>ROOM LINKS</p>
        )}
        {roomLinks && roomLinks.length > 0 ? (
          roomLinks.map((links,index) => {
            let linkNumber = 1 + index;
            return (
              <div key={linkNumber} className="mb-2">
                <a href={links[1]} target="_blank">
                  <p className="text-xs" style={{color: textColor}}>
                    {linkNumber}. {links[0]}
                  </p>
                  <p className="text-xs opacity-60" style={{color: textColor}}>
                    {links[1]}
                  </p>
                </a>
              </div>
            );
          })
        ) : null}
      </div>
    );
  }

  function RoomDescription() {
    return (
      <div
        className="markdown z-10"
        style={{backgroundColor: colors.avatarBg, color: textColor, maxHeight: '512px', top: '48px', left: '5%', width: '90%', border: '1px solid white'}}
        onClick={async () => {
          setDisplayDescription(false);
        }}
      >
        {!description || description.length === 0 ? (
          <p className="text-xs" style={{color: textColor}}>
            This room has not set up a description yet.
          </p>
        ) : (
          <p class="flex justify-center" style={{color: textColor}}>ROOM DESCRIPTION</p>
        )}
        {description && description.length > 0 ? (
        <ReactMarkdown
          className="text-sm opacity-70 h-full mt-3"
          plugins={[gfm]}
          transformLinkUri={customUriTransformer}
        >
          {description}
        </ReactMarkdown>
        ):null}
      </div>
    );
  }

  return (
    <div className="flex justify-between my-2 ml-2">

      <div className="flex-grow">
        <div className="flex">
          {(logoURI || lud16) && (
          <div className="flex-none mr-2">
            {logoURI && (
            <img
              alt={'room icon'}
              className="w-12 h-12 rounded p-0 m-0 mt-0"
              src={logoURI}
              style={{objectFit: 'cover', display: 'none', cursor: lud16 ? 'pointer' : 'auto'}}
              onLoad={e => (e.target.style.display = '')}
              onClick={() => {
                if(lud16) {
                  openModal(InvoiceModal, {info: roomInfo, room: room});
                }
              }}
            />
            )}
            {lud16 && (
              <div className="w-12 cursor-pointer rounded bg-yellow-200"
              style={{backgroundColor:'rgba(21,21,21,1)',color:'rgba(221,142,42,.8'}}              
              onClick={() => {
                openModal(InvoiceModal, {info: roomInfo, room: room});
              }}
              title="Send sats to the lightning address set by the owner of this room"
              >⚡ Tip</div>
            )}
          </div>
          )}
          <div className="flex-grow cursor-pointer"
            onClick={async () => {
              setDisplayDescription(!displayDescription);
              setShowLinks(false);
            }}
          >
            {' '}
            <div
              className="flex flex-wrap px-1 py-1 rounded-lg"
              style={{backgroundColor: colors.avatarBg, overflow: 'hidden', maxHeight: '116px'}}
            >
              <p className="text-xl mr-2" style={{color: textColor}}>
                {name} <InfoR />
              </p>
            </div>
            {displayDescription ? <RoomDescription /> : null}
          </div>
        </div>
      </div>

      <div className="flex-none justify-end">
        <div
          className="flex rounded-lg m-auto px-2 py-2 mx-1.5 justify-between cursor-pointer align-center text-sm"
          style={{
            color: isDark(colors.avatarBg)
              ? colors.text.light
              : colors.text.dark,
            backgroundColor: colors.avatarBg,
          }}
          onClick={() => {
            setShowLinks(!showLinks);
            setDisplayDescription(false);
          }}
        >
          <Links color={iconColor} />
          <div className="px-1">
            {!roomLinks || roomLinks.length === 0 ? '0' : roomLinks.length}
          </div>
        </div>
        {showLinks ? <RoomLinks /> : null}
        <div
          className="flex rounded-lg m-auto px-2 py-2 mx-1.5 justify-between align-center text-sm"
          style={{
            color: isDark(colors.buttons.primary)
              ? colors.text.light
              : colors.text.dark,
            backgroundColor: colors.buttons.primary,
          }}
        >
          <Audience
            color={
              isDark(colors.buttons.primary)
                ? colors.icons.light
                : colors.icons.dark
            }
          />
          <div className="px-1">{audience}</div>
        </div>
        {isRecording && (
          <div aria-label="Recording" className="flex items-center w-8 h-6">
            <div>
            <MicOnSvg className="h-5" stroke="#f80000" />
            </div>
            <div style={{color:'#f80000',backgroundColor:'#000000',fontWeight:'bold',fontSize:'1em'}}>
              REC
            </div>
          </div>
        )}
        {closed ? (
          <div className={'text-sm mx-2 bg-red-50 text-red-500 border-yellow-400 border rounded-md'} >
            CLOSED
          </div>
        ) : null}
      </div>

    </div>
  );
}

function customUriTransformer(uri) {
  const schemes = ['bitcoin:', 'lightning:'];
  for (const scheme of schemes) {
    if (uri.startsWith(scheme)) {
      return uri;
    }
  }
  return ReactMarkdown.uriTransformer(uri);
}
