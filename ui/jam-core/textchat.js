import {update} from 'minimal-state';
import {useAction, useOn, useRootState} from '../lib/state-tree';
import {sendPeerEvent} from '../lib/swarm';
import {actions} from './state';

function TextChat({swarm}) {
  const state = useRootState();

  useOn(swarm.peerEvent, 'text-chat', (peerId, textchat) => {
    if(textchat) showTextChat(peerId, textchat);
  });

  function showTextChat(peerId, textchat) {
    let bufferSize = 50;
    let {roomId, textchats} = state;
    if (!textchats) textchats = [];
    let lastline = textchats.slice(-1);
    if ((lastline.length == 0) || (lastline[0].length != 2) || (lastline[0][0] != peerId) || (lastline[0][1] != textchat)) {
        textchats.push([peerId, textchat]);
        state.textchats = textchats.slice(-1 * bufferSize);
        update(state, 'textchats');

        let n = Math.floor(sessionStorage.getItem(`${roomId}.textchat.unread`) ?? 0) + 1;
        if (n > bufferSize) n = bufferSize;
        if (n > textchats.length) n = textchats.length;
        sessionStorage.setItem(`${roomId}.textchat.unread`, n);
    }
  }

  return function TextChat() {
    let [isTextChat, textchat] = useAction(actions.TEXT_CHAT);
    if (isTextChat) {
      sendPeerEvent(swarm, 'text-chat', textchat);
      //showTextChat(swarm.myPeerId, textchat);
    }
  };

}

export {TextChat};