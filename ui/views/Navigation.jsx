import React, {useState} from 'react';
import {use} from 'use-minimal-state';
import {EditSelf} from './EditRole';
import {colors, isDark} from '../lib/theme';
import {
  MicOffSvg,
  MicOnSvg,
  ThreeDots,
  HandRaised,
  EmojiFace,
  Leave,
} from './Svg';
import {useJam} from '../jam-core-react';

export default function Navigation({room, editSelf, setEditSelf}) {
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
              {r.toString().startsWith('E') ? (
                <img
                  src={`/img/emoji-${r}.png`}
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
      <div>
        <button class="human-radius text-xs select-none"
          style={{width:'48px',height:'48px','color':'yellow'}}
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
            handType = '🚽';
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            //setHandType(handType);
            setShowStickies(s => !s);
          }}
        >🚽</button>
        <button class="human-radius text-xl select-none"
          style={{width:'48px',height:'48px',backgroundColor:`rgb(17,17,170)`,color:'yellow'}}
          onClick={() => {
            handRaised = true;
            handType = '🌽';
            setProps('handRaised', handRaised);
            setProps('handType', handType);
            //setHandType(handType);
            setShowStickies(s => !s);
          }}
        >🌽</button>
      </div>
    );
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
    <div style={{zIndex: '10',position:'absolute',bottom:'96px',width:'100%',backgroundColor:roomColor.avatarBg}}>
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
            class="text-4xl items-center max-w-md max-h-28 flex flex-wrap overflow-y-scroll text-black text-center rounded-lg left-0 bottom-14"
            style={{backgroundColor: roomColor.avatarBg}}
          >
            <ReactionsEmojis />
          </div>
        )}
        {editSelf && (
          <div className="items-center">
            <EditSelf close={setEditSelf} roomColor={roomColor} />
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
              if (showReactions) {
                setShowReactions(false);
              }
              if (showStickies) {
                setShowStickies(false);
              }
              setEditSelf(!editSelf);
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
                    if (editSelf) {
                      setEditSelf(false);
                    }
                    if (showReactions) {
                      setShowReactions(false);
                    }
                    setShowStickies(s => !s);
                  }}
                >
                {handType === 'RH' ? '✋' :( handType === 'TU' ? '👍' :( handType === 'TD' ? '👎' : handType ))}
                </button>
              </div>
            ) : (
              <div class="mx-2">
                <button
                  class="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                  style={{backgroundColor: roomColor.buttons.primary}}
                  onClick={() => {
                    if (editSelf) {
                      setEditSelf(false);
                    }
                    if (showReactions) {
                      setShowReactions(false);
                    }
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
                if (editSelf) {
                  setEditSelf(false);
                }
                if (showStickies) {
                  setShowStickies(false);
                }
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
            onClick={() => leaveRoom()}
          >
            <Leave />
          </button>
        </div>
      </div>
    </div>
  );
}
