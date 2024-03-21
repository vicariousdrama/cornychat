import {is, use} from 'use-minimal-state';
import React, {useEffect, useState} from 'react';
import {CloseSvg, ShowModal} from './Modal';
import {declare, useRootState} from '../lib/state-tree';
import {useJam} from '../jam-core-react';

export function ShowAudioPlayerToast() {
  let audioFileElement = useRootState('audioFileElement');
  declare(ShowModal, {
    component: AudioPlayerToast,
    show: !!audioFileElement,
  });
}

function AudioPlayerToast({close}) {
  const [state] = useJam();
  let {name} = use(state, 'audioFile') ?? {};
  let audio = use(state, 'audioFileElement');
  let [element, setElement] = useState();
  let vol = 1;
  let volup = document.createElement('button');
  volup.className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs";
  volup.setAttribute("onclick", "if(audio.volume < .95) {audio.volume += .05} else {audio.volume = 1}");
  volup.innerText="⬆️ Increase Volume";
  let voldown = document.createElement('button');
  voldown.className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs";
  voldown.setAttribute("onclick", "if(audio.volume > .05) {audio.volume -= .05} else {audio.volume = 0}");
  voldown.innerText="⬇️ Decrease Volume";
  useEffect(() => {
    if (element && audio) {
      audio.id = 'audio';
      audio.controls = true;
      audio.style.width = '100%';
      element.appendChild(audio);
      //element.appendChild(volup);
      //element.appendChild(voldown);
      return () => {
        element.removeChild(audio);
      };
    }
  }, [element, audio, close]);

  function end() {
    is(state, 'audioFile', null);
    close();
  }

  return (
    <div
      className="w-100"
      style={{
        position: 'absolute',
        zIndex: '10',
        bottom: '0px',
        left: '1%',
        width: '98%',
      }}
    >
      <div
        className="bg-gray-500 rounded-lg p-2"
        ref={el => setElement(el)}
        style={{
          color: 'white',
        }}
      >
        <div
          style={{
            display: 'none',
            flex: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}
        >
          <div>
            <div className="text-white font-semibold pb-6">
              {/*  heroicons/music-note */}
              <svg
                className="w-5 h-5 inline mr-2 -mt-1"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
              You are streaming to the room
            </div>
          </div>
          <div onClick={end} style={{cursor: 'pointer'}}>
            <CloseSvg color="white" />
          </div>
        </div>
        <div className="hidden mb-1 text-gray-200 text-center">{name ?? ''}</div>
        <div className="text-md flex" onClick={end} style={{cursor: 'pointer'}}><div className="flex"><CloseSvg color="white" /></div><div className="flex-grow"> Streaming to the room</div></div>
      </div>
    </div>
  );
}
