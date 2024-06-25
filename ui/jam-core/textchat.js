import {useAction, useOn, useRootState} from '../lib/state-tree';
import {sendPeerEvent, sendEventToOnePeer} from '../lib/swarm';
import {actions} from './state';

function TextChat({swarm}) {
  const state = useRootState();

  useOn(swarm.peerEvent, 'text-chat', (peerId, payload) => {
    if(payload) showTextChat(peerId, payload);
  });

  function incrementUnread(roomId) {
    let n = Math.floor(sessionStorage.getItem(`${roomId}.textchat.unread`) ?? 0) + 1;
    sessionStorage.setItem(`${roomId}.textchat.unread`, n);
  }

  function showTextChat(peerId, payload) {
    let {roomId} = state;
    let textchat = payload.t;
    let isdm = payload.d;
    let todm = payload.p;
    let bufferSize = sessionStorage.getItem(`textchat.bufferSize`) || 50;
    let textchats = JSON.parse(sessionStorage.getItem(`${roomId}.textchat`) || '[]');
    let lastline = textchats.slice(-1);
    if ((lastline.length == 0) || (lastline[0].length != 2) || (lastline[0][0] != peerId) || (lastline[0][1] != textchat)) {
        textchats.push([peerId, textchat, isdm, todm]);
        textchats = textchats.slice(-1 * bufferSize);
        sessionStorage.setItem(`${roomId}.textchat`, JSON.stringify(textchats));
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
      let myId = JSON.parse(localStorage.getItem('identities'))._default.publicKey;
      if (peerId && peerId != '0') {
        sendEventToOnePeer(swarm, peerId, 'text-chat', {d:true,t:textchat,p:peerId});
        sendEventToOnePeer(swarm, myId, 'text-chat', {d:true,t:textchat,p:peerId});
      } else {
        sendPeerEvent(swarm, 'text-chat', {d:false,t:textchat});
      }
    }
  };

}

export {TextChat};