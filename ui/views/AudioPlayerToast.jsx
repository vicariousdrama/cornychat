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
  useEffect(() => {
    if (element && audio) {

      function humanTimeFromSeconds(s) {
        let t = new Date(s * 1000).toISOString().substring(11,19);
        while (t.startsWith("00:")) t = t.substring(3);
        if (t.startsWith("0")) t = t.substring(1);
        if (t.length == 1) t = "0:0" + t;
        if (t.length == 2) t = "0:" + t;
        if (t.length == 3) t = "0" + t;
        return t;
      }

      let volslide = document.createElement('input');
      volslide.setAttribute("type", "range");
      volslide.setAttribute("min", "1");
      volslide.setAttribute("max", "100");
      volslide.setAttribute("value", "50");
      volslide.setAttribute("class", "slider w-full h-8 mb-2");
      volslide.setAttribute("id", "volslide");
      //volslide.setAttribute("orient", "vertical");
      volslide.setAttribute("oninput", "audio.volume = (this.value / 100); vollabel.innerText = 'Volume: ' + this.value + '%';");
      let vollabel = document.createElement('span');
      vollabel.setAttribute("id", "vollabel");
      vollabel.setAttribute("class", "text-xs");
      vollabel.setAttribute("style", "position:absolute; bottom:10px; right:15px");
      vollabel.innerText = "Volume: 50 %";
      let seekslide = document.createElement('input');
      seekslide.setAttribute("type", "range");
      seekslide.setAttribute("min", "0");
      seekslide.setAttribute("max", audio.duration);
      seekslide.setAttribute("value", "0");
      seekslide.setAttribute("class", "slider w-full h-8 mb-2");
      seekslide.setAttribute("id", "seekslide");
      seekslide.setAttribute("oninput", "try{audio.currentTime = this.value; seeklabel.innerText = 'Seeking: ' + humanTimeFromSeconds(this.value);}catch(ignore){}");
      let seeklabel = document.createElement('span');
      seeklabel.setAttribute("id", "seeklabel");
      seeklabel.setAttribute("class", "text-xs");
      seeklabel.setAttribute("style", "position:absolute; bottom:10px; left:15px");
      seeklabel.innerText = "0:00";
      let audiotable = document.createElement('table');
      let audiotablerow1 = document.createElement('tr');
      let audiotablecellA1 = document.createElement('td');
      let audiotablecellB1 = document.createElement('td');
      audiotablecellA1.setAttribute("class", "h-6");
      audiotablecellA1.setAttribute("style", "width:60%");
      audiotablecellB1.setAttribute("class", "h-6");
      audiotablecellB1.setAttribute("style", "width:40%");
      audiotablecellA1.appendChild(seekslide);
      audiotablecellA1.appendChild(seeklabel);
      audiotablecellB1.appendChild(volslide);
      audiotablecellB1.appendChild(vollabel);
      audiotablerow1.appendChild(audiotablecellA1);
      audiotablerow1.appendChild(audiotablecellB1);
      audiotable.appendChild(audiotablerow1);

      audio.id = 'audio';
      audio.controls = false;
      audio.volume = .5;
      audio.style.width = '100%';
      element.appendChild(audio);
      element.appendChild(audiotable);

      const seekInterval = setInterval(() => {
        try {
          let ca = document.getElementById('audio');
          if (ca) {
            let ss = document.getElementById('seekslide');
            if (ss) {
              ss.max = ca.duration;
              ss.value = ca.currentTime;
              let sl = document.getElementById('seeklabel');
              if (sl) {
                sl.innerText = 'Time: ' + humanTimeFromSeconds(ca.currentTime) + ' / ' + humanTimeFromSeconds(ca.duration);
              }
            }
          }
        } catch(ignore) {}        
      }, 1000);

      return () => {
        try{
          element.removeChild(audiotable);
          element.removeChild(audio);
          clearInterval(seekInterval);
        } catch(ignore) {}
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
        bottom: '-10px',
        left: '1%',
        width: '98%',
      }}
    >
      <div
        className="bg-gray-500 rounded-lg p-1"
        ref={el => setElement(el)}
        style={{color: 'white'}}
      >
        <div className="text-md flex">
          <div className="flex" onClick={end} style={{cursor: 'pointer',border:'1px solid white'}}><CloseSvg color="white" /></div>
          <div className="flex-grow"> Streaming to the room</div>
          <div clsasName="flex">
            <button className="h-6 rounded-full flex items-center justify-center transition-all text-sm hover:opacity-80 outline"
              style={{position:'absolute',right:'25px',cursor:'pointer',paddingLeft:'5px',paddingRight:'5px',border:'1px solid white'}}
              id="audioplaypause"
              onClick={async (e) => {
                e.stopPropagation();
                let ca = document.getElementById('audio');
                let capp = document.getElementById('audioplaypause');
                if (!ca) return;
                if (ca.paused) { ca.play(); } else { ca.pause(); }
                if (!capp) return;
                if (ca.paused) { capp.innerText = 'Play'; } else { capp.innerText = 'Pause'; }
              }}
            >Pause</button>
          </div>
        </div>
      </div>
    </div>
  );
}
