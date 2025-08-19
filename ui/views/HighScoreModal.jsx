import React, {useState} from 'react';
import {Modal} from './Modal';
import {isDark} from '../lib/theme';
import {useMqParser} from '../lib/tailwind-mqp';
import {useJam} from '../jam-core-react';

export const HighScoreModal = ({close, room, roomColor}) => {
  const [state, {listHighScores}] = useJam();
  let mqp = useMqParser();
  const textColor = isDark(roomColor.buttons.primary)
    ? roomColor.text.light
    : roomColor.text.dark;

  // default time
  let dt1 = new Date();
  let dt2 = new Date(dt1.getFullYear(), 0, 1);
  const [fy, setFY] = useState(dt1.getFullYear());
  const [sw, setSW] = useState(Math.ceil((dt1 - dt2) / 86400000 / 7));
  let dts = `${fy}w${sw}`;

  const [scoreskey, setScoreskey] = useState(`scores${dts}`);
  const [scoresvalue, setScoresvalue] = useState(
    JSON.parse(localStorage.getItem(scoreskey) ?? '[]')
  );

  function updateScores(y, w) {
    setFY(y);
    setSW(w);
    dts = `${y}w${sw}`;
    setScoreskey(`scores${dts}`);
    let localScores = localStorage.getItem(scoreskey);
    if (localScores == undefined) {
      localScores = [];
    } else {
      localScores = JSON.parse(localScores);
      localScores.sort((a, b) =>
        a.points > b.points ? -1 : b.points > a.points ? 1 : 0
      );
    }
    setScoresvalue(localScores);
  }

  let fetchScores = async (y, w) => {
    setFY(y);
    setSW(w);
    dts = `${y}w${w}`;
    setScoreskey(`scores${dts}`);
    let hs = await listHighScores(dts);
    if (hs[0] != undefined) {
      hs = hs[0];
    } else {
      hs = {scores: []};
    }
    localStorage.setItem(scoreskey, JSON.stringify(hs.scores));
    updateScores(y, w);
  };
  function getMaxWeek(y) {
    let beginDate = new Date(y, 0, 1);
    let endDate = new Date(y, 11, 31);
    let maxWeek = Math.ceil((endDate - beginDate) / 86400000 / 7);
    return maxWeek;
  }
  async function previousWeek() {
    let ly = fy;
    let lw = sw;
    if (lw > 1) {
      lw = lw - 1;
      setSW(lw);
    } else {
      ly = fy - 1;
      lw = getMaxWeek(ly);
      setFY(ly);
      setSW(lw);
    }
    await fetchScores(ly, lw);
  }
  async function nextWeek() {
    let ly = fy;
    let lw = sw;

    if (lw == getMaxWeek(ly)) {
      lw = 1;
      ly = ly + 1;
      setSW(lw);
      setFY(ly);
    } else {
      lw = lw + 1;
      setSW(lw);
    }
    await fetchScores(ly, lw);
  }

  return (
    <Modal close={close}>
      <div className="bg-gray-700 text-gray-200 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-center">High Scores</h2>
        <h2 className="text-2xl font-bold text-center">
          Week {sw} of {fy}
        </h2>
        <h2 className="text-2xl font-bold text-center flex">
          <button
            onClick={async e => {
              e.preventDefault();
              await previousWeek();
            }}
            className="flex-grow mt-5 h-12 px-6 text-lg rounded-lg"
            style={{
              color: textColor,
              backgroundColor: roomColor.buttons.primary,
            }}
          >
            Previous Week
          </button>
          <button
            onClick={async e => {
              e.preventDefault();
              await nextWeek();
            }}
            className="flex-grow mt-5 h-12 px-6 text-lg rounded-lg"
            style={{
              color: textColor,
              backgroundColor: roomColor.buttons.primary,
            }}
          >
            Next Week
          </button>
        </h2>
        <>
          {(!scoresvalue || scoresvalue.length == 0) && (
            <h3 className="text-xl font-bold">
              No high scores data available. Earn some points!
            </h3>
          )}
          {scoresvalue &&
            scoresvalue?.map((scoreinfo, index) => {
              return (
                <div className="flex justify-between">
                  <img
                    src={scoreinfo.avatar}
                    className="w-full h-full human-radius"
                    style={{
                      width: '48px',
                      height: '48px',
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
