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
    const emojis = room.customEmojis;

    return (
      <div>
        {emojis.map(r => (
          <button
            class="m-2 human-radius text-2xl select-none"
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
            <img src={`/img/emoji-${r}.png`} style={{width: '100%', height: 'auto', border: '0px'}} />
            ) : r }
          </button>
        ))}
      </div>
    );
  }

  const [state, {leaveRoom, sendReaction, retryMic, setProps}] = useJam();
  let [myAudio, micMuted, handRaised, iSpeak] = use(state, [
    'myAudio',
    'micMuted',
    'handRaised',
    'iAmSpeaker',
  ]);

  let micOn = myAudio?.active;

  let [showReactions, setShowReactions] = useState(false);

  const colorTheme = state.room?.color ?? 'default';
  const roomColor = colors(colorTheme, state.room.customColor);

  const iconColor = isDark(roomColor.buttons.primary)
    ? roomColor.icons.light
    : roomColor.icons.dark;

  return (
    <div>
      <div class="flex justify-center align-center mx-2">
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
      <div class="flex justify-center py-4 px-10">
        {/* setting */}
        <div class="mx-2">
          <button
            class="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
            style={{backgroundColor: roomColor.buttons.primary}}
            onClick={() => {
              if (showReactions) {
                setShowReactions(false);
              }
              setEditSelf(!editSelf);
            }}
          >
            <ThreeDots color={iconColor} />
          </button>
        </div>

        {/* hand raised */}
        {!iSpeak && (
          <>
            {handRaised ? (
              <div class="mx-2">
                <button
                  class="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                  style={{backgroundColor: roomColor.buttons.primary}}
                  onClick={
                    iSpeak ? talk : () => setProps('handRaised', !handRaised)
                  }
                >
                  <HandRaised color={iconColor} />
                </button>
              </div>
            ) : (
              <div class="mx-2">
                <button
                  class="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                  style={{backgroundColor: roomColor.buttons.primary}}
                  onClick={
                    iSpeak ? talk : () => setProps('handRaised', !handRaised)
                  }
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
                        stroke={iconColor}
                      />
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        ) : null}

        {/* emoji */}
        <div class="mx-2 ">
          <button
            class="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
            style={{backgroundColor: roomColor.buttons.primary}}
            onClick={() => {
              if (editSelf) {
                setEditSelf(false);
              }
              setShowReactions(s => !s);
            }}
          >
            <EmojiFace color={iconColor} />
          </button>
        </div>

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
