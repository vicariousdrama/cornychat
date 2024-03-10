import React, {useState} from 'react';
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
} from './Svg';
import {useJam} from '../jam-core-react';

export default function Navigation({room, showMyNavMenu, setShowMyNavMenu}) {

  let mqp = useMqParser();
  let talk = () => {
    if (micOn) {
      setProps('micMuted', !micMuted);
    } else {
      retryMic();
    }
  };

  function ReactionsEmojis() {
    return (
      <div>
        {areEmojisSet ? (
          emojis.map(r => (
            <button
              class="human-radius text-2xl select-none"
              key={r}
              onClick={() => {
                sendReaction(r);
              }}
              style={{
                width: '48px',
                height: '48px',
              }}
            >
              {r.toString().toUpperCase().startsWith('E') ? (
                <img
                  src={`/img/emoji-${r.toString().toUpperCase()}.png`}
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
    return (
      <div class="flex">
        <button class="human-radius text-xs select-none"
          style={{width:'48px',height:'48px','color':'yellow',lineHeight: '.95'}}
          onClick={() => {
            handRaised = false;
            handType = '';
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            //setHandType(handType);
            setShowStickies(s => !s);
          }}
        >Lower Hand</button>
        <button class="human-radius text-xl select-none"
          style={{width:'48px',height:'48px',backgroundColor:`rgb(17,17,17)`,color:'yellow'}}
          onClick={() => {
            handRaised = true;
            handType = 'RH';
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            //setHandType(handType);
            setShowStickies(s => !s);
          }}
        >✋</button>
        <button class="human-radius text-xl select-none"
          style={{width:'48px',height:'48px',backgroundColor:`rgb(17,170,17)`,color:'yellow'}}
          onClick={() => {
            handRaised = true;
            handType = 'TU';
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            //setHandType(handType);
            setShowStickies(s => !s);
          }}
        >👍</button>
        <button class="human-radius text-xl select-none"
          style={{width:'48px',height:'48px',backgroundColor:`rgb(170,17,17)`,color:'yellow'}}
          onClick={() => {
            handRaised = true;
            handType = 'TD';
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            //setHandType(handType);
            setShowStickies(s => !s);
          }}
        >👎</button>
        <button class="human-radius text-xl select-none"
          style={{width:'48px',height:'48px',backgroundColor:`rgb(17,17,170)`,color:'yellow'}}
          onClick={() => {
            handRaised = true;
            handType = 'BRB';
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            //setHandType(handType);
            setShowStickies(s => !s);
          }}
        >BRB</button>
        <button class="human-radius text-xl select-none"
          style={{width:'48px',height:'48px',backgroundColor:`rgb(17,17,170)`,color:'yellow'}}
          onClick={() => {
            handRaised = true;
            handType = localStorage.getItem('stickyEmoji1') ?? '☕';
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            //setHandType(handType);
            setShowStickies(s => !s);
          }}
        >{(localStorage.getItem('stickyEmoji1') ?? '☕').toString().toUpperCase().startsWith('E') ? (
          <img
            src={`/img/emoji-${(localStorage.getItem('stickyEmoji1') ?? '☕').toString().toUpperCase()}.png`}
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
        <button class="human-radius text-xl select-none"
          style={{width:'48px',height:'48px',backgroundColor:`rgb(17,17,170)`,color:'yellow'}}
          onClick={() => {
            handRaised = true;
            handType = localStorage.getItem('stickyEmoji2') ?? '🌽';
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            //setHandType(handType);
            setShowStickies(s => !s);
          }}
        >{(localStorage.getItem('stickyEmoji2') ?? '🌽').toString().toUpperCase().startsWith('E') ? (
            <img
              src={`/img/emoji-${(localStorage.getItem('stickyEmoji2') ?? '🌽').toString().toUpperCase()}.png`}
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
      //let byeAmount = Math.floor(localStorage.getItem('byeAmount') ?? '1');
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
          //if (cc != ',' && cc != '') {
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
          //}
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
              sendReaction(bepr);
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

  const [state, {leaveRoom, sendReaction, retryMic, setProps}] = useJam();
  let [myAudio, micMuted, handRaised, handType, iSpeak] = use(state, [
    'myAudio',
    'micMuted',
    'handRaised',
    'handType',
    'iAmSpeaker',
  ]);
  const emojis = room?.customEmojis;
  const areEmojisSet = emojis ? emojis.length : undefined;

  let micOn = myAudio?.active;

  let [showReactions, setShowReactions] = useState(false);
  let [showStickies, setShowStickies] = useState(false);
  //let [handType, setHandType] = useState('');

  const colorTheme = state.room?.color ?? 'default';
  const roomColor = colors(colorTheme, state.room.customColor);

  const iconColor = isDark(roomColor.buttons.primary)
    ? roomColor.icons.light
    : roomColor.icons.dark;
  const iconColorBad = `rgba(240,40,40,.80)`;

  return (
    <div style={{zIndex: '5',position:'absolute',bottom:'72px',width:'100%',backgroundColor:roomColor.avatarBg}}>
      <div class="flex justify-center align-center mx-2">
        {showStickies && (
          <div
            class="text-4xl items-center max-w-md max-h-28 flex flex-wrap overflow-y-none no-scrollbar text-black text-center rounded-lg left-0 bottom-14"
            style={{backgroundColor: roomColor.avatarBg}}
          >
            <StickyStatus />
          </div>
        )}
        {showReactions && (
          <div
            class="text-4xl items-center max-w-md flex flex-wrap overflow-y-scroll text-black text-center rounded-lg left-0 bottom-14"
            style={{backgroundColor: roomColor.avatarBg, maxHeight: '3.25em'}}
          >
            <ReactionsEmojis />
          </div>
        )}
        {showMyNavMenu && (
          <div className="items-center">
            <MyNavMenu close={setShowMyNavMenu} roomColor={roomColor} />
          </div>
        )}
      </div>
      <div class="flex justify-center align-center py-4 px-0">
        {/* setting */}
        <div class="mx-2">
          <button
            class="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
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

        {/* hand raised - original */}
        {false && (
          <>
            {handRaised ? (
              <div class="mx-2">
                <button
                  class="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                  style={{backgroundColor: roomColor.buttons.primary}}
                  onClick={
                    /*iSpeak ? talk :*/ () => setProps('handRaised', !handRaised)
                  }
                >
                     ✋
                </button>
              </div>
            ) : (
              <div class="mx-2">
                <button
                  class="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                  style={{backgroundColor: roomColor.buttons.primary}}
                  onClick={
                    /*iSpeak ? talk :*/ () => setProps('handRaised', !handRaised)
                  }
                >
                  <HandRaised color={iconColor} />
                </button>
              </div>
            )}
          </>
        )}
        {/* hand raised - choices */}
        {true && (
          <>
            {handRaised ? (
              <div class="mx-2">
                <button
                  class="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                  style={{backgroundColor: roomColor.buttons.primary, color:iconColor}}
                  onClick={() => {
                    setShowMyNavMenu(false);
                    setShowReactions(false);
                    setShowStickies(s => !s);
                  }}
                >
                {handType === 'RH' ? (
                  <span class="text-lg" style={{textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'}}>✋</span>
                ):( handType === 'TU' ? (
                  <span class="text-lg" style={{textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'}}>👍</span>
                ):( handType === 'TD' ? ( 
                  <span class="text-lg" style={{textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'}}>👎</span>
                ):( handType.toString().toUpperCase().startsWith('E') ? (
                  <img
                    src={`/img/emoji-${handType.toString().toUpperCase()}.png`}
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
              <div class="mx-2">
                <button
                  class="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
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
          </>
        )}

        {iSpeak ? (
          <div class="mx-2">
            <button
              onClick={
                iSpeak ? talk : () => setProps('handRaised', !handRaised)
              }
              onKeyUp={e => {
                // don't allow clicking mute button with space bar to prevent confusion with push-to-talk w/ space bar
                if (e.key === ' ') e.preventDefault();
              }}
              class="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
              style={{backgroundColor: roomColor.buttons.primary}}
            >
              {iSpeak && (
                <>
                  {micOn && micMuted && (
                    <>
                      <MicOffSvg
                        class="w-5 h-5 mr-2 opacity-80 inline-block"
                        stroke={iconColor}
                      />
                    </>
                  )}
                  {micOn && !micMuted && (
                    <>
                      <MicOnSvg
                        class="w-5 h-5 mr-2 opacity-80 inline-block"
                        stroke={iconColor}
                      />
                    </>
                  )}
                  {!micOn && (
                    <>
                      <MicOffSvg
                        class="w-5 h-5 mr-2 opacity-80 inline-block"
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
          <div class="mx-2 ">
            <button
              class="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
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
        <div class="mx-2">
          <button
            class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center transition-all hover:opacity-80"
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
