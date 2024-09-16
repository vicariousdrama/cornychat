import {useAction, useOn, useRootState} from '../lib/state-tree';
import {sendPeerEvent, sendEventToOnePeer} from '../lib/swarm';
import {actions} from './state';
import {sendLiveChat} from '../nostr/nostr';

function TextChat({swarm}) {
  const state = useRootState();
  const ACTION = 'text-chat';

  useOn(swarm.peerEvent, ACTION, (peerId, payload) => {
    if(payload) {
      (async () => {
        await showTextChat(peerId, payload);
      })();
    }
  });

  function incrementUnread(roomId) {
    let n = Math.floor(sessionStorage.getItem(`${roomId}.textchat.unread`) ?? 0) + 1;
    sessionStorage.setItem(`${roomId}.textchat.unread`, n);
  }

  async function showTextChat(peerId, payload) {
    let {roomId} = state;
    let textchat = decodeURIComponent(payload.t);
    let isdm = payload.d;
    let todm = payload.p;
    let nostrEventId = payload.n;
    if (isdm) {
      textchat = await decryptFromPeerId(peerId, textchat);
      textchat = decodeURIComponent(textchat);
    }
    let bufferSize = localStorage.getItem(`textchat.bufferSize`) || 50;
    let textchats = JSON.parse(localStorage.getItem(`${roomId}.textchat`) || '[]');
    let lastline = textchats.slice(-1);
    let textTime = Math.floor(Date.now() / 1000); // time by second is now added to the end and can be descriminator
    let okToAdd = true;
    if (lastline.length > 0 && lastline[0].length > 1) {
      let samepeer = (lastline[0][0] == peerId);
      let sametext = (lastline[0][1] == textchat);
      if (samepeer && sametext) {
        if (lastline[0].length > 4) {
          let sametime = (lastline[0][4] == textTime); // same person, text and time? ignore it.
          if (sametime) okToAdd = false;
        } else {
          okToAdd = false; // no time, but same person and text? ignore it.
        }
      }
    }

    if (okToAdd) {
      textchats.push([peerId, textchat, isdm, todm, textTime, nostrEventId]);
      textchats = textchats.slice(-1 * bufferSize);
      localStorage.setItem(`${roomId}.textchat`, JSON.stringify(textchats));
      let okToIncrement = true;
      if (textchat.startsWith("*has entered the chat!*")) okToIncrement = false;
      if (textchat.startsWith("/chatad")) okToIncrement = false;
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

  async function decryptFromPeerId(peerId, textchat) {
    try {
      if (!textchat.startsWith('📩')) return decodeURIComponent(textchat);
      let plaintext = '';
      let decoder = new TextDecoder();
      let jwkobj = JSON.parse(window.atob(localStorage.getItem('dmPrivkey')));
      let privkey = await window.crypto.subtle.importKey("jwk", jwkobj, {name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: "SHA-256"}, true, ["decrypt"]);
      let encryptedParts = [];
      let t = textchat.replaceAll('📩','');
      while (t.length > 0) {
        let p = t.slice(0,512); // always 512 when decrypting as encrypted is 256 * 2 for hexadecimal
        encryptedParts.push(p);
        t = t.slice(512);
      }
      for (let hex of encryptedParts) {
        let pairs = hex.match(/[\dA-F]{2}/gi);
        let i = pairs.map(function(s) {return parseInt(s,16);});
        var a = new Uint8Array(i);
        let b = a.buffer;
        let decrypted = await window.crypto.subtle.decrypt({name: "RSA-OAEP"}, privkey, b);
        let decoded = decoder.decode(decrypted);
        plaintext = plaintext + decoded;
      }
      return `🔓${decodeURIComponent(plaintext)}`;
    } catch(error) {
      console.log(`error in decryptFromPeerId: ${error}`)
      return `⚠️${textchat}`;
    }
  }

  async function encryptToPeerId(peerId, textchat) {
    try {
      let peerObj = sessionStorage.getItem(peerId);
      if (!peerObj) return '';
      peerObj = JSON.parse(peerObj);
      if (!peerObj.dmPubkey) return '';
      let jwkobj = JSON.parse(window.atob(peerObj.dmPubkey));
      let pubkey = await window.crypto.subtle.importKey("jwk", jwkobj, {name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: "SHA-256"}, true, ["encrypt"]);
      let encoder = new TextEncoder();
      let data = encoder.encode(textchat);
      const encrypted = await window.crypto.subtle.encrypt({name: "RSA-OAEP"}, pubkey, data);
      const hex = [...new Uint8Array(encrypted)].map(x => x.toString(16).padStart(2, '0')).join('');
      return `📩${hex}`;
    } catch(error) {
      console.log(`error in encryptToPeerId: ${error}`)
      return '';
    }
  }

  return function TextChat() {
    let {roomId} = state;
    let [isTextChat, payload] = useAction(actions.TEXT_CHAT);
    if (isTextChat) {
      // The payload can either be just the text string to send to everyone, or it can potentially be targetting a single peer
      let textchat = payload.textchat;
      let peerId = payload.peerId;
      if (!textchat) textchat = payload;
      if (textchat.length == 0) return;
      let myId = JSON.parse(localStorage.getItem('identities'))._default.publicKey;
      if (peerId && peerId != '0') {
        // peer to peer can optionally (by default) be encrypted so only the recipient and sender can read
        (async () => {
          let fulltext = textchat;
          let toPeer = '';
          let toMe = '';
          if ((localStorage.getItem('textchat.encryptPM') ?? 'true') == 'true') {
            let maxsize = 100; // must be less than 192. rsa-oaep will end up transforming and padded to 256. 
            while(textchat.length > 0) {
              let partialtext = textchat.slice(0,maxsize);
              let encPeerId = await encryptToPeerId(peerId, partialtext);
              let encMyId = await encryptToPeerId(myId, partialtext);
              if (encPeerId.length == 0 || encMyId.length == 0) {
                // failure to encrypt, revert to sending plain
                toPeer = `⚠️${fulltext}`;
                toMe = `⚠️${fulltext}`;
                textchat = '';
              } else {
                // concatenate encrypted portions
                toPeer = toPeer + encPeerId;
                toMe = toMe + encMyId;
              }
              textchat = textchat.slice(maxsize);
            }
          } else {
            toPeer = fulltext;
            toMe = fulltext;
          }
          sendEventToOnePeer(swarm, peerId, ACTION, {d:true,t:toPeer,p:peerId});
          sendEventToOnePeer(swarm, myId, ACTION, {d:true,t:toMe,p:peerId});
        })();
      } else {
        (async () => {
          let isok = false;
          let nostrEventId = undefined;
          if (window.nostr && (localStorage.getItem('textchat.tonostr') || 'false') == 'true') {
            let atagkey = `${roomId}.atag`;
            let roomATag = sessionStorage.getItem(atagkey) || '';
            if (roomATag.length > 0) {
              [isok, nostrEventId] = await sendLiveChat(roomATag, textchat);
              if (!isok) nostrEventId = undefined;
            }
          }
          sendPeerEvent(swarm, ACTION, {d:false,t:encodeURIComponent(textchat),n:nostrEventId});
        })();
      }
    }
  };

}

export {TextChat};