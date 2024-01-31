import React from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';

export function BasicRoomInfo({
  name,
  setName,
  description,
  setDescription,
  logoURI,
  setLogoURI,
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
    </div>
  );
}
