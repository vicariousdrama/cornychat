import React from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';
import {Trash} from '../Svg';

export function RoomModerators({
  moderators,
  setModerators,
}) {
  let mqp = useMqParser();

  function RoomModerators() {
    if (moderators.length === 0) {
      return (
        <div>
          <p className="text-sm text-gray-500 p-2">
            There are no moderators.
          </p>
        </div>
      );
    }

    function removeModerator(indexModerator) {
      let newRoomModerators = moderators.filter((moderator, index) =>
        index !== indexModerator ? moderator : null
      );
      setModerators(newRoomModerators);
    }

    return (
      <>
        {moderators.map((moderator, index) => {
          return (
            <div className="flex w-full justify-between my-3">
              <div>
                {' '}
                <p className="text-sm text-black" style={{overflowWrap: 'break-word'}}>{moderator}</p>
              </div>
              <div onClick={() => removeModerator(index)} className="cursor-pointer">
                <Trash />
              </div>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div>
      <p className="text-lg font-medium text-gray-500 px-2">
        Moderators
      </p>
      <div className="mb-2 bg-gray-200 py-2 px-4 my-5 rounded-lg">
        <RoomModerators />
      </div>
    </div>
  );
}
