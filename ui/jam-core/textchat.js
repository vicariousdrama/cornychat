import {update} from 'minimal-state';
import {useAction, useOn, useRootState} from '../lib/state-tree';
import {sendPeerEvent, sendEventToOnePeer} from '../lib/swarm';
import {actions} from './state';

function TextChat({swarm}) {
  const state = useRootState();

  useOn(swarm.peerEvent, 'text-chat', (peerId, payload) => {
    if(payload) showTextChat(peerId, payload);
  });

  function incrementUnread(roomId) {
    let bufferSize = localStorage.getItem(`textchat.bufferSize`) || 50;
    let n = Math.floor(sessionStorage.getItem(`${roomId}.textchat.unread`) ?? 0) + 1;
    sessionStorage.setItem(`${roomId}.textchat.unread`, n);
  }

  function showTextChat(peerId, payload) {
    let textchat = payload.t;
    let isdm = payload.d;
    let bufferSize = localStorage.getItem(`textchat.bufferSize`) || 50;
    let {roomId, textchats} = state;
    if (!textchats) textchats = [];
    let lastline = textchats.slice(-1);
    if ((lastline.length == 0) || (lastline[0].length != 2) || (lastline[0][0] != peerId) || (lastline[0][1] != textchat)) {
        textchats.push([peerId, textchat, isdm]);
        state.textchats = textchats.slice(-1 * bufferSize);
        update(state, 'textchats');
        let okToIncrement = true;
        if (textchat.startsWith("*has entered the chat!*")) okToIncrement = false;
        if (handleSessionCommand("srfm",peerId,roomId,textchat)) okToIncrement = false;
        if (okToIncrement) incrementUnread(roomId);
    }
  }

  function handleSessionCommand(cmd, peerId, roomId, textchat) {
    let k = `/${cmd}`;
    if (textchat && textchat.startsWith(k)) {
      sessionStorage.setItem(`${roomId}.${cmd}`, (textchat.split(k)[1]).trim());
      sessionStorage.setItem(`${roomId}.${cmd}.time`, Math.floor(Date.now()/1000));
      sessionStorage.setItem(`${roomId}.${cmd}.peer`, peerId);
      return true;
    }
    return false;
  }

  return function TextChat() {
    let [isTextChat, payload] = useAction(actions.TEXT_CHAT);
    if (isTextChat) {
      // The payload can either be just the text string to send to everyone, or it can potentially be targetting a single peer
      let textchat = payload.textchat;
      let peerId = payload.peerId;
      if (!textchat) textchat = payload;
      if (peerId && peerId != '0') {
        let myId = JSON.parse(localStorage.getItem('identities'))._default.publicKey;
        sendEventToOnePeer(swarm, peerId, 'text-chat', {d:true,t:textchat});
        sendEventToOnePeer(swarm, myId, 'text-chat', {d:true,t:textchat});
      } else {
        sendPeerEvent(swarm, 'text-chat', {d:false,t:textchat});
      }
    }
  };

}

export {TextChat};