import React from 'react';
import {use} from 'use-minimal-state';
import {openModal} from './Modal';
import EditIdentity from './EditIdentity';
import StreamingModal from './StreamingModal';
import {isDark} from '../lib/theme';
import {useJam, useApiQuery} from '../jam-core-react';
import {EditRoomModal} from './editRoom/EditRoom';
import {Edit, Settings, Stop, Stream, Mic, Share} from './Svg';

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
              ❌ Remove Admin
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
          ❌ Demote Moderator
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
  async function copyToClipboard() {
    await window.navigator.clipboard.writeText(
      `https://${location.hostname}/${roomId}`
    );

    close(false);
    alert('Room link copied to clipboard');
  }
  return (
    <div
      className="max-w-lg max-h-28 mx-auto flex flex-wrap justify-center rounded-lg"
      style={{backgroundColor: roomColor.avatarBg, color: textColor}}
    >
      {iModerate && (
        <div
          onClick={() => {
            openModal(EditRoomModal, {roomId, room, roomColor});
            close(false);
          }}
          className="p-2 flex items-center"
        >
          <Settings color={iconColor} />
          <p className="text-md ml-1 cursor-pointer">Room settings</p>
        </div>
      )}
      {!stageOnly && iModerate && !iSpeak && (
        <div
          onClick={() => addSpeaker(roomId, myId).then(close(false))}
          className="p-2"
        >
          <p className="text-md cursor-pointer">↑ Move to stage</p>
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
          <Stream color={iconColor} />

          <p className="text-md ml-1 cursor-pointer">Stream audio</p>
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
          {isRecording ? <Stop color={iconColor} /> : <Mic color={iconColor} />}
          <p className="text-md ml-1 cursor-pointer items-center">
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </p>
        </div>
      )}

      <div
        onClick={async () => copyToClipboard()}
        className="p-2 flex items-center"
      >
        <Share color={iconColor} />
        <p className="text-md ml-1 cursor-pointer" style={{color: textColor}}>
          Share
        </p>
      </div>

      {!stageOnly && iModerate && iSpeak && (
        <div
          onClick={() => removeSpeaker(roomId, myId).then(close(false))}
          className="p-2"
        >
          <p className="text-md text-red-500 cursor-pointer">Leave Stage</p>
        </div>
      )}

      <div onClick={async () => {
        location.reload(true);
        //history.pushState(null, null, window.location.href);
      }} className="p-2 flex items-center">
        <p className="text-md ml-1 cursor-pointer" style={{color: textColor}}>
          Refresh Page
        </p>
      </div>
      
      {!stageOnly && !iModerate && iSpeak && (
        <div
          onClick={() => {
            leaveStage();
            close(false);
          }}
          className="p-2"
        >
          <p className="text-md text-red-500 cursor-pointer">Leave stage</p>
        </div>
      )}
    </div>
  );
}
