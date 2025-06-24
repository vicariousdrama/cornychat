import React, {useState} from 'react';
import {use} from 'use-minimal-state';
import {openModal} from './Modal';
import EditPersonalSettings from './editPersonalSettings/EditPersonalSettings';
import {HighScoreModal} from './HighScoreModal';
import {PostNoteModal} from './PostNoteModal';
import StreamingModal from './StreamingModal';
import {isDark} from '../lib/theme';
import {useJam} from '../jam-core-react';
import {EditRoomModal} from './editRoom/EditRoom';
import {
  Edit,
  Settings,
  Stop,
  Stream,
  Mic,
  Share,
  Slideshow,
  Refresh,
  Up,
  Down,
  Follow,
  WriteNote,
  Profile,
  StarFavorite,
  StarUnFavorite,
  HighScore,
  Recommend,
} from './Svg';
import {
  followAllNpubsFromIds,
  favoriteRoom,
  unfavoriteRoom,
  loadFavoriteRooms,
  recommendCornyChat,
} from '../nostr/nostr';

export function MyNavMenu({close, roomColor, iAmAdmin}) {
  const supportFollows = true; // kind 3 is deprecated, now using kind 30000 as d=cornychat-follows
  const [
    state,
    {
      leaveStage,
      addSpeaker,
      removeSpeaker,
      startRecording,
      stopRecording,
      downloadRecording,
      updateRoom,
    },
  ] = useJam();
  let [iSpeak, iModerate, iOwn, room, myId, roomId, isRecording] = use(state, [
    'iAmSpeaker',
    'iAmModerator',
    'iAmOwner',
    'room',
    'myId',
    'roomId',
    'isRecording',
  ]);
  let submitUpdate = async partialRoom => {
    updateRoom(roomId, {...room, ...partialRoom});
  };
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
  let [isRoomFavorited, setIsRoomFavorited] = useState(false);
  async function checkRoomFavorites() {
    let myFavorites = await loadFavoriteRooms();
    for (let t of myFavorites) {
      if (t.length < 2) continue;
      if (t[0] != 'r') continue;
      if (t[1] != roomId) continue;
      setIsRoomFavorited(true);
    }
  }
  checkRoomFavorites();

  let [recommended, setRecommended] = useState(
    (localStorage.getItem('appRecommended') ?? 0) >
      Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60
  );
  let [currentSlide, setCurrentSlide] = useState(room?.currentSlide ?? -1);
  let hasSlides = false;
  if (room.roomSlides != null) {
    hasSlides = room.roomSlides.length > 0;
  }

  let [isRecordingAllowed] = useState(room?.isRecordingAllowed ?? false);

  return (
    <div
      className="max-w-lg max-h-128 mx-auto"
      style={{backgroundColor: roomColor.avatarBg, color: textColor}}
    >
      <table>
        <tr>
          <td valign="top">
            <div
              onClick={() => {
                openModal(EditPersonalSettings);
                close(false);
              }}
              className="p-2 flex items-center"
            >
              <Profile color={iconColor} />
              <p className="text-md ml-1 cursor-pointer">Personal settings</p>
            </div>

            {(iModerate || iOwn || iAmAdmin) && (
              <div
                onClick={() => {
                  openModal(EditRoomModal, {
                    roomId,
                    iOwn,
                    room,
                    roomColor,
                    iAmAdmin,
                  });
                  close(false);
                }}
                className="p-2 flex items-center"
              >
                <Settings color={iconColor} />
                <p className="text-md ml-1 cursor-pointer">Room settings</p>
              </div>
            )}

            {window.nostr && (
              <div
                onClick={async () => {
                  if (isRoomFavorited) {
                    unfavoriteRoom(roomId);
                    setIsRoomFavorited(false);
                  } else {
                    favoriteRoom(roomId);
                    setIsRoomFavorited(true);
                  }
                  close(false);
                }}
                className="p-2 flex items-center"
              >
                {isRoomFavorited ? (
                  <>
                    <StarUnFavorite color={iconColor} />
                    <p className="text-md ml-1 cursor-pointer">Unstar room</p>
                  </>
                ) : (
                  <>
                    <StarFavorite color={iconColor} />
                    <p className="text-md ml-1 cursor-pointer">
                      Add to Favorites
                    </p>
                  </>
                )}
              </div>
            )}

            {window.nostr && (
              <div
                onClick={() => {
                  openModal(PostNoteModal, {room, roomColor});
                  close(false);
                }}
                className="p-2 flex items-center"
              >
                <WriteNote color={iconColor} />
                <p className="text-md ml-1 cursor-pointer">Note to nostr</p>
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
                <p className="text-md ml-1 cursor-pointer">Play audio file</p>
              </div>
            )}

            {(iOwn || iModerate || iAmAdmin) && isRecordingAllowed && (
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
                  <Stop color={iconColor} />
                ) : (
                  <Mic color={iconColor} />
                )}
                <p className="text-md ml-1 cursor-pointer items-center">
                  {isRecording ? 'Stop recording' : 'Start recording'}
                </p>
              </div>
            )}
          </td>
          <td valign="top">
            <div
              onClick={async () => copyToClipboard()}
              className="p-2 flex items-center"
            >
              <Share color={iconColor} />
              <p
                className="text-md ml-1 cursor-pointer"
                style={{color: textColor}}
              >
                Copy room link
              </p>
            </div>

            {!stageOnly && (iModerate || iOwn || iAmAdmin) && !iSpeak && (
              <div
                onClick={() => addSpeaker(roomId, myId).then(close(false))}
                className="p-2 flex items-center"
              >
                <p className="text-md cursor-pointer">↑ Move to stage</p>
              </div>
            )}
            {!stageOnly && (iOwn || iModerate || iAmAdmin) && iSpeak && (
              <div
                onClick={() => removeSpeaker(roomId, myId).then(close(false))}
                className="p-2 flex items-center"
              >
                <p className="text-md cursor-pointer">↓ Leave stage</p>
              </div>
            )}
            {!stageOnly && !(iOwn || iModerate || iAmAdmin) && iSpeak && (
              <div
                onClick={() => {
                  leaveStage();
                  close(false);
                }}
                className="p-2 flex items-center"
              >
                <p className="text-md cursor-pointer">↓ Leave stage</p>
              </div>
            )}

            <div
              onClick={async () => {
                // new way to force a reload without client cache
                const testform = document.createElement('form');
                testform.method = 'POST';
                testform.action = location.href;
                document.body.appendChild(testform);
                testform.submit();
                // old ways 1
                //location.reload(true);
                // old ways 2
                //history.pushState(null, null, window.location.href);
              }}
              className="p-2 flex items-center"
            >
              <Refresh color={iconColor} />
              <p
                className="text-md ml-1 cursor-pointer"
                style={{color: textColor}}
              >
                Refresh page
              </p>
            </div>

            {(iOwn || iModerate || iAmAdmin) && hasSlides && (
              <div
                onClick={async () => {
                  if (room.currentSlide > 0) {
                    currentSlide = !currentSlide;
                    await submitUpdate({
                      currentSlide,
                    });
                  } else {
                    currentSlide = 1;
                    await submitUpdate({
                      currentSlide,
                    });
                  }
                  close(false);
                }}
                className="p-2 flex items-center"
              >
                {room.currentSlide < 1 ? (
                  <Slideshow color={iconColor} />
                ) : (
                  <Stop color={iconColor} />
                )}
                <p className="text-md ml-1 cursor-pointer">
                  {room.currentSlide > 0 ? 'Hide slides' : 'Start slides'}
                </p>
              </div>
            )}

            {supportFollows && window.nostr && (
              <div
                onClick={async () => {
                  let inRoomPeerIds = sessionStorage.getItem(
                    roomId + '.peerIds'
                  );
                  followAllNpubsFromIds(inRoomPeerIds);
                  close(false);
                }}
                className="p-2 flex items-center"
              >
                <Follow color={iconColor} />
                <p
                  className="text-md ml-1 cursor-pointer"
                  style={{color: textColor}}
                >
                  Add all contacts
                </p>
              </div>
            )}

            {window.jamConfig.game && window.gameEnabled && (
              <div
                onClick={async () => {
                  openModal(HighScoreModal, {room, roomColor});
                  close(false);
                }}
                className="p-2 flex items-center"
              >
                <HighScore color={iconColor} />
                <p
                  className="text-md ml-1 cursor-pointer"
                  style={{color: textColor}}
                >
                  View high scores
                </p>
              </div>
            )}

            {window.nostr && !recommended && (
              <div
                onClick={async () => {
                  recommendCornyChat();
                  localStorage.setItem(
                    'appRecommended',
                    Math.floor(Date.now() / 1000)
                  );
                  setRecommended(true);
                  alert('Thank you for recommending Corny Chat!');
                  close(false);
                }}
                className="p-2 flex items-center"
              >
                <Recommend color={iconColor} />
                <p
                  className="text-md ml-1 cursor-pointer"
                  style={{color: textColor}}
                >
                  Recommend app
                </p>
              </div>
            )}
          </td>
        </tr>
      </table>
    </div>
  );
}
