import React from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';

export function BasicRoomInfo({
  name,
  setName,
  description,
  setDescription,
  logoURI,
  setLogoURI,
  closed,
  setClosed,
  isPrivate,
  setIsPrivate,
  isRecordingAllowed,
  setIsRecordingAllowed,
  stageOnly,
  setStageOnly,
}) {
  let mqp = useMqParser();
  return (
    <div>
      <p className="text-lg font-medium text-gray-500 px-2">
        Basic Room Info
      </p>
      <div className="mb-2">
        <p className="text-sm font-medium text-gray-500 px-2">
          Room topic:
        </p>
        <input
          className={mqp(
            'rounded-lg placeholder-gray-400 bg-gray-100 border-4 m-2 pb-2 rounded-lg w-full md:w-96'
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
      </div>

      <div className="my-2">
        <p className="text-sm font-medium text-gray-500 px-2">
          Room logo URI:
        </p>
        <input
          className={mqp(
            'rounded-lg placeholder-gray-400 bg-gray-100 border-4 m-2 pb-2 rounded-lg w-full md:w-96'
          )}
          type="text"
          placeholder="Logo URI. Displayed on the landing page when room is active."
          value={logoURI}
          name="jam-room-logo-uri"
          autoComplete="off"
          style={{
            fontSize: '15px',
          }}
          onChange={e => {
            setLogoURI(e.target.value);
          }}
        ></input>
      </div>

      <div className="mt-2">
        <p className="text-sm font-medium text-gray-500 px-2">
          Room Description (markdown supported):
        </p>
        <textarea
          className={mqp(
            'rounded-lg placeholder-gray-400 bg-gray-100 border-4 m-2 pb-2 rounded-lg w-full md:w-96'
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
      </div>

      <div className="mt-2">
        <input
          className="ml-2"
          type="checkbox"
          name="jam-room-closed"
          id="jam-room-closed"
          onChange={() => {
            setClosed(!closed);
          }}
          defaultChecked={closed}
        />
        <label
          className="pl-3 ml-0.5 text-sm font-medium text-gray-500 p-2"
          htmlFor="jam-room-closed"
        >
          Close the room
          <div className="p-2 pl-9 text-gray-400 text-sm">
            Closed rooms can only be joined by administrators, owners and moderators.
            Everyone else sees the description and the&nbsp;
            {`'call to action'`} button.
          </div>
        </label>
      </div>

      <div className="mt-2">
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
          className="pl-3 ml-0.5 text-sm font-medium text-gray-500 p-2"
          htmlFor="jam-room-isprivate"
        >
          Make room private
          <div className="p-2 pl-9 text-gray-400 text-sm">
            Private rooms are not displayed on the landing page, nor announced by the Corny Chat bot.
            Anyone can join a private room by navigating to the room url.
          </div>
        </label>
      </div>

      <div className="mt-2">
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
          className="pl-3 ml-0.5 text-sm font-medium text-gray-500 p-2"
          htmlFor="jam-room-isrecordingallowed"
        >
          Allow Recordings
          <div className="p-2 pl-9 text-gray-400 text-sm">
            If recordings are allowed, then any moderator of the room can begin a recording
            in their client. Participants in the room are notified that a recording is in progress.
            If unchecked, the Start Recording option will not be present in the menu choices.
          </div>
        </label>
      </div>

      <div className="mt-2">
        <input
          className="ml-2"
          type="checkbox"
          name="jam-room-stageonly"
          id="jam-room-stageonly"
          onChange={() => {
            setStageOnly(!stageOnly);
          }}
          defaultChecked={stageOnly}
        />
        <label
          className="pl-3 ml-0.5 text-sm font-medium text-gray-500 p-2"
          htmlFor="jam-room-stageonly"
        >
          Stage Only room
          <div className="p-2 pl-9 text-gray-400 text-sm">
            When enabled, users entering the room will be brought on stage by default.
            A moderator can still move a user to the audience.
          </div>
        </label>
      </div>

    </div>
  );
}
