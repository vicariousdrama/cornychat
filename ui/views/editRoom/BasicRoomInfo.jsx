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
      <div className="mb-10">
        <p className="text-sm font-medium text-gray-500 px-2">
          Choose your room's topic:
        </p>
        <input
          className={mqp(
            'rounded-lg placeholder-gray-400 bg-gray-100 border-4 m-2 pb-2 rounded-lg w-full md:w-96'
          )}
          type="text"
          placeholder="Room topic"
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

      <div className="my-5">
        <p className="text-sm font-medium text-gray-500 px-2">
          Paste your room's logo URI:
        </p>
        <input
          className={mqp(
            'rounded-lg placeholder-gray-400 bg-gray-100 border-4 m-2 pb-2 rounded-lg w-full md:w-96'
          )}
          type="text"
          placeholder="Logo URI"
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

      <div className="mt-10">
        <p className="text-sm font-medium text-gray-500 px-2">
          Set your room's description:
        </p>
        <textarea
          className={mqp(
            'rounded-lg placeholder-gray-400 bg-gray-100 border-4 m-2 pb-2 rounded-lg w-full md:w-96'
          )}
          placeholder="Room description. Supports markdown."
          value={description}
          name="jam-room-description"
          autoComplete="off"
          rows="2"
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
