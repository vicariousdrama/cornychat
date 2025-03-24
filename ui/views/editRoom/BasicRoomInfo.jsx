import React, {useState} from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import {avatarUrl, displayName} from '../../lib/avatar';
import {getNpubFromInfo} from '../../nostr/nostr';
import {dosha256hexrounds} from '../../lib/sha256rounds.js';
import {openModal} from '../Modal';
import {CreateZapGoalModal} from './CreateZapGoal.jsx';
import {ImportZapGoalModal} from './ImportZapGoal.jsx';
import {handleFileUpload} from '../../lib/fileupload.js';
import {LoadingIcon} from '../Svg.jsx';

export function BasicRoomInfo({
  iOwn,
  info,
  roomId,
  name,
  setName,
  description,
  setDescription,
  logoURI,
  setLogoURI,
  closed,
  setClosed,
  closedBy,
  setClosedBy,
  isPrivate,
  setIsPrivate,
  isProtected,
  setIsProtected,
  passphrasePlain,
  setPassphrasePlain,
  passphraseHash,
  setPassphraseHash,
  isRecordingAllowed,
  setIsRecordingAllowed,
  stageOnly,
  setStageOnly,
  isLiveActivityAnnounced,
  setIsLiveActivityAnnounced,
  isTS,
  setIsTS,
  tsID,
  setTsID,
  lud16,
  setLud16,
  zapGoal,
  setZapGoal,
  hashTag,
  setHashTag,
  textColor,
  roomColor,
}) {
  let myname = displayName(info, undefined);
  let userNpub = getNpubFromInfo(info);

  let mqp = useMqParser();
  let [expanded, setExpanded] = useState(false);

  let showUploadFile =
    (localStorage.getItem(`fileUpload.auth`) ?? 'false') == 'true' &&
    window.nostr;
  let uploadLogoFile = async e => {
    e.preventDefault();
    let buttonObject = document.getElementById('buttonUploadLogo');
    let fileObject = document.getElementById('fileUploadLogo');
    let textObject = document.getElementById('fileUploadingLogo');
    buttonObject.style.display = 'none';
    fileObject.style.display = 'none';
    textObject.style.display = 'inline';
    let urls = await handleFileUpload(fileUploadLogo);
    if (urls.length > 0) {
      setLogoURI(urls[0]);
    }
    textObject.style.display = 'none';
    fileObject.style.display = 'inline';
    buttonObject.style.display = 'inline';
  };

  return (
    <div>
      <p
        className="text-lg font-medium text-gray-200 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '🔽' : '▶️'} Basic Room Info
      </p>
      <div className={expanded ? '' : 'hidden'}>
        <div className="mb-2">
          <p className="text-sm font-medium text-gray-300">
            Room topic: {!iOwn && <span className="text-gray-300">{name}</span>}
          </p>
          {iOwn && (
            <input
              className={mqp(
                'rounded-lg placeholder-gray-500 bg-gray-300 text-black border-4 pb-2 rounded-lg w-full md:w-96'
              )}
              type="text"
              placeholder="Room topic. Appears on the landing page when room is active."
              value={name}
              name="jam-room-topic"
              autoComplete="off"
              style={{
                fontSize: '15px',
              }}
              onChange={e => {
                setName(e.target.value);
              }}
            ></input>
          )}
        </div>

        <div className="my-2">
          <p className="text-sm font-medium text-gray-300">
            Room Hashtag:{' '}
            {!iOwn && <span className="text-gray-300">{hashTag}</span>}
          </p>
          {iOwn && (
            <input
              className={mqp(
                'rounded-lg placeholder-gray-500 bg-gray-300 text-black border-4 pb-2 rounded-lg w-full md:w-96'
              )}
              type="text"
              placeholder="Room hashtag to be included in nostr notes posted from the room"
              value={hashTag}
              name="jam-room-hashtag"
              autoComplete="off"
              style={{
                fontSize: '15px',
              }}
              onChange={e => {
                setHashTag(e.target.value.replace(/[^A-Za-z0-9]/g, ''));
              }}
            ></input>
          )}
        </div>

        <div className="my-2">
          <div className="text-sm font-medium text-gray-300">Room Logo URI</div>
          <div className="flex justify-between">
            <img className="w-full h-full" src={logoURI} />
          </div>
          {iOwn && (
            <>
              <div className="flex justify-between">
                <input
                  className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                  type="text"
                  placeholder=""
                  value={logoURI ?? ''}
                  name="logoURI"
                  onChange={e => {
                    setLogoURI(e.target.value);
                  }}
                />
              </div>
              {showUploadFile && (
                <>
                  <div className="flex justify-between">
                    <input
                      type="file"
                      name="uploadLogoFile"
                      id="fileUploadLogo"
                      accept="image/*"
                      className="w-full"
                      style={{
                        fontSize: '10pt',
                        margin: '0px',
                        marginLeft: '4px',
                        padding: '2px',
                      }}
                    />
                  </div>
                  <div>
                    <button
                      id="buttonUploadLogo"
                      className="px-5 text-md rounded-md"
                      style={{
                        color: textColor,
                        backgroundColor: roomColor.buttons.primary,
                      }}
                      onClick={async e => {
                        uploadLogoFile(e);
                      }}
                    >
                      Upload
                    </button>
                  </div>
                  <div
                    id="fileUploadingLogo"
                    style={{display: 'none', fontSize: '10pt'}}
                  >
                    <LoadingIcon /> uploading file
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="my-2">
          <p className="text-sm font-medium text-gray-300">
            Lightning Address: {!iOwn && lud16}
          </p>
          {iOwn && (
            <input
              className={mqp(
                'rounded-lg placeholder-gray-500 bg-gray-300 text-black border-4 pb-2 rounded-lg w-full md:w-96'
              )}
              type="text"
              placeholder="Lightning Address. When set, it will display a action to allow for tipping the room to the specified address."
              value={lud16}
              name="jam-room-lud16"
              autoComplete="off"
              style={{
                fontSize: '15px',
              }}
              onChange={e => {
                setLud16(e.target.value);
              }}
            ></input>
          )}
          {(!zapGoal || !zapGoal?.id) && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">Zap Goal:</span> No
              zap goal is set for this room.
              {iOwn && window.nostr && (
                <>
                  <button
                    className="px-2 text-sm rounded-md"
                    style={{
                      color: textColor,
                      backgroundColor: roomColor.buttons.primary,
                    }}
                    onClick={e => {
                      e.preventDefault();
                      openModal(CreateZapGoalModal, {
                        textColor: textColor,
                        roomColor: roomColor,
                        zapGoal: zapGoal,
                        setZapGoal: setZapGoal,
                      });
                      return;
                    }}
                  >
                    Create Zap Goal
                  </button>
                  <button
                    className="px-2 text-sm rounded-md"
                    style={{
                      color: textColor,
                      backgroundColor: roomColor.buttons.primary,
                    }}
                    onClick={e => {
                      e.preventDefault();
                      openModal(ImportZapGoalModal, {
                        textColor: textColor,
                        roomColor: roomColor,
                        setZapGoal: setZapGoal,
                      });
                      return;
                    }}
                  >
                    Attach Zap Goal
                  </button>
                </>
              )}
              {iOwn && !window.nostr && (
                <>Setup a nostr extension to create a zap goal.</>
              )}
            </p>
          )}
          {(zapGoal?.id || '') != '' && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">Zap Goal:</span>{' '}
              {zapGoal.content} (target: {zapGoal.amount} sats).
              {iOwn && (
                <button
                  className="px-2 text-sm rounded-md"
                  style={{
                    color: textColor,
                    backgroundColor: roomColor.buttons.primary,
                  }}
                  onClick={e => {
                    e.preventDefault();
                    setZapGoal({});
                    return;
                  }}
                >
                  Clear
                </button>
              )}
            </p>
          )}
        </div>

        <div className="mt-2">
          <p className="text-sm font-medium text-gray-300">
            Room Description {iOwn && '(markdown supported)'}:
            {!iOwn && (
              <ReactMarkdown
                className="text-sm opacity-70 h-full mt-3 border-4"
                plugins={[gfm]}
                transformLinkUri={customUriTransformer}
              >
                {description}
              </ReactMarkdown>
            )}
          </p>
          {iOwn && (
            <textarea
              className={mqp(
                'rounded-lg placeholder-gray-500 bg-gray-300 text-black border-4 pb-2 rounded-lg w-full md:w-96'
              )}
              placeholder="Room description. Supports markdown."
              value={description}
              name="jam-room-description"
              autoComplete="off"
              rows="4"
              style={{
                fontSize: '15px',
              }}
              onChange={e => {
                setDescription(e.target.value);
              }}
            ></textarea>
          )}
        </div>

        <div className="mt-2">
          {iOwn && (
            <>
              <input
                className="ml-2"
                type="checkbox"
                name="jam-room-closed"
                id="jam-room-closed"
                onChange={() => {
                  let isClosed = !closed;
                  setClosed(isClosed);
                  if (isClosed) {
                    setClosedBy(myname);
                  } else {
                    setClosedBy('');
                  }
                }}
                defaultChecked={closed}
              />
              <label
                className="pl-3 ml-0.5 text-sm font-medium text-gray-300 p-2"
                htmlFor="jam-room-closed"
              >
                Close the room
                <div className="p-2 pl-9 text-gray-300 text-sm">
                  Closed rooms can only be joined by administrators and owners.
                  {closedBy.length == 0 &&
                    `If you close the room, all non-owners will be ejected.`}
                  {closedBy.length > 0 && `Room was closed by ${closedBy}.`}
                </div>
              </label>
            </>
          )}
          {!iOwn && closed && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">Closed</span> - Only
              owners and administrators can join the room.
            </p>
          )}
          {!iOwn && !closed && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">Open</span> - Anyone
              with the url can enter the room.
            </p>
          )}
        </div>

        <div className="mt-2">
          {iOwn && userNpub && (
            <>
              <input
                className="ml-2"
                type="checkbox"
                name="jam-room-isprivate"
                id="jam-room-isprivate"
                onChange={() => {
                  setIsPrivate(!isPrivate);
                }}
                defaultChecked={isPrivate}
              />
              <label
                className="pl-3 ml-0.5 text-sm font-medium text-gray-300 p-2"
                htmlFor="jam-room-isprivate"
              >
                Make room private
                <div className="p-2 pl-9 text-gray-300 text-sm">
                  Private rooms are not displayed on the landing page, nor
                  announced by the Corny Chat bot. Anyone can join a private
                  room by navigating to the room url.
                </div>
              </label>
            </>
          )}
          {!iOwn && isPrivate && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">Private Room</span> -
              not displayed on landing page or announced by the Corny Chat bot.
              Anyone can join a private room by navigating to the room url.{' '}
              {iOwn && !userNpub && (
                <>You need a nostr identity to make the room public.</>
              )}
            </p>
          )}
          {!iOwn && !isPrivate && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">Public Room</span> -
              displays on landing page and announced by Corny Chat bot.
            </p>
          )}
        </div>

        <div className="mt-2">
          {iOwn && (
            <>
              <input
                className="ml-2"
                type="checkbox"
                name="jam-room-isprotected"
                id="jam-room-isprotected"
                onChange={() => {
                  setIsProtected(!isProtected);
                  if (!isProtected) {
                    setPassphrasePlain('');
                    setPassphraseHash('');
                  }
                }}
                defaultChecked={isProtected}
              />
              <label
                className="pl-3 ml-0.5 text-sm font-medium text-gray-300 p-2"
                htmlFor="jam-room-isprotected"
              >
                Make room protected
                <div className="p-2 pl-9 text-gray-300 text-sm">
                  Protected rooms require a passphrase for entry. Users with the
                  proper passphrase will be allowed entry, while those without
                  are denied access.
                  {(passphraseHash ?? '').length == 0 ? (
                    <>
                      <br />
                      Specify a passphrase in the box below. This value is case
                      sensitive and may contain any combination of numbers,
                      letters or symbols.
                      <input
                        className={mqp(
                          'rounded-lg placeholder-gray-500 bg-gray-300 text-black border-4 pb-2 rounded-lg w-full md:w-96'
                        )}
                        type="password"
                        placeholder=""
                        value={passphrasePlain}
                        name="jam-room-passphrase"
                        autoComplete="off"
                        style={{
                          fontSize: '15px',
                        }}
                        onChange={async e => {
                          let plaintext = e.target.value;
                          setPassphrasePlain(plaintext);
                        }}
                        onBlur={async e => {
                          let roomPassphrasePlain = `${roomId}.${passphrasePlain}`;
                          let roomPassphraseHash = await dosha256hexrounds(
                            roomPassphrasePlain,
                            21
                          );
                          setPassphraseHash(roomPassphraseHash);
                        }}
                      ></input>
                    </>
                  ) : (
                    <>
                      <br />A passphrase is currently set for this room. &nbsp;
                      <button
                        className="px-2 text-sm rounded-md"
                        style={{
                          color: textColor,
                          backgroundColor: roomColor.buttons.primary,
                        }}
                        onClick={e => {
                          e.preventDefault();
                          setPassphrasePlain('');
                          setPassphraseHash('');
                        }}
                      >
                        Clear Passphrase
                      </button>
                    </>
                  )}
                </div>
              </label>
            </>
          )}
          {!iOwn && isProtected && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">Protected Room</span>{' '}
              - Users must have and provide the correct pass code to gain entry.
              Those without are denied.
            </p>
          )}
          {!iOwn && !isProtected && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">
                Unprotected Room
              </span>{' '}
              - All users may access this room. No pass code is required.
            </p>
          )}
        </div>

        <div className="mt-2">
          {iOwn && (
            <>
              <input
                className="ml-2"
                type="checkbox"
                name="jam-room-isrecordingallowed"
                id="jam-room-isrecordingallowed"
                onChange={() => {
                  setIsRecordingAllowed(!isRecordingAllowed);
                }}
                defaultChecked={isRecordingAllowed}
              />
              <label
                className="pl-3 ml-0.5 text-sm font-medium text-gray-300 p-2"
                htmlFor="jam-room-isrecordingallowed"
              >
                Allow Recordings
                <div className="p-2 pl-9 text-gray-300 text-sm">
                  If recordings are allowed, then any moderator of the room can
                  begin a recording in their client. Participants in the room
                  are notified that a recording is in progress. If unchecked,
                  the Start Recording option will not be present in the menu
                  choices.
                </div>
              </label>
            </>
          )}
          {!iOwn && !isRecordingAllowed && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">
                Recordings Disabled
              </span>
            </p>
          )}
          {!iOwn && isRecordingAllowed && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">
                Recordings Allowed
              </span>{' '}
              - An owner or moderator can start a recording and a visual
              indicator is shown to users in the room when a recording is in
              progress.
            </p>
          )}
        </div>

        <div className="mt-2">
          {iOwn && (
            <>
              <input
                className="ml-2"
                type="checkbox"
                name="jam-room-isLiveActivityAnnounced"
                id="jam-room-isLiveActivityAnnounced"
                onChange={() => {
                  setIsLiveActivityAnnounced(!isLiveActivityAnnounced);
                }}
                defaultChecked={isLiveActivityAnnounced}
              />
              <label
                className="pl-3 ml-0.5 text-sm font-medium text-gray-300 p-2"
                htmlFor="jam-room-isLiveActivityAnnounced"
              >
                Announce as Live Activity
                <div className="p-2 pl-9 text-gray-300 text-sm">
                  If enabled, then the room will be announced as a nostr live
                  activity. Live activities publish the nostr room participant
                  pubkeys and roles, the room topic and description, and current
                  active slide as the image. A link is provided to the room.
                  Remote streaming is not supported at this time.
                </div>
              </label>
            </>
          )}
          {!iOwn && !isLiveActivityAnnounced && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">
                Live Activity Announcement Disabled
              </span>
            </p>
          )}
          {!iOwn && isLiveActivityAnnounced && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">
                Live Activity Announcement Enabled
              </span>
              A nostr live activity will periodically publish information about
              the topic, description, current slide (if any), and room
              participants.
            </p>
          )}
        </div>

        <div className="mt-2">
          {iOwn && (
            <>
              <input
                className="ml-2"
                type="checkbox"
                name="jam-room-stageonly"
                id="jam-room-stageonly"
                onChange={() => {
                  setStageOnly(!stageOnly);
                  if (stageOnly && isTS) {
                    alert('Disabling Talking Stick mode');
                    setIsTS(!isTS);
                  }
                }}
                defaultChecked={stageOnly}
              />
              <label
                className="pl-3 ml-0.5 text-sm font-medium text-gray-300 p-2"
                htmlFor="jam-room-stageonly"
              >
                Stage Only room
                <div className="p-2 pl-9 text-gray-300 text-sm">
                  When enabled, users entering the room will be brought on stage
                  by default. A moderator can still move a user to the audience.
                </div>
              </label>
            </>
          )}
          {!iOwn && !stageOnly && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">Standard room</span> -
              Users will start in the audience and a room owner or moderator may
              invite them to the stage.
            </p>
          )}
          {!iOwn && stageOnly && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">Stage Only room</span>{' '}
              - Users will be placed on the stage and may speak freely.
            </p>
          )}
        </div>

        <div className="mt-2">
          {iOwn && (
            <>
              <input
                className="ml-2"
                type="checkbox"
                name="jam-room-istalkingstick"
                id="jam-room-istalkingstick"
                onChange={() => {
                  setIsTS(!isTS);
                  if (stageOnly && isTS) {
                    alert('Disabling Stage Only mode');
                    setStageOnly(!stageOnly);
                  }
                }}
                defaultChecked={isTS}
              />
              <label
                className="pl-3 ml-0.5 text-sm font-medium text-gray-300 p-2"
                htmlFor="jam-room-istalkingstick"
              >
                Use Talking Stick
                <div className="p-2 pl-9 text-gray-300 text-sm">
                  Rooms that use a talking stick only permit one person to talk
                  at a time. The person speaking must hand off the microphone to
                  the next person to be allowed to speak. A room owner can
                  always take the talking stick.
                </div>
              </label>
            </>
          )}
          {!iOwn && isTS && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">
                Talking Stick Enabled
              </span>{' '}
              - Only one user may speak at a time. The person with the talking
              stick must hand it off to the next user to be able to talk.
              Speakers should raise their hand to signify they want to speak.
            </p>
          )}
          {!iOwn && !isTS && (
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-gray-300">
                Talking Stick Disabled
              </span>{' '}
              - Anyone with speaker privileges may talk at any time.
            </p>
          )}
        </div>
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
