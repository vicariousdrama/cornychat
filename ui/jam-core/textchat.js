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
    let {textchats} = state;
    if (!textchats) textchats = [];
    let lastline = textchats.slice(-1);
    if ((lastline[0] != peerId) || (lastline[1] != textchat)) {
        textchats.push([peerId, textchat]);
    }
    state.textchats = textchats.slice(-1 * 50);       // 50 is our buffer size
    update(state, 'textchats');
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