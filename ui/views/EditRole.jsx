import React from 'react';
import {use} from 'use-minimal-state';
import {openModal} from './Modal';
import EditIdentity from './EditIdentity';
import {useMqParser} from '../lib/tailwind-mqp';
import StreamingModal from './StreamingModal';
import {isDark} from '../lib/theme';
import {useJam, useApiQuery} from '../jam-core-react';
import {EditRoomModal} from './EditRoom';

export default function EditRole({
  peerId,
  speakers,
  moderators,
  stageOnly = false,
  roomColor,
  onCancel,
}) {
  const [state, api] = useJam();
  const {
    addSpeaker,
    addModerator,
    removeSpeaker,
    removeModerator,
    addAdmin,
    removeAdmin,
  } = api;
  let [myId, roomId] = use(state, ['myId', 'roomId']);
  let [myAdminStatus] = useApiQuery(`/admin/${myId}`, {fetchOnMount: true});
  let [peerAdminStatus] = useApiQuery(`/admin/${peerId}`, {fetchOnMount: true});

  let isSpeaker = stageOnly || speakers.includes(peerId);
  let isModerator = moderators.includes(peerId);

  const textColor = isDark(roomColor.avatarBg)
    ? roomColor.text.light
    : roomColor.text.dark;

  return (
    <div
      className="max-w-md max-h-28 w-full h-full mx-auto flex flex-wrap text-black justify-between rounded-lg"
      style={{backgroundColor: roomColor.avatarBg, color: textColor}}
    >
      {myAdminStatus?.admin && (
        <div>
          {(peerAdminStatus?.admin && (
            <p
              onClick={() => removeAdmin(peerId).then(onCancel)}
              className="text-white text-sm p-4 cursor-pointer"
            >
              ❎️ Remove Admin
            </p>
          )) || (
            <p
              onClick={() => addAdmin(peerId).then(onCancel)}
              className="text-white text-xs p-4 cursor-pointer"
            >
              👑️ Make Admin
            </p>
          )}
        </div>
      )}
      {!stageOnly &&
        (isSpeaker ? (
          <p
            onClick={() => removeSpeaker(roomId, peerId).then(onCancel)}
            className="text-white text-sm p-4 cursor-pointer"
          >
            ↓ Move to Audience
          </p>
        ) : (
          <p
            onClick={() => addSpeaker(roomId, peerId).then(onCancel)}
            className="text-white text-sm p-4 cursor-pointer"
          >
            ↑ Invite to Stage
          </p>
        ))}
      {isSpeaker && !isModerator && (
        <p
          onClick={() => addModerator(roomId, peerId).then(onCancel)}
          className="text-white text-sm p-4 cursor-pointer"
        >
          ✳️ Make Moderator
        </p>
      )}
      {isModerator && (
        <p
          onClick={() => removeModerator(roomId, peerId).then(onCancel)}
          className="text-white text-sm p-4 cursor-pointer"
        >
          ❎ Demote Moderator
        </p>
      )}
      <p onClick={onCancel} className="text-red-500 text-sm p-4 cursor-pointer">
        Cancel
      </p>
    </div>
  );
}

export function EditSelf({close, roomColor}) {
  const [
    state,
    {
      leaveStage,
      addSpeaker,
      removeSpeaker,
      startRecording,
      stopRecording,
      downloadRecording,
    },
  ] = useJam();
  let [iSpeak, iModerate, room, myId, roomId, isRecording] = use(state, [
    'iAmSpeaker',
    'iAmModerator',
    'room',
    'myId',
    'roomId',
    'isRecording',
  ]);
  let stageOnly = !!room?.stageOnly;
  iSpeak = stageOnly || iSpeak;
  const iconColor = isDark(roomColor.avatarBg)
    ? roomColor.icons.light
    : roomColor.icons.dark;
  const textColor = isDark(roomColor.avatarBg)
    ? roomColor.text.light
    : roomColor.text.dark;
  return (
    <div
      className="max-w-lg max-h-28 mx-auto flex flex-wrap rounded-lg"
      style={{backgroundColor: roomColor.avatarBg, color: textColor}}
    >
      {!room.access?.lockedIdentities && (
        <div
          onClick={() => {
            openModal(EditIdentity);
            close(false);
          }}
          className="p-2 flex items-center"
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
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>

          <p className="text-sm ml-1 cursor-pointer">Edit Profile</p>
        </div>
      )}

      {iModerate && (
        <div
          onClick={() => {
            openModal(EditRoomModal, {roomId, room, roomColor});
            close(false);
          }}
          className="p-2 flex items-center"
        >
          <svg
            className="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              stroke={iconColor}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              stroke={iconColor}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>{' '}
          <p className="text-sm ml-1 cursor-pointer">Room settings</p>
        </div>
      )}
      {!stageOnly && iModerate && !iSpeak && (
        <div
          onClick={() => addSpeaker(roomId, myId).then(close(false))}
          className="p-2"
        >
          <p className="text-sm cursor-pointer">↑ Move to stage</p>
        </div>
      )}

      {iSpeak && (
        <div
          onClick={() => {
            openModal(StreamingModal);
            close(false);
          }}
          className="p-2 flex items-center"
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
              d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
            />
          </svg>

          <p className="text-sm ml-1 cursor-pointer">Stream audio</p>
        </div>
      )}
      {iModerate && (
        <div
          onClick={() => {
            if (isRecording) {
              stopRecording();
              downloadRecording('my-recording');
            } else {
              startRecording();
            }
            close(false);
          }}
          className="p-2 flex items-center"
        >
          {isRecording ? (
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
                stroke={iconColor}
                stroke-linejoin="round"
                d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"
              />
            </svg>
          ) : (
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
            </svg>
          )}
          <p className="text-sm ml-1 cursor-pointer items-center">
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </p>
        </div>
      )}

      {!stageOnly && iModerate && iSpeak && (
        <div
          onClick={() => removeSpeaker(roomId, myId).then(close(false))}
          className="p-2"
        >
          <p className="text-sm text-red-500 cursor-pointer">Leave Stage</p>
        </div>
      )}
      {!stageOnly && !iModerate && iSpeak && (
        <div
          onClick={() => {
            leaveStage();
            close(false);
          }}
          className="p-2"
        >
          <p className="text-sm text-red-500 cursor-pointer">Leave stage</p>
        </div>
      )}
    </div>
  );
}
