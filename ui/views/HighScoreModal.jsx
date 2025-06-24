import React, {useState} from 'react';
import {Modal} from './Modal';
import {isDark} from '../lib/theme';
import {useMqParser} from '../lib/tailwind-mqp';
import {useJam} from '../jam-core-react';

export const HighScoreModal = ({close, room, roomColor}) => {
  const [state] = useJam();
  let mqp = useMqParser();
  const textColor = isDark(roomColor.buttons.primary)
    ? roomColor.text.light
    : roomColor.text.dark;

  let dt1 = new Date();
  let dt2 = new Date(dt1.getFullYear(), 0, 1);
  let sw = Math.ceil((dt1 - dt2) / 86400000 / 7);
  let dts = `${dt1.getFullYear()}w${sw}`;
  let scoreskey = `scores${dts}`;
  let scoresvalue = localStorage.getItem(scoreskey);
  if (scoresvalue != undefined) {
    scoresvalue = JSON.parse(scoresvalue);
    scoresvalue.sort((a, b) =>
      a.points > b.points ? -1 : b.points > a.points ? 1 : 0
    );
  } else {
    scoresvalue = [];
  }

  return (
    <Modal close={close}>
      <div className="bg-gray-700 text-gray-200 p-6 rounded-lg">
        <h2 className="text-2xl font-bold">
          High Scores for Week {dts.slice(5, 7)} of {dts.slice(0, 4)}
        </h2>
        <>
          {scoresvalue.length == 0 && (
            <h3 className="text-xl font-bold">
              No high scores data available. Earn some points!
            </h3>
          )}
          {scoresvalue?.map((scoreinfo, index) => {
            return (
              <div className="flex justify-between">
                <img
                  src={scoreinfo.avatar}
                  className="w-full h-full human-radius"
                  style={{
                    width: '48px',
                    height: 'auto',
                    border: '0px',
                    display: 'inline',
                  }}
                />
                <div className="p-2 m-2 rounded-lg">{scoreinfo.name}</div>
                <div className="p-2 m-2 rounded-lg">{scoreinfo.points}</div>
              </div>
            );
          })}
        </>
      </div>
    </Modal>
  );
};
