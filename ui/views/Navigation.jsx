import React, {useState, useEffect} from 'react';
import {use} from 'use-minimal-state';
import {MyNavMenu} from './MenuNavigation';
import {colors, isDark} from '../lib/theme';
import {useMqParser} from '../lib/tailwind-mqp';
import {
  MicOffSvg,
  MicOnSvg,
  ThreeDots,
  HandRaised,
  EmojiFace,
  Leave,
  ChatBubbles,
} from './Svg';
import {useJam} from '../jam-core-react';
import {dosha256hexrounds} from '../lib/sha256rounds.js';
import {openModal} from './Modal';
import {PassphraseModal} from './PassphraseModal';

export default function Navigation({showMyNavMenu, setShowMyNavMenu, showChat, setShowChat, iAmAdmin}) {
  let mqp = useMqParser();
  const [state, {leaveRoom, sendReaction, retryMic, setProps}] = useJam();
  let [room, roomId, myId] = use(state, ['room','roomId','myId']);
  let [myAudio, micMuted, handRaised, handType, iSpeak, iOwn] = use(state, [
    'myAudio',
    'micMuted',
    'handRaised',
    'handType',
    'iAmSpeaker',
    'iAmOwner', 
  ]);
  
  const [time, setTime] = useState(Date.now());
  const colorTheme = state.room?.color ?? 'default';
  const roomColor = colors(colorTheme, state.room.customColor);
  const iconColor = isDark(roomColor.buttons.primary) ? roomColor.icons.light : roomColor.icons.dark;
  const iconColorBad = `rgba(240,40,40,.80)`;
  let [showUnreadIndicator, setShowUnreadIndicator] = useState(false);
  let [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    const textchatInterval = setInterval(() => {
      setTime(Date.now());    // forces update ?
      let n = Math.floor(sessionStorage.getItem(`${roomId}.textchat.unread`));
      setUnreadCount(n);
      setShowUnreadIndicator(n>0);
    }, 1000);
    let checkcount = 0;
    // This interval periodically checks if the room is protected with a passphrase, and if the user has
    // the current passphrase set. If it differs, then they are prompted for passphrase input or will
    // be ejected after about a minute.
    const passphraseInterval = setInterval(() => {
      let temp_room2 = {...room};
      if(room.passphraseHash != temp_room2.passwordHash) {
      }
      //console.log(`protected: ${room.isProtected} - ${room.passphraseHash}`);
      if (room.isProtected && ((room.passphraseHash ?? '').length > 0)) {
        let roomPassphrase = localStorage.getItem(`${roomId}.passphrase`) ?? (sessionStorage.getItem(`${roomId}.passphrase`) ?? '');
        let roomPassphrasePlain = `${roomId}.${roomPassphrase}`;
        let roomPassphraseHash = '';
        (async () => {
          let r = await dosha256hexrounds(roomPassphrasePlain,21); 
          roomPassphraseHash = r;
          if (room.passphraseHash != roomPassphraseHash && !iAmAdmin) {
            checkcount += 1;
            console.log('room passphrase required. time remaining: ', (60 - ((checkcount-1) * 5)));
            if (checkcount == 13 && !(iAmAdmin || iOwn)) leaveRoom();
            if (checkcount == 1) openModal(PassphraseModal, {roomId: roomId, roomPassphraseHash: room.passphraseHash, roomColor: roomColor, checkcount: checkcount});
          } else {
            // reset check counter
            checkcount = 0;
          }  
        })();
      }
    }, 5000);
    const kickInterval = setInterval(() => {
      let temp_room3 = {...room};
      if(!iAmAdmin && temp_room3.kicked) {
        for (let k of temp_room3.kicked) {
          if (k.until < Date.now()) continue;
          if (k.id == myId) leaveRoom();
        }
      }
    },2000);
    return () => {
      clearInterval(textchatInterval);
      clearInterval(passphraseInterval);
      clearInterval(kickInterval);
    };
  }, [room]);  

  // OnlyZaps don't like reactions or special stickies
  let onlyZapsMode = ((localStorage.getItem('onlyZapsEnabled') ?? 'false') == 'true');
  let reactionsEnabled = !onlyZapsMode;
  let stickiesEnabled = !onlyZapsMode;
  let talk = () => {
    if (micOn) {
      setProps('micMuted', !micMuted);
    } else {
      retryMic();
    }
  };

  let limitReactions = false;
  let reactionQueue = [];
  function queueReaction(r) {
    if (!reactionsEnabled) { r = "⚡" };
    if (!limitReactions) { sendReaction(r); return }
    if (limitReactions && reactionQueue.length < 10) reactionQueue.push(r);
  }
  function sendReactions() {
    let r = reactionQueue.shift();
    if (r) sendReaction(r);
  }
  if (limitReactions) { setInterval(sendReactions, 250); }

  function ReactionsEmojis() {
    return (
      <div>
        {areEmojisSet ? (
          emojis.map(r => (
            <button
              className="human-radius text-2xl select-none"
              key={r}
              onClick={() => {
                queueReaction(r);
              }}
              style={{
                width: '48px',
                height: '48px',
              }}
            >
              {r.toString().toUpperCase().startsWith('E') ? (
                <img
                  src={`/img/emojis/emoji-${r.toString().toUpperCase()}.png`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    border: '0px',
                    display: 'inline',
                  }}
                />
              ) : (
                r
              )}
            </button>
          ))
        ) : (
          <p
            className="text-sm "
            style={{
              color: isDark(roomColor.avatarBg)
                ? roomColor.text.light
                : roomColor.text.dark,
            }}
          >
            Emoji reactions have not been set up.
          </p>
        )}
      </div>
    );
  }

  function StickyStatus() {
    let noSticky = '💩';
    return (
      <div className="flex">
        <button className="human-radius text-xs select-none"
          style={{width:'48px',height:'48px','color':'yellow',lineHeight: '.95'}}
          onClick={() => {
            handRaised = false;
            handType = '';
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            setShowStickies(s => !s);
          }}
        >Lower Hand</button>
        <button className="human-radius text-xl select-none"
          style={{width:'48px',height:'48px',backgroundColor:`rgb(17,17,17)`,color:'yellow'}}
          onClick={() => {
            handRaised = true;
            handType = 'RH';
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            setShowStickies(s => !s);
          }}
        >✋</button>
        <button className="human-radius text-xl select-none"
          style={{width:'48px',height:'48px',backgroundColor:`rgb(17,170,17)`,color:'yellow'}}
          onClick={() => {
            handRaised = true;
            handType = 'TU';
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            setShowStickies(s => !s);
          }}
        >👍</button>
        <button className="human-radius text-xl select-none"
          style={{width:'48px',height:'48px',backgroundColor:`rgb(170,17,17)`,color:'yellow'}}
          onClick={() => {
            handRaised = true;
            handType = 'TD';
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            setShowStickies(s => !s);
          }}
        >👎</button>
        <button className="human-radius text-xl select-none"
          style={{width:'48px',height:'48px',backgroundColor:`rgb(17,17,170)`,color:'yellow'}}
          onClick={() => {
            handRaised = true;
            handType = 'BRB';
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            setShowStickies(s => !s);
          }}
        >BRB</button>
        <button className="human-radius text-xl select-none"
          style={{width:'48px',height:'48px',backgroundColor:`rgb(17,17,170)`,color:'yellow'}}
          onClick={() => {
            handRaised = true;
            handType = stickiesEnabled ? (localStorage.getItem('stickyEmoji1') ?? '☕') : noSticky;
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            setShowStickies(s => !s);
          }}
        >{(localStorage.getItem('stickyEmoji1') ?? '☕').toString().toUpperCase().startsWith('E') ? (
          <img
            src={`/img/emojis/emoji-${(localStorage.getItem('stickyEmoji1') ?? '☕').toString().toUpperCase()}.png`}
            style={{
              width: '100%',
              height: 'auto',
              border: '0px',
              display: 'inline',
            }}
          />
        ) : (
          localStorage.getItem('stickyEmoji1') ?? '☕'
        )}</button>
        <button className="human-radius text-xl select-none"
          style={{width:'48px',height:'48px',backgroundColor:`rgb(17,17,170)`,color:'yellow'}}
          onClick={() => {
            handRaised = true;
            handType = stickiesEnabled ? (localStorage.getItem('stickyEmoji2') ?? '🌽') : noSticky;
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            setShowStickies(s => !s);
          }}
        >{(localStorage.getItem('stickyEmoji2') ?? '🌽').toString().toUpperCase().startsWith('E') ? (
            <img
              src={`/img/emojis/emoji-${(localStorage.getItem('stickyEmoji2') ?? '🌽').toString().toUpperCase()}.png`}
              style={{
                width: '100%',
                height: 'auto',
                border: '0px',
                display: 'inline',
              }}
            />
          ) : (
            localStorage.getItem('stickyEmoji2') ?? '🌽'
        )}</button>
      </div>
    );
  }

  let [leaving, setLeaving] = useState(false);
  const splitEmoji = (string) => [...string];
  //const splitEmoji = (string) => [...new Intl.Segmenter().segment(string)].map(x => x.segment);

  async function byeEmojiExit() {
    if (leaving) {
      setLeaving(false);
      leaving = false;
      leaveRoom();
    } else {
      setLeaving(true);
      leaving = true;
      let maxReactions = 50;
      let ignoredChars = ',';
      let byeEmoji = localStorage.getItem('byeEmoji') ?? 'Goodbye';
      let doexit = true;
      if (byeEmoji.indexOf('-') == 0) {
        doexit = false;
      }
      let byeAmount = 1;
      if (byeAmount > 0) {
        if (byeAmount > 20) {
          byeAmount = 20;
        }
        let byeEmojiParts = [];
        let byeEmojiSplit = (byeEmoji.length > 0) ? splitEmoji(byeEmoji) : [];
        if (!doexit) {
          byeEmojiSplit = (byeEmoji.length > 1) ? splitEmoji(byeEmoji.substr(1)) : [];
        }
        let besl = byeEmojiSplit.length;
        let ce = false;
        let cen = '';
        for (let besi = 0; besi < besl; besi ++) {
          let cc = byeEmojiSplit[besi];
          if (cc == 'E') {
            ce = true;
            cen = '';
          } else {
            if (ce) {
              // custom emoji
              if (isNaN(Number(cc))) {
                // custom emoji ended
                byeEmojiParts.push('E' + cen);
                cen = '';
                ce = false;
                // regular emoji
                if (cc.length > 0 && ignoredChars.indexOf(cc) < 0) {
                  byeEmojiParts.push(cc);
                }
              } else {
                // custom emoji continues
                cen = '' + cen + '' + cc;
              }
            } else {
              // single emoji
              if (cc.length > 0 && ignoredChars.indexOf(cc) < 0) {
                byeEmojiParts.push(cc);
              }
            }
          }
        }
        if (ce) {
          byeEmojiParts.push('E' + cen);
        }
        let bepl = byeEmojiParts.length;
        let bec = 0;
        for (let er = 0; (er < byeAmount); er ++) {
          for (let bepi = 0; (bepi < bepl); bepi ++) {
            let bepr = byeEmojiParts[bepi];
            if (!leaving) {
              break;
            }
            if (bec > maxReactions) {
              break;
            }
            if (bepr.length == 0 || bepr == '') {
              continue;
            }
            bec = bec + 1;
            let st = (bepr.length > 1) ? 100 : 250;
            if (bepr == ' ') {
              st = 500;
            } else {
              queueReaction(bepr);
            }
            await new Promise((resolve,reject) => setTimeout(resolve, st));
          }
        }
        if (bec > 1) {
          await new Promise((resolve,reject) => setTimeout(resolve, 2000));
        }
      }
      if (leaving) {
        setLeaving(false);
        leaving=false;
        if (doexit) {
          leaveRoom();
        }
      }
    }
  }

  const emojis = room?.customEmojis;
  let areEmojisSet = emojis ? true : false;

  let micOn = myAudio?.active;

  let [showReactions, setShowReactions] = useState(false);
  let [showStickies, setShowStickies] = useState(false);

  return (
    <div style={{zIndex: '5',position:'absolute',bottom:'72px',width:'100%',backgroundColor:roomColor.avatarBg}}>
      <div className="flex justify-center align-center mx-2">
        {showStickies && (
          <div
            className="text-4xl items-center max-w-md max-h-28 flex flex-wrap overflow-y-none no-scrollbar text-black text-center rounded-lg left-0 bottom-14"
            style={{backgroundColor: roomColor.avatarBg}}
          >
            <StickyStatus />
          </div>
        )}
        {showReactions && (
          <div
            className="text-4xl items-center max-w-md flex flex-wrap overflow-y-scroll text-black text-center rounded-lg left-0 bottom-14"
            style={{backgroundColor: roomColor.avatarBg, maxHeight: '3.25em'}}
          >
            <ReactionsEmojis />
          </div>
        )}
        {showMyNavMenu && (
          <div className="items-center">
            <MyNavMenu 
              close={setShowMyNavMenu} 
              roomColor={roomColor} 
              iAmAdmin={iAmAdmin}
            />
          </div>
        )}
      </div>
      <div className="flex justify-center align-center py-4 px-0">
        {/* setting */}
        <div className="mx-1">
          <button
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
            style={{backgroundColor: roomColor.buttons.primary}}
            onClick={() => {
              setShowReactions(false);
              setShowStickies(false);
              setShowMyNavMenu(!showMyNavMenu);
            }}
          >
            <ThreeDots color={iconColor} />
          </button>
        </div>

        <div className="mx-1 relative">
          <button
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
            style={{backgroundColor: roomColor.buttons.primary}}
            onClick={() => {
              setShowChat(!showChat);
              if(showChat) {
                sessionStorage.setItem(`${roomId}.textchat.unread`, 0);
                setShowUnreadIndicator(false);
                setUnreadCount(0);
              }
              setShowReactions(false);
              setShowStickies(false);
              setShowMyNavMenu(false);
            }}
          >
            <ChatBubbles color={iconColor} />
            {showUnreadIndicator && (unreadCount > 0) && (
            <div className={'relative'}>
              <div
                className={mqp(
                  'absolute rounded-full bg-white text-xs border-1 border-gray-400 px-1 flex items-center justify-center'
                )}
                style={{backgroundColor: `rgb(217,17,17)`, color: `rgb(255,255,255)`, top: '-28px', right: '-6px'}}
              >{unreadCount}</div>
            </div>
            )}
          </button>
        </div>

        {handRaised ? (
          <div className="mx-1">
            <button
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
              style={{backgroundColor: roomColor.buttons.primary, color:iconColor}}
              onClick={() => {
                setShowMyNavMenu(false);
                setShowReactions(false);
                setShowStickies(s => !s);
              }}
            >
            {handType === 'RH' ? (
              <span className="text-lg" style={{textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'}}>✋</span>
            ):( handType === 'TU' ? (
              <span className="text-lg" style={{textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'}}>👍</span>
            ):( handType === 'TD' ? ( 
              <span className="text-lg" style={{textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'}}>👎</span>
            ):( handType.toString().toUpperCase().startsWith('E') ? (
              <img
                src={`/img/emojis/emoji-${handType.toString().toUpperCase()}.png`}
                style={{
                  width: '100%',
                  height: 'auto',
                  border: '0px',
                  display: 'inline',
                }}
              />
            ):(
              <span className={mqp(handType.toString().charCodeAt(0) < 255 ? 'text-xs' : 'text-lg')}
                style={{textShadow: handType.toString().charCodeAt(0) > 255 ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000': ''}}
              >{handType}</span>
            )
            )))}
            </button>
          </div>
        ) : (
          <div className="mx-1">
            <button
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
              style={{backgroundColor: roomColor.buttons.primary}}
              onClick={() => {
                setShowMyNavMenu(false);
                setShowReactions(false);
                setShowStickies(s => !s);
              }}
            >
              <HandRaised color={iconColor} />
            </button>
          </div>
        )}

        {iSpeak ? (
          <div className="mx-1">
            <button
              onClick={
                iSpeak ? talk : () => setProps('handRaised', !handRaised)
              }
              onKeyUp={e => {
                // don't allow clicking mute button with space bar to prevent confusion with push-to-talk w/ space bar
                if (e.key === ' ') e.preventDefault();
              }}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
              style={{backgroundColor: roomColor.buttons.primary}}
            >
              {iSpeak && (
                <>
                  {micOn && micMuted && (
                    <>
                      <MicOffSvg
                        className="w-5 h-5 mr-2 opacity-80 inline-block"
                        stroke={iconColor}
                      />
                    </>
                  )}
                  {micOn && !micMuted && (
                    <>
                      <MicOnSvg
                        className="w-5 h-5 mr-2 opacity-80 inline-block"
                        stroke={iconColor}
                      />
                    </>
                  )}
                  {!micOn && (
                    <>
                      <MicOffSvg
                        className="w-5 h-5 mr-2 opacity-80 inline-block"
                        stroke={iconColorBad}
                      />
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        ) : null}

        {/* emoji */}
        {areEmojisSet ? (
          <div className="mx-1">
            <button
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
              style={{backgroundColor: roomColor.buttons.primary}}
              onClick={() => {
                setShowMyNavMenu(false);
                setShowStickies(false);
                setShowReactions(s => !s);
              }}
            >
              <EmojiFace color={iconColor} />
            </button>
          </div>
        ) : null}

        {/* Leave room */}
        <div className="mx-1">
          <button
            className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center transition-all hover:opacity-80"
            onClick={async() => {
              byeEmojiExit();
            }}
          >
            <Leave />
          </button>
        </div>
      </div>
    </div>
  );
}
