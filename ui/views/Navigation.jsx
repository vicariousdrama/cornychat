import React, {useState} from 'react';
import {use} from 'use-minimal-state';
import EditRole, {EditSelf} from './EditRole';
import {useWidth} from '../lib/tailwind-mqp';
import {colors, isDark} from '../lib/theme';
import {MicOffSvg, MicOnSvg} from './Svg';
import {useJam} from '../jam-core-react';

const reactionEmojis = [
  '❤️',
  '💯',
  '🫢',
  '🫣',
  '🫡',
  '😳',
  '🤔',
  '🥹',
  '😅',
  '😂',
  '🤞',
  '🫶',
  '🤟',
  '⚡️',
  '🤙',
  '🫵',
  '👌',
  '🔥',
];

export default function Navigation({
  room,
  editRole,
  setEditRole,
  editSelf,
  setEditSelf,
}) {
  const [state, {leaveRoom, sendReaction, retryMic, setProps}] = useJam();
  let [myAudio, micMuted, handRaised, iSpeak] = use(state, [
    'myAudio',
    'micMuted',
    'handRaised',
    'iAmSpeaker',
  ]);

  let micOn = myAudio?.active;

  let [showReactions, setShowReactions] = useState(false);

  let {speakers, moderators, stageOnly} = room ?? {};

  const colorTheme = state.room?.color ?? 'default';
  const roomColor = colors(colorTheme);

  let talk = () => {
    if (micOn) {
      setProps('micMuted', !micMuted);
    } else {
      retryMic();
    }
  };

  const iconColor = isDark(roomColor.buttons.primary)
    ? roomColor.icons.light
    : roomColor.icons.dark;

  return (
    <div>
      <div className="flex justify-center align-center mx-2">
        {showReactions && (
          <div
            className="text-4xl items-center max-w-md max-h-28 flex flex-wrap overflow-y-scroll text-black text-center rounded-lg left-0 bottom-14"
            style={{backgroundColor: roomColor.avatarBg}}
          >
            {reactionEmojis.map(r => (
              <button
                className="m-2 human-radius select-none"
                key={r}
                onClick={() => {
                  sendReaction(r);
                }}
              >
                {r}
              </button>
            ))}
          </div>
        )}
        {editSelf && (
          <div>
            <EditSelf close={setEditSelf} roomColor={roomColor} />
          </div>
        )}
        {editRole ? (
          <EditRole
            peerId={editRole}
            speakers={speakers}
            moderators={moderators}
            stageOnly={stageOnly}
            roomColor={roomColor}
            onCancel={() => setEditRole(null)}
          />
        ) : null}
      </div>
      <div className="flex justify-center py-4 px-10">
        <div className="mx-2">
          <button
            class="w-12 h-12 rounded-full flex items-center justify-center focus:outline-none"
            style={{backgroundColor: roomColor.buttons.primary}}
            onClick={() => {
              if (showReactions) {
                setShowReactions(false);
              }
              setEditSelf(!editSelf);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke={iconColor}
                d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
          </button>
        </div>

        {!iSpeak && (
          <>
            {handRaised ? (
              <div className="mx-2">
                <button
                  class="w-12 h-12 rounded-full flex items-center justify-center focus:outline-none"
                  style={{backgroundColor: roomColor.buttons.primary}}
                  onClick={
                    iSpeak ? talk : () => setProps('handRaised', !handRaised)
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke={iconColor}
                      d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 013.15 0V15M6.9 7.575a1.575 1.575 0 10-3.15 0v8.175a6.75 6.75 0 006.75 6.75h2.018a5.25 5.25 0 003.712-1.538l1.732-1.732a5.25 5.25 0 001.538-3.712l.003-2.024a.668.668 0 01.198-.471 1.575 1.575 0 10-2.228-2.228 3.818 3.818 0 00-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0116.35 15m.002 0h-.002"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="mx-2">
                <button
                  class="w-12 h-12 rounded-full flex items-center justify-center focus:outline-none"
                  style={{backgroundColor: roomColor.buttons.primary}}
                  onClick={
                    iSpeak ? talk : () => setProps('handRaised', !handRaised)
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke={iconColor}
                      d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 013.15 0V15M6.9 7.575a1.575 1.575 0 10-3.15 0v8.175a6.75 6.75 0 006.75 6.75h2.018a5.25 5.25 0 003.712-1.538l1.732-1.732a5.25 5.25 0 001.538-3.712l.003-2.024a.668.668 0 01.198-.471 1.575 1.575 0 10-2.228-2.228 3.818 3.818 0 00-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0116.35 15m.002 0h-.002"
                    />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}

        {iSpeak ? (
          <div className="mx-2">
            <button
              onClick={
                iSpeak ? talk : () => setProps('handRaised', !handRaised)
              }
              onKeyUp={e => {
                // don't allow clicking mute button with space bar to prevent confusion with push-to-talk w/ space bar
                if (e.key === ' ') e.preventDefault();
              }}
              class="w-12 h-12 rounded-full flex items-center justify-center focus:outline-none"
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
                        stroke={iconColor}
                      />
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        ) : null}

        <div className="mx-2">
          <button
            class="w-12 h-12 rounded-full flex items-center justify-center focus:outline-none"
            style={{backgroundColor: roomColor.buttons.primary}}
            onClick={() => {
              if (editSelf) {
                setEditSelf(false);
              }
              setShowReactions(s => !s);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke={iconColor}
                d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
              />
            </svg>
          </button>
        </div>
        <div className="mx-2">
          <button
            class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center"
            onClick={() => leaveRoom()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke="#ffffff"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
