import {update} from 'minimal-state';
import {useAction, useOn, useRootState} from '../lib/state-tree';
import {sendPeerEvent} from '../lib/swarm';
import {actions} from './state';

export {SoundReactions};

function SoundReactions({swarm}) {
  const state = useRootState();

  useOn(swarm.peerEvent, 'sound', (peerId, sound) => {
    let okToPlay = peerId === swarm.myPeerId; // play for myself
    if (!okToPlay) {
      try {
        let sp = sessionStorage.getItem(`${swarm.room}.stagePeerIds`);
        sp = JSON.parse(sp);
        if (sp.includes(peerId)) okToPlay = true;
      } catch (ignore) {
        console.log('in sound reactions error: ', JSON.stringify(ignore));
      }
    }
    if (okToPlay && sound) playSound(sound, peerId);
  });

  const peerSoundInterval = setInterval(() => {
    try {
      let as = document.getElementsByTagName('audio');
      for (let a of as) {
        if (a.getAttribute('id').indexOf('peersound_') > -1) {
          if (a.currentTime > 5) a.pause();
        }
      }
    } catch (ignore) {}
  }, 1000);

  function playSound(sound, peerId) {
    let {sounds} = state;
    if (!sounds[peerId]) sounds[peerId] = [];
    let soundObj = [sound, Math.random()];
    let soundFile = sound.sound;
    let soundTarget = sound.peerId;
    if (soundTarget == '' || soundTarget == swarm.myPeerId) {
      console.log('peer', peerId, 'sent sound effect', soundFile);
      let id = `peersound_${peerId}`;
      let sobj = document.getElementById(id);
      if (sobj) {
        // todo: stop timer, start new timer
        sobj.pause();
        sobj.setAttribute('src', soundFile);
        sobj.currentTime = 0;
        sobj.play();
      } else {
        // todo: start new timer
        sobj = document.createElement('audio');
        sobj.setAttribute('id', id);
        sobj.setAttribute('src', soundFile);
        sobj.setAttribute('volume', '.5');
        sobj.setAttribute('style', 'width:0px;height:0px;display:none;');
        sobj.currentTime = 0;
        document.body.appendChild(sobj);
        sobj.play();
      }
    }
    sounds[peerId].push(soundObj);
    update(state, 'sounds');
  }

  return function SoundReactions() {
    let [isSound, sound] = useAction(actions.SOUND);
    if (isSound) {
      sendPeerEvent(swarm, 'sound', sound);
      playSound(sound, swarm.myPeerId);
    }
  };
}
