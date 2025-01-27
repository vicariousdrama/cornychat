import {nip19, validateEvent, verifySignature} from 'nostr-tools';
import {RelayPool} from 'nostr-relaypool';
import {nanoid} from 'nanoid';
import crypto from 'crypto-js';
import {bech32} from 'bech32';
import {Buffer} from 'buffer';
import { addMissingEmojiTags, buildKnownEmojiTags } from './emojiText';

const poolOptions = {autoReconnect:true}
function unique(arr) {
  return [...new Set(arr)];
}
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function getDefaultOutboxRelays() {
  return normalizeRelays(window.jamConfig.relaysGeneral);
}

function getCachedOutboxRelaysByPubkey(pubkey) {
  if(window.DEBUG) console.log('in getCachedOutboxRelaybyPubkey for ', pubkey);
  const npub = nip19.npubEncode(pubkey);
  return normalizeRelays(getCachedOutboxRelaysByNpub(npub));
}
function getCachedOutboxRelaysByNpub(npub) {
  if(window.DEBUG) console.log('in getCachedOutboxRelaysByNpub for ', npub);
  let userCache = {}
  let k = `${npub}.relays`;
  let s = sessionStorage.getItem(k);
  if (s) userCache = JSON.parse(s);
  const outboxRelays = (userCache && userCache?.outboxRelays) ? userCache.outboxRelays : [];  
  if(window.DEBUG) console.log('outboxRelays:', outboxRelays);
  return outboxRelays;
}

export async function getOutboxRelays(pubkey) {
  if(window.DEBUG) console.log('in getOutboxRelays for pubkey: ', pubkey);
  return new Promise(async (res, rej) => {
    if (pubkey == undefined) {
      res([]);
      return;
    }
    const localpool = new RelayPool(undefined,poolOptions);
    try {
      const userRelays = getCachedOutboxRelaysByPubkey(pubkey);
      const defaultRelays = getDefaultOutboxRelays();
      const relaysToUse = unique([...userRelays, ...defaultRelays]);
      const filter = [{kinds: [10002], authors: [pubkey]}];
      let events = [];
      setTimeout(() => {
        localpool.close();
        // Find newest
        let fd = 0;
        let fi = -1;
        for(let i = 0; i < events.length; i ++) {
          if (events[i].created_at > fd) {
            fd = events[i].created_at;
            fi = i;
          }
        }
        if (fi == -1) {
          res([]);
          return;
        }
        const newestEvent = events[fi];
        const tagList = newestEvent.tags;
        let outboxRelays = [];
        for (let tag of tagList) {
          if (tag.length < 2) continue;
          if (tag[0] != 'r') continue;
          if ((tag.length == 2) || (tag[2] == 'write')) {
            outboxRelays.push(tag[1])
          }
        }
        //console.log('getOutboxRelays: ', outboxRelays);
        res(outboxRelays);
      }, 1400);

      localpool.subscribe(
        filter,
        relaysToUse,
        (event, onEose, url) => {
          events.push(event);
        },
        undefined,
        undefined,
        {
          unsubscribeOnEose: true,
          allowDuplicateEvents: false,
          allowOlderEvents: false,
        }
      );
    } catch (error) {
      console.log('There was an error while fetching outbox relay list: ', error);
      localpool.close();
      rej(undefined);
    }
  });  
}

async function createDMKeys() {
  const { publicKey, privateKey } = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048, // can be 1024, 2048, or 4096
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
      hash: "SHA-256" // can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
    },
    true, // whether the key is extractable (i.e. can be used in exportKey)
    ["encrypt", "decrypt"] // can be any combination of "encrypt" and "decrypt"
  );
  const exportedPubkey = await window.crypto.subtle.exportKey("jwk", publicKey);
  const exportedPubkeyString = window.btoa(JSON.stringify(exportedPubkey));
  const exportedPrivkey = await window.crypto.subtle.exportKey("jwk", privateKey);
  const exportedPrivkeyString = window.btoa(JSON.stringify(exportedPrivkey));
  localStorage.setItem('dmPubkey', exportedPubkeyString);
  localStorage.setItem('dmPrivkey', exportedPrivkeyString);
}
export async function getDMPrivkey() {
  if ((localStorage.getItem("dmPrivkey") || '') == '' || (localStorage.getItem("dmPubkey") || '') == '') {
    await createDMKeys();
  }
  return localStorage.getItem("dmPrivkey");
}
export async function getDMPubkey() {
  if ((localStorage.getItem("dmPubkey") || '') == '' || (localStorage.getItem("dmPrivkey") || '') == '') {
    await createDMKeys();
  }
  return localStorage.getItem("dmPubkey");
}

export async function getPublicKey() {

  let pubkey = sessionStorage.getItem("pubkey");
  if (!pubkey && window.nostr) {
    pubkey = await window.nostr.getPublicKey();
    sessionStorage.setItem("pubkey", pubkey);
  }
  return pubkey;
}

export async function signInExtension(
  state,
  setProps,
  updateInfo,
  enterRoom
) {
  if(window.DEBUG) console.log("in signInExtension");
  try {
    if (!window.nostr) {
      throw new Error('A nostr extension is not available');
    }
    let id = state.id;
    let roomId = state.roomId;
    let pubkey = await getPublicKey();
    let created_at = Math.floor(Date.now()/1000);
    let kind = 1;
    let tags = [];
    let myId = state.myId;
    let loginEvent = {created_at: created_at, pubkey: pubkey, kind: kind, tags: tags, content: myId};
    let signedLogin = await window.nostr.signEvent(loginEvent); // not published to relays, parsed and set to identity
    let npub = nip19.npubEncode(pubkey);
    let dmPubkey = await getDMPubkey();
    if(window.DEBUG) console.log(dmPubkey);
    let identities = [{type: 'nostr', id: npub, loginTime: created_at, loginId: signedLogin.id, loginSig: signedLogin.sig}];
    let metadata = await getUserMetadata(pubkey, id);
    setProps({userInteracted: true});
    if (!metadata) {
      await updateInfo({identities, dmPubkey});
    } else {
      let name = metadata.display_name || metadata.name;
      let avatar = metadata.picture;
      await updateInfo({
        name,
        identities,
        avatar,
        dmPubkey,
      });
    }
    await enterRoom(roomId);
  } catch (error) {
    console.log('There was an error logging in with extension: ', error);
    return undefined;
  }
}

export async function getUserEventsByKind(pubkey, kind, timeSince) {
  if(window.DEBUG) console.log("in getUserEventsByKind for pubkey ", pubkey, ", kind ", kind);
  return new Promise((res, rej) => {
    if (pubkey == undefined || kind == undefined) {
      res([]);
      return;
    }
    const localpool = new RelayPool(undefined,poolOptions);
    try {
      const userRelays = getCachedOutboxRelaysByPubkey(pubkey);
      const defaultRelays = getDefaultOutboxRelays();
      const relaysToUse = unique([...userRelays, ...defaultRelays]);
      const since = timeSince;
      const filter = [{kinds: [kind], authors: [pubkey], since: since, limit: 50}];
      let userEvents = [];
      setTimeout(() => {
        localpool.close();
        let retids = [];
        for (let userEvent of userEvents) {
          retids.push(userEvent.id);
        }
        let sesEvents = sessionStorage.getItem(`${pubkey}.kind${kind}events`);
        if (sesEvents != undefined) {
          sesEvents = JSON.parse(sesEvents);
          for (let sessionEvent of sesEvents) {
            if (sessionEvent.created_at > timeSince && !retids.includes(sessionEvent.id)) {
              userEvents.push(sessionEvent);
            }
          }
        }
        // sorts as chronological order
        userEvents.sort((a,b) => (a.created_at > b.created_at) ? 1 : ((b.created_at > a.created_at) ? -1 : 0));
        sessionStorage.setItem(`${pubkey}.kind${kind}events`, JSON.stringify(userEvents));
        sessionStorage.setItem(`${pubkey}.kind${kind}events.retrieveTime`, Math.floor(Date.now() / 1000));
        res(userEvents);
      }, 1400);
      let options = {unsubscribeOnEose: true, allowDuplicateEvents: false};
      
      localpool.subscribe(
        filter,
        relaysToUse,
        (event, afterEose, url) => {
          userEvents.push(event)
        },
        undefined,
        undefined,
        options
      );
    } catch (error) {
      console.log('There was an error when getting user events by kind: ', error);
      localpool.close();
      rej(undefined);
    }
  });
}

export async function getUserEventById(pubkey, id) {
  if(window.DEBUG) console.log("in getUserEventById for pubkey ", pubkey, ", id", id);
  return new Promise((res, rej) => {
    const localpool = new RelayPool(undefined,poolOptions);
    try {
      const userRelays = getCachedOutboxRelaysByPubkey(pubkey);
      const defaultRelays = getDefaultOutboxRelays();
      const relaysToUse = unique([...userRelays, ...defaultRelays]);
      const filter = [{kinds: [1], authors: [pubkey], ids: [id]}];
      let userEvents = [];
      const timeoutRelays = setTimeout(() => {
        if (userEvents.length === 0) {
          localpool.close();
          res(undefined);
          if (window.DEBUG) console.log('Nostr relays did not return any events');
        }
      }, 2700);

      localpool.subscribe(
        filter,
        relaysToUse,
        (event, afterEose, url) => {
          clearTimeout(timeoutRelays);
          userEvents.push(event);
          localpool.close();
          res(event);
        },
        undefined,
        undefined,
        {unsubscribeOnEose: true}
      );
    } catch (error) {
      console.log('There was an error when getting user events by id: ', error);
      localpool.close();
      rej(undefined);
    }
  });
}

export async function getUserMetadata(pubkey, id) {
  if(window.DEBUG) console.log("in getUserMetadata for pubkey", pubkey, ", id", id);
  return new Promise((res, rej) => {
    const localpool = new RelayPool(undefined,poolOptions);
    try {
      const userRelays = getCachedOutboxRelaysByPubkey(pubkey);
      const defaultRelays = getDefaultOutboxRelays();
      const relaysToUse = unique([...userRelays, ...defaultRelays]);
      const filter = [{kinds: [0], authors: [pubkey], limit: 20}];
      //check if i can use a variable set to true or false
      let userEvents = [];
      const timeoutRelays = setTimeout(() => {
        if (userEvents.length === 0) {
          if(window.DEBUG) console.log('Nostr relays did not return any events');
          localpool.close();
          res(undefined);
        } else {
          let userMetadata = {}
          let userTags = []
          let userDate = 0;
          for (let ue of userEvents) {
            try {
              if (ue.created_at > userDate) {
                userMetadata = JSON.parse(ue.content);
                userTags = ue.tags;
                userDate = ue.created_at;
              }
            } finally {}
          }
          let username = userMetadata?.display_name || userMetadata?.name ||  '';
          const userInfo = {
            name: username,
            id: id,
            picture: userMetadata?.picture,
            npub: npub,
            about: userMetadata?.about,
            nip05: userMetadata?.nip05,
            lud16: userMetadata?.lud16,
            lud06: userMetadata?.lud06,
            banner: userMetadata?.banner,
          }
          let savingToSession = (async () => {
            let obj = {}
            obj.iFollow = false;
            let c = sessionStorage.getItem(npub);
            if(c) obj.iFollow = JSON.parse(c).iFollow ?? false;
            obj.about = userInfo.about;
            obj.lightningAddress = userInfo.lud16 ?? userInfo.lud06;
            let isNip05Valid = await verifyNip05(userInfo.nip05, npub);
            obj.nip05 = {isValid: isNip05Valid, nip05Address: userInfo.nip05};
            obj.banner = userInfo.banner;
            const badgeconfigs = await getCBadgeConfigsForPubkey(pubkey);
            obj.badgeConfigs = badgeconfigs;
            const userMetadataCache = JSON.stringify(obj);
            sessionStorage.setItem(npub, userMetadataCache);
            sessionStorage.setItem(`${npub}.kind0content`, JSON.stringify(userMetadata));
            sessionStorage.setItem(`${npub}.kind0tags`, JSON.stringify(userTags));
            return userMetadataCache;
          })();
          if(!!false) console.log(savingToSession);

          localpool.close();
          res(userInfo);
        }
      }, 1400);
      const npub = nip19.npubEncode(pubkey);
      localpool.subscribe(
        filter,
        relaysToUse,
        (event, afterEose, url) => {
          userEvents.push(event);
        },
        undefined,
        undefined,
        {unsubscribeOnEose: true}
      );
    } catch (error) {
      console.log('There was an error when getting user metadata: ', error);
      localpool.close();
      rej(undefined);
    }
  });
}

let eventZapReceipts = {}
export async function getZapReceipts(eventId) {
  return new Promise(async (res, rej) => {
    if (eventId == undefined) {
      res([]);
      return;
    }
    const localpool = new RelayPool(undefined,poolOptions);
    try {
      let userRelays = [];
      if (window.nostr) {
        const myPubkey = await getPublicKey();
        userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
      }
      const defaultRelays = getDefaultOutboxRelays();
      const relaysToUse = unique([...userRelays, ...defaultRelays]);
      const filter = [{kinds: [9735], "#e": [eventId]}];
      let userEvents = [];
      setTimeout(() => {
        if (eventZapReceipts.hasOwnProperty(eventId)) {
          let zrs = [];
          for (let ue of userEvents) {
            zrs = eventZapReceipts[eventId];
            let f = false;
            for (let zr of zrs) {
              if (zr.id == ue.id) f = true;
            }
            if (!f) {
              eventZapReceipts[eventId].push(ue);
            }
          }
        } else {
          eventZapReceipts[eventId] = userEvents;
        }
        localpool.close();
        res(eventZapReceipts[eventId]);
      }, 2700);
      let options = {unsubscribeOnEose: true, allowDuplicateEvents: false};
      
      localpool.subscribe(
        filter,
        relaysToUse,
        (event, afterEose, url) => {
          userEvents.push(event)
        },
        undefined,
        undefined,
        options
      );
    } catch (error) {
      console.log('There was an error when getting zap receipts for event: ', error);
      localpool.close();
      rej(undefined);
    }
  });  
}

export async function sendZaps(npubToZap, comment, amount, lud16override) {
  return zapEvent(npubToZap, undefined, comment, amount, lud16override);
}
export async function zapEvent(npubToZap, event, comment, amount, lud16override) {
  if(window.DEBUG) console.log("in sendZaps");
  try {
    if (npubToZap == undefined) return [undefined, "logic error: npubToZap is not set"];

    // Validate and set sats
    let satsAmount = parseInt(amount);
    if (!(satsAmount > 0)) {
      throw new Error('Sats amount must be higher than 0');
    }
    let msatsAmount = satsAmount * 1000;

    const pubkeyToZap = npubToZap.startsWith("fakenpub") ? undefined : nip19.decode(npubToZap).data;
    const id = null;

    // Determine lightning address to use
    let lightningAddress = lud16override;
    if (!lightningAddress) {
      const cachedUserMetadata = JSON.parse(sessionStorage.getItem(npubToZap));
      if (cachedUserMetadata?.lightningAddress) {
        lightningAddress = cachedUserMetadata.lightningAddress;
      } else {
        // Get metadata to lookup lightning address for users npub
        const metadata = await getUserMetadata(pubkeyToZap, id);
        if (!metadata) {
          throw new Error('Unable to get metadata from relays for this user to identify lightning address.');
        }
        if (metadata.lud06 !== '') lightningAddress = metadata.lud06;
        if (metadata.lud16 !== '') lightningAddress = metadata.lud16;  
      }
    }

    if (!lightningAddress || lightningAddress.split("@").length != 2) {
      throw new Error('Lightning address not found for this npub or provided to zapEvent call.');
    }

    const LnService = await getLNService(lightningAddress);
    if (LnService == undefined) {
      let msg = 'Error encountered communicating with recipients lightning custodian';
      throw new Error(msg);
    }

    if (LnService.hasOwnProperty('error')) {
      throw new Error(LnService.reason);
    }
    if (pubkeyToZap) {
      if(window.DEBUG) console.log("about to call makeZapRequest");
      const signedEvent = await makeZapRequest(
        comment,
        pubkeyToZap,
        event,
        msatsAmount
      );
      // happens if they cancel signing the zap request
      if (!signedEvent[0]) {
        if(window.DEBUG) console.log("about to call getLNInvoice as direct lightning");
        const lnInvoice = await getLNInvoice(
          null,
          lightningAddress,
          LnService,
          msatsAmount,
          comment
        );
        if (window.DEBUG) console.log('ui/nostr/nostr.js', lnInvoice);
        return [true, lnInvoice.pr];
      }
      // zap request was signed...
      if(window.DEBUG) console.log("about to call getLNInvoice for zap");
      const lnInvoice = await getLNInvoice(
        signedEvent[1],
        lightningAddress,
        LnService,
        msatsAmount,
        comment
      );
      return [true, lnInvoice.pr];
    } else {
      // No pubkey, so no zap. Only lightning (usecase: fakenpub handler for private rooms)
      if(window.DEBUG) console.log("about to call getLNInvoice as direct lightning");
      const lnInvoice = await getLNInvoice(
        null,
        lightningAddress,
        LnService,
        msatsAmount,
        comment
      );
      return [true, lnInvoice.pr];
    }
  } catch (error) {
    //console.log('There was an error sending zaps: ', error);
    return [undefined, error];
  }
}

export async function openLNExtension(LNInvoice) {
  if(window.DEBUG) console.log("in openLNExtension");
  try {
    if (!window.webln) return undefined;
    await window.webln.enable();
    const result = await window.webln.sendPayment(LNInvoice);
    return result;
  } catch (error) {
    return undefined;
  }
}

async function saveFollowList(myFollowList) {
  // kind 3 is deprecated, now using kind 30000 as d=cornychat-follows
  if(window.DEBUG) console.log("in saveFollowList");
  if (!window.nostr) return false;
  const dTag = 'cornychat-follows';
  const nameTag = 'Corny Chat Follows';
  const kind = 30000;
  const tags = [['d',dTag],['name',nameTag],...myFollowList];
  const event = {
    id: null,
    pubkey: null,
    created_at: Math.floor(Date.now() / 1000),
    kind: kind,
    tags: tags,
    content: '',
    sig: null,
  };
  let r = await signAndSendEvent(event);
  return r[0];
}

export async function loadFollowList() {
  // kind 3 is deprecated, now using kind 30000 as d=cornychat-follows
  if(window.DEBUG) console.log("in loadFollowList");
  return new Promise(async (res, rej) => {
    // return from local cache if it has not aged out
    const currentTime = Math.floor(Date.now() / 1000);
    const timeToExpire = 3600; // 1 hour
    const myFollowListRetrieved = sessionStorage.getItem('myFollowList.retrievedTime');
    const myFollowListExpired = (myFollowListRetrieved == undefined || ((myFollowListRetrieved + timeToExpire) < currentTime));
    let myFollowList = sessionStorage.getItem('myFollowList');
    if (!myFollowListExpired && myFollowList != undefined) {
      try {
        myFollowList = JSON.parse(sessionStorage.getItem('myFollowList'));
        res(myFollowList);
        return;
      } catch (e) {
        rej(e);
        return;
      } finally {}
    }
    // we will be building
    const localpool = new RelayPool(undefined,poolOptions);
    try {
      const kind = 30000;
      const dTag = 'cornychat-follows';
      const defaultRelays = getDefaultOutboxRelays();
      const myPubkey = await getPublicKey();
      const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
      let myOutboxRelays = [];
      if (userRelays?.length == 0) {
        const myNpub = nip19.npubEncode(myPubkey);
        myOutboxRelays = await getOutboxRelays(myPubkey);
        updateCacheOutboxRelays(myOutboxRelays, myNpub);
      }
      const relaysToUse = unique([...myOutboxRelays, ...userRelays, ...defaultRelays]);
      const filter = [{kinds: [kind], authors: [myPubkey]}];
      filter[0]['#d'] = dTag;
      let events = [];

      setTimeout(() => {
        localpool.close();
        // Find newest
        let fd = 0;
        let fi = -1;
        for(let i = 0; i < events.length; i ++) {
          if (events[i].created_at > fd) {
            fd = events[i].created_at;
            fi = i;
          }
        }
        if (fi == -1) {
          res([]);
          return;
        }
        // populate follow list from tags of newest
        const newestEvent = events[fi];
        const followList = newestEvent.tags;
        sessionStorage.setItem('myFollowList.retrievedTime', currentTime);
        sessionStorage.setItem('myFollowList', JSON.stringify(followList));
        res(followList);
      }, 2700);

      localpool.subscribe(
        filter,
        relaysToUse,
        (event, onEose, url) => {
          events.push(event);
        },
        undefined,
        undefined,
        {
          unsubscribeOnEose: true,
          allowDuplicateEvents: false,
          allowOlderEvents: false,
        }
      );
    } catch (error) {
      console.log('There was an error while fetching follow list: ', error);
      localpool.close();
      rej(undefined);
    }
  });
}

export async function unFollowUser(npubToUnfollow,myFollowList) {
  if(window.DEBUG) console.log('in unFollowUser for ' + npubToUnfollow);
  if (!window.nostr) {
    return [null, 'A nostr extension is required to unfollow a user'];
  }
  const pubkeyToUnfollow = nip19.decode(npubToUnfollow).data;
  const indexToRemove = myFollowList.findIndex(childArray =>
    childArray.includes(pubkeyToUnfollow)
  );
  if (indexToRemove == -1) {
    // doesnt exist, our job is done here
    return [true];
  }
  // remove it
  myFollowList.splice(indexToRemove, 1);
  // save changes to follow list
  const isOK = await saveFollowList(myFollowList);
  updateCacheFollowing(false, npubToUnfollow, myFollowList);
  return [true];
}

export async function followUser(npubToFollow, myFollowList) {
  if(window.DEBUG) console.log('in followUser for ' + npubToFollow);
  if (!window.nostr) {
    return [null, 'A nostr extension is required to follow a user'];
  }
  const pubkeyToFollow = nip19.decode(npubToFollow).data;
  const indexOfPubkey = myFollowList.findIndex(childArray =>
    childArray.includes(pubkeyToFollow)
  );  
  if (indexOfPubkey != -1) {
    // already exists, our job is done here
    if(window.DEBUG) console.log('already following');
    return [true];
  }
  // add it
  myFollowList.push(['p', pubkeyToFollow]);
  const isOK = await saveFollowList(myFollowList);
  updateCacheFollowing(true, npubToFollow, myFollowList);
  return [true];
}

export async function followAllNpubsFromIds(inRoomPeerIds) {
  if(window.DEBUG) console.log("in followAllNpubsFromIds");
  if (!window.nostr) {
    alert('A nostr extension is required to follow users');
    return;
  }
  if (!inRoomPeerIds) {
    alert('Nobody to follow');
    return;
  }
  inRoomPeerIds = JSON.parse(inRoomPeerIds);
  let myFollowList = await loadFollowList();

  // tracking
  let numberOfAddedPubkeys = 0;
  let namesAdded = [];
  // iterate all peer ids, checking for pubkeys to add
  for (let peerId of inRoomPeerIds) {
    const peerValue = sessionStorage.getItem(peerId);
    if (peerValue == undefined) continue;
    const peerObj = JSON.parse(peerValue);
    const npub = getNpubFromInfo(peerObj);
    const name = peerObj.name ?? npub;
    if (npub == undefined) continue;
    const pubkey = nip19.decode(npub).data;
    let following = false;
    for (let tag of myFollowList) {
      if (tag.length < 2) continue;
      if (tag[0] != 'p') continue;
      if (tag[1] == pubkey) {
        following = true;
        break;
      }
    }
    if (!following) {
      myFollowList.push(['p', pubkey]);
      let userCache = {}
      let s = sessionStorage.getItem(npub);
      if (s) userCache = JSON.parse(s);
      userCache.iFollow = true;
      s = JSON.stringify(userCache);
      sessionStorage.setItem(npub, s);
      numberOfAddedPubkeys ++;
      namesAdded.push(name);
    }
  }

  if (numberOfAddedPubkeys > 0) {
    sessionStorage.setItem('myFollowList', JSON.stringify(myFollowList));
    const isOK = await saveFollowList(myFollowList);
    alert('Followed ' + numberOfAddedPubkeys + ' new nostr users\n\n- ' + namesAdded.join('\n- '));
  } else {
    alert('You are already following all nostr users in the room');
  }
}

export async function isNpubOK(userNpub) {
  if (userNpub == undefined) return true;
  const harmfulNpubs = [
    'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6',    // actively working against nostr developers
    'npub12262qa4uhw7u8gdwlgmntqtv7aye8vdcmvszkqwgs0zchel6mz7s6cgrkj',    // actively attacks other projects
  ]
  if (harmfulNpubs.contains(userNpub)) return false;
  return true;
}

export async function isDomainOK(domain) {
  if (domain == undefined) return false;
  const harmfulDomains = [
    'getalby.com',        // mega
    'nip05.social',       // mega
    'nostr.directory',    // mega
    'nostr-check.com',    // mega
    'nostrcheck.me',      // mega
    'nostrich.house',     // mega
    'nostrplebs.com',     // mega, non-reciprocal
    'primal.net',         // mega, nostr adjacent silo
    'stacker.news',       // mega, nostr adjacent silo
    'verified-nostr.com', // mega
    'zap.stream',         // non-reciprocal
    'zaps.lol',           // mega
    'zbd.gg'];            // mega, nostr adjacent silo
  if (harmfulDomains.includes(domain)) return false;
  return true;
}

export async function verifyNip05(nip05, userNpub) {
  if(window.DEBUG) console.log("in verifyNip05");
  if (!nip05) return false;
  if (nip05 !== '' && userNpub) {
    if (!isNpubOK(userNpub)) return false;
    const pubkey = nip19.decode(userNpub).data;
    const url = nip05.split('@');
    if (url.length != 2) return false;
    const domain = url[1];
    const name = url[0];
    if (!isDomainOK(domain)) return false;
    try {
      const data = await (
        await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`)
      ).json();

      let userNamePubkey = data.names[`${name}`];

      let isSamePubkey = pubkey === userNamePubkey;
      if (isSamePubkey) return true;
    } catch (error) {
      console.log('There was a problem fetching nip05. Error: ', error);
      return false;
    }
  }
  return false;
}

export function normalizeLightningAddress(address) {
  if (!address) return undefined;
  let isDecodedAddress = (address && address.includes('@'));
  if (isDecodedAddress) return address;
  let isLNUrl = address.toLowerCase().startsWith('lnurl');
  if (isLNUrl) {
    let decoded = bech32.decode(address, 2000);
    let buf = bech32.fromWords(decoded.words);
    let decodedLNurl = new TextDecoder().decode(Uint8Array.from(buf));
    if (decodedLNurl && decodedLNurl.includes('@')) return decodedLNurl; // username@domain identity
  }
  // not in proper address format
  return undefined;
}

export async function getLNService(address) {
  if(window.DEBUG) console.log("in getLNService for address", address);
  let address2 = normalizeLightningAddress(address);
  if (address2 == undefined) return address2;
  if (address2.split("@").length != 2) return undefined;
  let username = address2.split("@")[0];
  let domain = address2.split("@")[1];
  let url = `https://${domain}/.well-known/lnurlp/${username}`;
  try {
    let response = await fetch(url);
    let data = await(response);
    if (response.ok && response.status == 200) {
      let json = await data.json();
      if(!json?.hasOwnProperty('callback')) {
        return {error: true, reason: `Error: Response from Lightning Custodian at ${domain} does not include callback url`}
      }
      return json;
    }
    if (response.status == 404) {
      return {error: true, reason: `Error: Status code 404 communicating with Lightning Custodian at ${domain}. Does account ${username} exist?`}
    } else {
      console.log(`error in getLNService is unknown`, response);
      return {error: true, reason: `Error: Status code ${response.status} communicating with Lightning Custodian at ${domain}.`}      
    }
  } catch (e) {
    console.log('error in  getLNService:', e);
    return undefined;
  }
}

export async function getLNInvoice(zapEvent, lightningAddress, LNService, msatsAmount, comment) {
  if(window.DEBUG) console.log("in getLNInvoice");
  let hasPubkey = LNService.nostrPubkey;
  const dataBytes = Buffer.from(lightningAddress, 'utf-8');
  const lnurlEncoded = bech32.encode('lnurl', bech32.toWords(dataBytes));
  let baseUrl = `${LNService.callback}?amount=${msatsAmount}`;
  async function fetchInvoice(baseUrl) {
    const response = await fetch(baseUrl);
    const invoice = await response.json();
    return invoice;
  }
  if (hasPubkey) {
    baseUrl += `&nostr=${zapEvent}&lnurl=${lnurlEncoded}`;
    const data = await fetchInvoice(baseUrl);
    return data;
  } else {
    baseUrl += `&comment=${comment}`;
    const data = await fetchInvoice(baseUrl);
    return data;
  }
}

export async function makeZapRequest(content, receiver, event, msatsAmount) {
  if(window.DEBUG) console.log("in makeZapRequest");
  // TODO: relays for zap event should be those from the event
  let zapevent = {
    id: null,
    pubkey: null,
    created_at: Math.floor(Date.now() / 1000),
    kind: 9734,
    tags: [
      ['relays', ...jamConfig.relaysZapGoals],
      ['amount', `${msatsAmount}`],
    ],
    content: content,
    sig: null,
  };
  if (receiver != undefined) {
    zapevent.tags.push(['p',`${receiver}`]);
  }
  if (event?.id != undefined) {
    zapevent.tags.push(['e',`${event.id}`]);
  }

  if (window.nostr) {
    const EventSigned = await window.nostr.signEvent(zapevent); // not published to relays, encoded to send to lightning provider
    if (!EventSigned)
      return [null, 'There was an error with your nostr extension'];
    const eventSignedEncoded = encodeURI(JSON.stringify(EventSigned));
    return [true, eventSignedEncoded];
  }

  return [null, 'Unable to sign nostr zap request event without a nostr extension'];
}

function encryptPrivatekey(privateKey) {
  if(window.DEBUG) console.log("in encryptPrivateKey");
  const textToEncode = privateKey;
  const encryptionKey = nanoid();
  const cipherText = crypto.AES.encrypt(textToEncode, encryptionKey).toString();
  return {cipherText, encryptionKey};
}

function updateCacheFollowing(iFollow, npub, followList) {
  if(window.DEBUG) console.log("in updateCacheFollowing setting iFollow to ", iFollow, " for npub ", npub);
  let userCache = {}
  let s = sessionStorage.getItem(npub);
  if (s) userCache = JSON.parse(s);
  userCache.iFollow = iFollow;
  s = JSON.stringify(userCache);
  sessionStorage.setItem(npub, s);
  let newFollowingList = JSON.stringify(followList);
  sessionStorage.setItem('myFollowList', newFollowingList);
}

export function updateCacheOutboxRelays(outboxRelays, npub) {
  if(window.DEBUG) console.log("in updateCacheOutboxRelays");
  if (outboxRelays == undefined) return;
  if(window.DEBUG) console.log(typeof outboxRelays);
  let userCache = {}
  let k = `${npub}.relays`;
  let s = sessionStorage.getItem(k);
  if (s) userCache = JSON.parse(s);
  userCache.outboxRelays = outboxRelays;
  s = JSON.stringify(userCache);
  sessionStorage.setItem(k, s);
}

export const isValidNostr = (info) => {
  if(window.DEBUG) console.log("in isValidNostr");
  let r = false;
  if (!info) return r;
  try {
    let identityKey = info?.id;
    if (!info.identities) return r;
    for (let ident of info.identities) {
      if (!ident.type) continue;
      if (!ident.id) continue;
      if (!ident.loginTime) continue;
      if (!ident.loginId) continue;
      if (!ident.loginSig) continue;
      if (ident.type != 'nostr') continue;
      let n = ident.id || '';
      let c = ident.loginTime || 0;
      let i = ident.loginId || '';
      let s = ident.loginSig || '';
      let p = nip19.decode(n).data;
      let e = {id:i,pubkey:p,created_at:c,kind:1,tags:[],content:identityKey,sig:s};
      let u = validateEvent(e);
      if (!validateEvent(e)) return false;
      r = (u && verifySignature(e));
      if (!r) {
        e = {id:i,pubkey:p,created_at:c,kind:1,tags:[[]],content:identityKey,sig:s};
        u = validateEvent(e);
        r = (u && verifySignature(e));
      }
    }
  }
  catch(err) {
    console.log('error in isValidNostr',info,err);
  }
  return r;
}

function getLabelForKind(kind) {
  if(window.DEBUG) console.log("in getLabelForKind");
  switch(kind) {
    case 30388: return "Corny Chat Slide Set";
    case 31388: return "Corny Chat Link Set";
    case 32388: return "Corny Chat Room Favorites";
    case 33388: return "Corny Chat Playlist";
    default: return "Unlabeled Kind";
  }
}

export async function saveList(dTagValue, name, about, image, kind, theList) {
  if(window.DEBUG) console.log("in saveList for ", dTagValue, ", named ", name);
  let l = getLabelForKind(kind);
  let alt = l + ' with ' + theList.length + ' items';
  let iUrl = 0;
  let iCaption = 1;
  if ([31388].includes(kind)) {iUrl = 1; iCaption = 0;}
  let tags = [
    ["name", name],
    ["about", about],
    ["image", image],
    ["alt", alt],
    ["L", "com.cornychat"],
    ["l", l, "com.cornychat"],
    ["d", dTagValue],
  ];
  theList.map((obj, index) => {
    let u = obj[iUrl];
    let c = obj[iCaption];
    tags.push(["r", u, c]);
  })

  let event = {
    id: null,
    pubkey: null,
    created_at: Math.floor(Date.now() / 1000),
    kind: kind,
    tags: tags,
    content: "",
    sig: null,
  };
  let r = await signAndSendEvent(event);
  return r;
}

export async function loadList(kind, pubkey) {
  if(window.DEBUG) console.log("in loadList for kind ", kind);
  return new Promise(async(res, rej) => {
    const localpool = new RelayPool(undefined,poolOptions);
    try {
      let events = [];
      const defaultRelays = getDefaultOutboxRelays();
      const myPubkey = await getPublicKey();
      const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
      let myOutboxRelays = [];
      if (userRelays?.length == 0) {
        const myNpub = nip19.npubEncode(myPubkey);
        myOutboxRelays = await getOutboxRelays(myPubkey);
        if(window.DEBUG) console.log('myOutboxRelays from await call', myOutboxRelays);
        updateCacheOutboxRelays(myOutboxRelays, myNpub);
      }
      const relaysToUse = unique([...myOutboxRelays, ...userRelays, ...defaultRelays]);
      const timestamp = Math.floor(Date.now() / 1000);
      const filter = {kinds:[kind]}
      if (pubkey != undefined) {
        filter["authors"] = [pubkey];
      }
      const filters = [filter];
      setTimeout(() => {
        let validEvents = [];
        for (let event of events) {
          let foundLabel = false;
          let foundNamespace = false;
          for (let tag of event.tags) {
            if (tag.length > 1) {
              let k = tag[0];
              let v = tag[1];
              if (k == 'expiration') {
                try {
                  let expirationTime = parseInt(v);
                  if (expirationTime < timestamp) {
                    continue;
                  }
                } catch(error) { continue; }
              }
              if (k == 'L') {
                if (v == 'com.cornychat') {
                  foundNamespace = true;
                }
              }
              if (k == 'l') {
                if (v == getLabelForKind(kind)) {
                  foundLabel = true;
                }
              }
            }
          }
          if (!foundLabel) continue;
          if (!foundNamespace) continue;
          // if we got here, the event is valid
          validEvents.push(event);
        }
        localpool.close();
        res(validEvents);
      }, 3000);
      localpool.subscribe(
        filters,
        relaysToUse,
        (event, onEose, url) => { events.push(event); },
        undefined,
        undefined,
        { unsubscribeOnEose: true, allowDuplicateEvents: false, allowOlderEvents: false }
      );
    } catch (error) {
      console.log('There was an error when loading lists: ', error);
      localpool.close();
      rej(undefined);
    }
  });
}

export async function requestDeletionById(id) {
  if(window.DEBUG) console.log("in requestDeletionById");
  const event = {
    id: null,
    pubkey: null,
    created_at: Math.floor(Date.now() / 1000),
    kind: 5,
    tags: [["e",`${id}`]],
    content: '',
    sig: null,
  };
  let r = await signAndSendEvent(event);
  return r[0];  
}

export function makeLocalDate(timestamp) {
  const date = new Date(timestamp * 1000);
  var dateOptions = { weekday: 'long', month: 'long', day: 'numeric' }; 
  const humanDate = new Intl.DateTimeFormat('en-us',dateOptions).format(date);
  var timeOptions = { timeStyle: 'long'};
  const humanTimeL = new Intl.DateTimeFormat('en-us',timeOptions).format(date);
  const humanTime = humanTimeL.split(":",2).join(":") + humanTimeL.split(" ").slice(1).join(" ");
  return humanDate + ' at ' + humanTime;
}

export function getNpubFromInfo(info) {
  if (info == undefined) return undefined;
  if ((typeof info) == "string") info = JSON.parse(info);
  const hasIdentity = info?.hasOwnProperty('identities');
  if (!hasIdentity) return undefined;
  if (info.identities == undefined) return undefined;
  for (let ident of info.identities) {
    if (ident.type == undefined) continue;
    if (ident.type != 'nostr') continue;
    if (ident.id == undefined) continue;
    return ident.id;
  }
  return undefined;
}

export async function loadPetnames() {
  if(window.DEBUG) console.log('in loadPetnames');
  return new Promise(async(res, rej) => {
    if (!window.nostr) return(undefined);
    const localpool = new RelayPool(undefined,poolOptions);
    try {
      let events = [];
      if(Window.DEBUG) console.log('loadPetnames: getDefaultOutboxRelays');
      const defaultRelays = getDefaultOutboxRelays();
      if(Window.DEBUG) console.log('loadPetnames: getPublicKey');
      const myPubkey = await getPublicKey();
      if(Window.DEBUG) console.log('loadPetnames: outbox relays');
      const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
      let myOutboxRelays = [];
      if (userRelays?.length == 0) {
        const myNpub = nip19.npubEncode(myPubkey);
        myOutboxRelays = await getOutboxRelays(myPubkey);
        updateCacheOutboxRelays(myOutboxRelays, myNpub);
      }
      const relaysToUse = unique([...myOutboxRelays, ...userRelays, ...defaultRelays]);
      const timestamp = Math.floor(Date.now() / 1000);
      const filter = {kinds:[30382],authors: [myPubkey]}
      const filters = [filter];
      if(Window.DEBUG) console.log('loadPetnames: before setTimeout');
      setTimeout(() => {
        let promptDecrypting = (localStorage.getItem("petnames.allowdecryptinguntil") || 0) < timestamp;
        let allowDecrypting = localStorage.getItem("petnames.allowdecrypting") || false;
        let decryptWithoutPrompt = localStorage.getItem("petnames.decryptwithoutprompt") || false;
        if (decryptWithoutPrompt) allowDecrypting = true;
        if (!allowDecrypting && promptDecrypting && events.length > 0 && window.nostr) {
          if (window.nostr.nip44) {
            allowDecrypting = confirm("Do you want to decrypt petnames from up to " + events.length + " relationship events?");
            if (allowDecrypting) {
              localStorage.setItem('petnames.allowdecryptinguntil', timestamp + 3600); // dont prompt again for 1 hour
              localStorage.setItem('petnames.allowdecrypting', allowDecrypting);
            }
          }
        }
        for (let event of events) {
          let targetPubkey = '';
          let targetPetname = '';
          if(Window.DEBUG) console.log('loadPetnames: checking tags');
          for (let tag of event.tags) {
            if (tag.length > 1) {
              let k = tag[0];
              let v = tag[1];
              if (k == 'expiration') {
                try {
                  let expirationTime = parseInt(v);
                  if (expirationTime < timestamp) {
                    continue;
                  }
                } catch(error) { continue; }
              }
              if (k == 'd') targetPubkey = v;
              if (k == 'petname') targetPetname = v;
            }
          }
          if (allowDecrypting) {
            let enc = event.content;
            if (window.DEBUG) console.log('loadPetnames checking encrypted content');
            if (enc != undefined && enc.length > 0 && window.nostr.nip44) {
              let dec = ''; // await window.nostr.nip44.decrypt(myPubkey, enc);
              (async () => {let response = await window.nostr.nip44.decrypt(myPubkey, enc); dec = response})();
              if (dec != undefined && dec.length > 0) {
                let dectags = JSON.parse(dec);
                for (let tag of dectags) {
                  if (tag.length > 1) {
                    let k = tag[0];
                    let v = tag[1];
                    if (k == 'petname') targetPetname = v;
                  }
                }
              }
            }
          }
          if (targetPubkey == '') continue;
          if (targetPetname == '') continue;
          let targetNpub = nip19.npubEncode(targetPubkey);
          localStorage.setItem(`${targetNpub}.petname`, targetPetname);
        }
        localpool.close();
        res(true);
      }, 3000);
      localpool.subscribe(
        filters,
        relaysToUse,
        (event, onEose, url) => { events.push(event); },
        undefined,
        undefined,
        { unsubscribeOnEose: true, allowDuplicateEvents: false, allowOlderEvents: false }
      );
    } catch (error) {
      console.log('There was an error when loading petnames: ', error);
      localpool.close();
      rej(undefined);
    }
  });
}

export function getRelationshipPetname(userNpub, userDisplayName) {
  if (userNpub == undefined) return userDisplayName;
  let petnametime = localStorage.getItem(`petnames.timechecked`);
  let fetchit = (petnametime == undefined || petnametime < (Date.now() - (24*60*60*1000)));
  if (fetchit) {
    localStorage.setItem('petnames.timechecked', Date.now());
    let petnames = undefined;
    (async () => {let response = await loadPetnames(); petnames = response})();
  }
  let petname = localStorage.getItem(`${userNpub}.petname`);
  if (petname != undefined && petname.length > 0) {
    return petname
  }
  return userDisplayName;
}

export async function getRelationshipForNpub(userNpub) {
  if(window.DEBUG) console.log('in getPetnameForNpub');
  return new Promise(async(res, rej) => {
    const localpool = new RelayPool(undefined,poolOptions);
    try {
      let events = [];
      const defaultRelays = getDefaultOutboxRelays();
      const myPubkey = await getPublicKey();
      const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
      let myOutboxRelays = [];
      if (userRelays?.length == 0) {
        const myNpub = nip19.npubEncode(myPubkey);
        myOutboxRelays = await getOutboxRelays(myPubkey);
        updateCacheOutboxRelays(myOutboxRelays, myNpub);
      }
      const relaysToUse = unique([...myOutboxRelays, ...userRelays, ...defaultRelays]);
      const timestamp = Math.floor(Date.now() / 1000);
      let userPubkey = nip19.decode(userNpub).data;
      const filter = {kinds:[30382],authors: [myPubkey]}
      const filters = [filter];
      if(Window.DEBUG) console.log('loadPetnames: before setTimeout');
      setTimeout(() => {
        let validEvents = [];
        for (let event of events) {
          let targetPubkey = undefined;
          for (let tag of event.tags) {
            if (tag.length > 1) {
              let k = tag[0];
              let v = tag[1];
              if (k == 'expiration') {
                try {
                  let expirationTime = parseInt(v);
                  if (expirationTime < timestamp) {
                    continue;
                  }
                } catch(error) { continue; }
              }
              if (k == 'd') {
                if (v == userPubkey) targetPubkey = v;
                break;
              }
            }
          }
          if (targetPubkey == undefined) continue;
          res(event);
        }
        localpool.close();
        res(false);
      }, 3000);
      localpool.subscribe(
        filters,
        relaysToUse,
        (event, onEose, url) => { events.push(event); },
        undefined,
        undefined,
        { unsubscribeOnEose: true, allowDuplicateEvents: false, allowOlderEvents: false }
      );
    } catch (error) {
      console.log('There was an error when loading petnames: ', error);
      localpool.close();
      rej(undefined);
    }
  });  
}

export async function updatePetname(userNpub, petname) {
  if (!window.nostr) return;
  if (!petname || petname.length == 0) return;
  let useEncryption = true;
  // Need identifier
  let userPubkey = nip19.decode(userNpub).data;
  // Fetch latest record
  let existingRelationship = await getRelationshipForNpub(userNpub);
  let isNew = (existingRelationship == undefined || !existingRelationship);
  let newRelationship = {id:null,pubkey:null,sig:null,kind:30382,content:"",tags:[["d",userPubkey]],created_at:Math.floor(Date.now() / 1000)}
  if (!isNew) {
    newRelationship.content = existingRelationship.content;
    newRelationship.tags = existingRelationship.tags;
  }
  let petnameFound = false;
  let isCleartext = false;
  let isEncrypted = false;
  // Look for petname in clear tags
  for (let tag of newRelationship.tags) {
    if (tag.length < 2) continue;
    let k = tag[0];
    if (k == 'petname') {      
      isCleartext = true;
      petnameFound = true;
      tag[1] = petname;
      break;
    }
  }
  if (useEncryption && window.nostr.nip44) {
    // Look for petname in encrypted content
    const myPubkey = await getPublicKey();
    let enc = newRelationship.content;
    let dectags = [];
    if (enc != undefined && enc.length > 0 && window.nostr.nip44) {
      let dec = await window.nostr.nip44.decrypt(myPubkey, enc);
      if (dec != undefined && dec.length > 0) {
        dectags = JSON.parse(dec);
        for (let tag of dectags) {
          if (tag.length < 2) continue;
          let k = tag[0];
          if (k == 'petname') {
            isEncrypted = true;
            petnameFound = true;
            tag[1] = petname;
            break;
          }
        }
      }
    }
    // If no petname found, add to dec tags
    if (!petnameFound && petname && petname.length > 0) {
      isEncrypted = true;
      dectags.push(["petname",petname]);
    }
    // Re-Encrypt the content
    let dec = JSON.stringify(dectags);
    enc = await window.nostr.nip44.encrypt(myPubkey, dec);
    newRelationship.content = enc;
  } else {
    // If no petname found, add to tags
    if (!petnameFound && petname && petname.length > 0) {
      isCleartext = true;
      newRelationship.tags.push(["petname",petname]);
    }
  }

  // Sign and send newRelationship
  if(window.DEBUG) console.log(newRelationship);
  let r = await signAndSendEvent(newRelationship);
  return r[0];
}

export function loadNWCUrl() {
  const myEncryptionKey = JSON.parse(localStorage.getItem('identities'))._default.secretKey;

  // Use connection string given
  if ((localStorage.getItem('nwc.connectUrl') ?? '').length > 0) {
    let nwcConnectURL = crypto.AES.decrypt((localStorage.getItem('nwc.connectUrl') ?? ''), myEncryptionKey ).toString(crypto.enc.Utf8);
    if (nwcConnectURL != undefined) {
      return nwcConnectURL;
    }
  }
  // Try to build from parts
  let nwcWSPubkey = localStorage.getItem('nwc.pubkey');
  let nwcRelay = localStorage.getItem('nwc.relay');
  let nwcSecret = undefined;
  if ((localStorage.getItem('nwc.secret') ?? '').length > 0) {
    nwcSecret = crypto.AES.decrypt((localStorage.getItem('nwc.secret') ?? ''), myEncryptionKey ).toString(crypto.enc.Utf8);
  } 
  if (!nwcWSPubkey || !nwcRelay || !nwcSecret) {
    return undefined;
  }
  return `nostr+walletconnect:${nwcWSPubkey}?relay=${nwcRelay}&secret=${nwcSecret}`;   
}

export async function getCBadgeConfigsForPubkey(pubkey) {
  if(window.DEBUG) console.log("in getCBadgeIdsForPubkey for pubkey ", pubkey);
  return new Promise(async(res, rej) => {
    const localpool = new RelayPool(undefined,poolOptions);
    try {
      let events = [];
      const defaultRelays = getDefaultOutboxRelays();
      const relaysToUse = unique([...defaultRelays]);
      const timestamp = Math.floor(Date.now() / 1000);
      const filter = {kinds:[8],limit:500};
      const ap = "30009:21b419102da8fc0ba90484aec934bf55b7abcf75eedb39124e8d75e491f41a5e";
      // rare 12, super rare 21, epic 32, legend 42
      const badgeconfigs = [
        ["Corny-Chat-In-The-Room-Where-It-Happened", "You were in the room where it happened, taking part in discussions of a domain name for a new instance of Nostr Live Audio Spaces. From tell me things, to a hullabaloo, we all got an earful. Vic, Noshole, Puzzles, Kajoozie, Sai, New1, B, Companion", 42],
        ["Corny-Chat-Bug-Stomper-OG", "You helped test and try out Corny Chat in the earliest days of its existence, enduring outages, crazy UI, and routine restarts.", 32],
        ["Corny-Chat-Survivor-of-Upside-Down-Day", "Recipients of this badge visited Corny Chat on April 1, 2024.  Users could experience the application interface presented in an upside down format.", 0],
        ["1-Million-Minute-Member", "Awardees of this badge were an integral part of Corny Chat's early success, having been in rooms for at least 1 of the first million minutes.", 21], 
        ["Corny-Chat-Supporter-Via-PubPay.me", "You supported Corny Chat development by contributing through a fundraiser on PubPay.me in July 2024!", 0]
      ];
      let filterbadges = []
      for (let badgeconfig of badgeconfigs) { 
        let b = badgeconfig[0];
        filterbadges.push(`${ap}:${b}`)
      }
      filter["#a"] = filterbadges;
      filter["#p"] = [pubkey];
      const filters = [filter];
      setTimeout(() => {
        let foundBadgeIds = [];
        for (let event of events) {
          for (let tag of event.tags) {
            if (tag.length > 1) {
              let k = tag[0];
              let v = tag[1];
              if (k != 'a') continue;
              if (!v.startsWith(ap)) continue;
              if (v.split(":").length < 3) continue;
              let badgeid = v.split(":")[2];
              foundBadgeIds.push(badgeid);
              break;
            }
          }
        }
        // force our preferred order of matches
        let foundBadgeConfigs = [];
        for (let badgeconfig of badgeconfigs) {
          if (foundBadgeIds.includes(badgeconfig[0])) {
            foundBadgeConfigs.push(badgeconfig);
          }
        }
        localpool.close();
        res(foundBadgeConfigs);
      }, 1400);
      localpool.subscribe(
        filters,
        relaysToUse,
        (event, onEose, url) => { events.push(event); },
        undefined,
        undefined,
        { unsubscribeOnEose: true, allowDuplicateEvents: false, allowOlderEvents: false }
      );
    } catch (error) {
      console.log('There was an error when getting badges: ', error);
      localpool.close();
      rej(undefined);
    }
  });
}

export async function sendLiveChat(roomATag, textchat) {
  if (!window.nostr) return [false, 'A nostr extension is required to send live chat'];
  let kind = 1311;
  let tags = [
    ["a", roomATag]
  ];

  // Check if including a custom emoji reference
  buildKnownEmojiTags();
  tags = addMissingEmojiTags(tags, textchat);

  let event = {
    id: null,
    pubkey: null,
    created_at: Math.floor(Date.now() / 1000),
    kind: kind,
    tags: tags,
    content: textchat,
    sig: null,
  };
  let r = await signAndSendEvent(event);
  return r;
}

export async function publishZapGoal(description, amount) {
  if (window.DEBUG) console.log("in publishZapGoal");
  try {
    const defaultRelays = getDefaultOutboxRelays();
    const myPubkey = await getPublicKey();
    const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
    let myOutboxRelays = [];
    if (userRelays?.length == 0) {
      const myNpub = nip19.npubEncode(myPubkey);
      myOutboxRelays = await getOutboxRelays(myPubkey); // (async() => {await getOutboxRelays(myPubkey)})();
      updateCacheOutboxRelays(myOutboxRelays, myNpub);
    }
    const relaysToUse = unique([...myOutboxRelays, ...userRelays, ...defaultRelays]);
    let relays = defaultRelays;
    let kind = 9041;
    let amountTag = ["amount", String(amount * 1000)];
    let relayTag = ["relays", ...relays];
    let tags = [amountTag, relayTag];
    let event = {
      id: null,
      pubkey: null,
      created_at: Math.floor(Date.now() / 1000),
      kind: kind,
      tags: tags,
      content: description,
      sig: null,
    };
    let r = await signAndSendEvent(event);
    return r;
  } catch (err) {
    return [false, `Error in publishZapGoal: ${err}`];
  }
}

export async function publishStatus(status, url) {
  let kind = 30315;
  let expiration = Math.floor(Date.now() / 1000) + (60*60); // 1 hour from now
  let tags = [
    ["d", "music"],
    ["r", url]
  ];
  //tags.push(["expiration", `${expiration}`]);
  if (window.DEBUG) console.log(`Publishing status to nostr: ${status}, with url ${url}`);
  let event = {
    id: null,
    pubkey: null,
    created_at: Math.floor(Date.now() / 1000),
    kind: kind,
    tags: tags,
    content: status,
    sig: null,
  };
  let r = signAndSendEvent(event);
  return r;  
}

export async function loadZapGoals() {
  return new Promise(async(res, rej) => {
    if (!window.nostr) return(undefined);
    const localpool = new RelayPool(undefined,poolOptions);
    try {
      let events = [];
      const defaultRelays = getDefaultOutboxRelays();
      const myPubkey = await getPublicKey();
      const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
      let myOutboxRelays = [];
      if (userRelays?.length == 0) {
        const myNpub = nip19.npubEncode(myPubkey);
        myOutboxRelays = await getOutboxRelays(myPubkey);
        updateCacheOutboxRelays(myOutboxRelays, myNpub);
      }
      const relaysToUse = unique([...myOutboxRelays, ...userRelays, ...defaultRelays]);
      const timestamp = Math.floor(Date.now() / 1000);
      const filter = {kinds:[9041],authors: [myPubkey]}
      const filters = [filter];
      setTimeout(() => {
        let retEvents = [];
        for (let event of events) {
          let a = 0;
          for (let tag of event.tags) {
            if (tag.length < 2) continue;
            if (tag[0] == 'amount') {
              let a1 = Math.floor(String(Math.floor(tag[1])).replace("NaN",0));
              //if (a1 > 0) a = a1;
              a = a1;
            }
          }
          if (a > 0) retEvents.push(event);
        }
        localpool.close();
        res(retEvents);
      }, 3000);
      localpool.subscribe(
        filters,
        relaysToUse,
        (event, onEose, url) => { events.push(event); },
        undefined,
        undefined,
        { unsubscribeOnEose: true, allowDuplicateEvents: false, allowOlderEvents: false }
      );
    } catch (error) {
      console.log('There was an error when loading zap goals: ', error);
      localpool.close();
      rej(undefined);
    }
  });
}

function normalizeRelays(relays) {
  let o = [];
  for (let r of relays) {
    if (!r.endsWith("/")) r = r + "/";
    if (!r.startsWith("wss://")) r = "wss://" + r;
    if (!o.includes(r)) o.push(r);
  }
  return o;
}

export async function signAndSendEvent(event) {
  if (!window.nostr) return [false, 'A nostr extension is required to sign events'];
  if (!event.hasOwnProperty("created_at")) event["created_at"] = Math.floor(Date.now() / 1000);
  if (!event.hasOwnProperty("content")) event["content"] = "";
  if (!event.hasOwnProperty("id")) event["id"] = null;
  if (!event.hasOwnProperty("kind")) event["kind"] = 1;
  if (!event.hasOwnProperty("pubkey")) event["pubkey"] = null;
  if (!event.hasOwnProperty("sig")) event["sig"] = null;
  if (!event.hasOwnProperty("tags")) event["tags"] = [];
  const eventSigned = await window.nostr.signEvent(event);
  if (!eventSigned) {
    return [false, 'There was an error with your nostr extension'];
  } else {
    // push to relays
    const defaultRelays = getDefaultOutboxRelays();
    const myPubkey = await await getPublicKey();
    const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
    let myOutboxRelays = [];
    if (userRelays?.length == 0) {
      const myNpub = nip19.npubEncode(myPubkey);
      myOutboxRelays = await getOutboxRelays(myPubkey); // (async() => {await getOutboxRelays(myPubkey)})();
      updateCacheOutboxRelays(myOutboxRelays, myNpub);
    }
    myOutboxRelays = normalizeRelays(myOutboxRelays);
    const relaysToUse = unique([...myOutboxRelays, ...userRelays, ...defaultRelays]);
    if (window.DEBUG) console.log("eventSigned: ", JSON.stringify(eventSigned));
    if (window.DEBUG) console.log("publish to relays: ", JSON.stringify(relaysToUse));
    try {
      let pool = new RelayPool(undefined, poolOptions);
      let publishEventResults = await pool.publish(eventSigned, relaysToUse);
      if (window.DEBUG) console.log("publishEventResults: ", JSON.stringify(publishEventResults));
      if(pool.errorsAndNotices && pool.errorsAndNotices.length > 0) {
        console.log(`[signAndSendEvent] pool errors and notices: ${JSON.stringify(pool.errorsAndNotices)}`);
      }
      const sleeping1 = await sleep(1000);
      pool.close();
      const sleeping2 = await sleep(100);
    } catch (e) {
      return [false, 'error talking to relays: ' + e];
    }
    return [true, eventSigned.id];
  }  
}

export async function rebuildCustomEmojis() {
  sessionStorage.removeItem('customEmojis');
  sessionStorage.removeItem('customEmojis.retrievedTime');
  let ce = await getCustomEmojis();
  return ce;
}

export async function getUncachedPeerMetadata(inRoomPeerIds) {
  if(window.DEBUG) console.log("in getUncachedPeerMetadata");
  // Get the follow list
  let myFollowList = [];
  if (window.nostr) {
    myFollowList = await loadFollowList();
  }
  return new Promise((res, rej) => {
    // return from local cache if it has not aged out
    const currentTime = Math.floor(Date.now() / 1000);
    const timeToExpire = 5; // 5 seconds
    const keyPrefix = 'recentPeerMetadata';
    const keyTime = `${keyPrefix}.retrievedTime`
    const listRetrieved = sessionStorage.getItem(keyTime);
    const listExpired = (listRetrieved == undefined || ((listRetrieved + timeToExpire) < currentTime));
    let listData = sessionStorage.getItem(keyPrefix);
    if (!listExpired && listData != undefined) {
      try {
        listData = JSON.parse(sessionStorage.getItem(keyPrefix));
        res(listData);
      } catch(e) {
        res([]);
      } finally {}
    }
    if (!inRoomPeerIds || inRoomPeerIds.length == 0) {
      listData = [];
      sessionStorage.setItem(keyTime, currentTime);
      sessionStorage.setItem(keyPrefix, listData);
      res(listData);
    }
    let suffix = '.kind0tags';
    let npubsCached = [];
    Object.keys(sessionStorage).forEach(function(key) {
      if (key.endsWith(suffix)) {
        npubsCached.push(key.replaceAll(suffix, ''));
      }
    });
    let npubsToFetch = [];
    for (let peerId of inRoomPeerIds) {
      let peerInfo = sessionStorage.getItem(peerId);
      if (!peerInfo) continue;
      const peerNpub = getNpubFromInfo(peerInfo);
      if (!peerNpub) continue;
      if (peerNpub.length == 0) continue;
      if (!npubsCached.includes(peerNpub) && !npubsToFetch.includes(peerNpub)) npubsToFetch.push(peerNpub);
    }
    if (npubsToFetch.length == 0) {
      listData = [];
      sessionStorage.setItem(keyTime, currentTime);
      sessionStorage.setItem(keyPrefix, listData);
      res(listData);
    }
    let pubkeysToFetch = [];
    for (let npub of npubsToFetch) {
      try {
      const userPubkey = nip19.decode(npub).data;
      pubkeysToFetch.push(userPubkey);
      } finally {}
    }
    // Query the metadata records for users we need to cache
    const localpool = new RelayPool(undefined,poolOptions);
    try {
      const userRelays = [];
      const defaultRelays = getDefaultOutboxRelays();
      const relaysToUse = unique([...userRelays, ...defaultRelays]);
      const filter = [{kinds: [0], authors: pubkeysToFetch, limit: 500}];
      let userEvents = [];
      const timeoutRelays = setTimeout(() => {
        if (userEvents.length === 0) {
          if(window.DEBUG) console.log('Nostr relays did not return any events');
          localpool.close();
          rej(undefined);
        } else {
          let userInfos = [];
          for (let currentUserEvent of userEvents) {
            let userMetadata = undefined
            let userTags = [];
            let userDate = 0;
            let userId = undefined;
            let userNpub = nip19.npubEncode(currentUserEvent.pubkey);
            for (let ue of userEvents) {
              if (ue.pubkey != currentUserEvent.pubkey) continue;
              if (ue.created_at < userDate) continue;
              userTags = ue.tags;
              userDate = ue.created_at;
              userId= ue.id;            
              try {
                userMetadata = JSON.parse(ue.content);
              } catch(e) {
                userMetadata = undefined;
              } finally {}
            }
            if (userMetadata) {
              let username = userMetadata?.display_name || userMetadata?.name || '';
              const userInfo = {
                name: username,
                id: userId,
                picture: userMetadata?.picture,
                npub: userNpub,
                about: userMetadata?.about,
                nip05: userMetadata?.nip05,
                lud16: userMetadata?.lud16,
                lud06: userMetadata?.lud06,
                banner: userMetadata?.banner,  
              }
              userInfos.push(userInfo);
              (async () => {
                let obj = {}
                obj.iFollow = false;
                for (let mfle of myFollowList) {
                  if (mfle.length < 2) continue;
                  if (mfle[0] != 'p') continue;
                  if (mfle[1] != currentUserEvent.pubkey) continue;
                  obj.iFollow = true;
                  break;
                }
                obj.about = userInfo.about;
                obj.lightningAddress = userInfo.lud16 ?? userInfo.lud06;
                let isNip05Valid = await verifyNip05(userInfo.nip05, userNpub);
                obj.nip05 = {isValid: isNip05Valid, nip05Address: userInfo.nip05};
                obj.banner = userInfo.banner;
                const badgeconfigs = await getCBadgeConfigsForPubkey(currentUserEvent.pubkey);
                obj.badgeConfigs = badgeconfigs;
                const userMetadataCache = JSON.stringify(obj);
                sessionStorage.setItem(userNpub, userMetadataCache);
                sessionStorage.setItem(`${userNpub}.kind0content`, JSON.stringify(userMetadata));
                sessionStorage.setItem(`${userNpub}.kind0tags`, JSON.stringify(userTags));
              })();
            }
          } // currentUserEvent
          localpool.close();
          if(userInfos.length > 0) {
            sessionStorage.removeItem('knownEmojiTags.buildTime');
            buildKnownEmojiTags();
          }
          listData = userInfos;
          sessionStorage.setItem(keyTime, currentTime);
          sessionStorage.setItem(keyPrefix, listData);
          res(listData);
        }
      }, 1800);
      localpool.subscribe(
        filter,
        relaysToUse,
        (event, afterEose, url) => {
          userEvents.push(event);
        },
        undefined,
        undefined,
        {unsubscribeOnEose: true}
      );
    } catch (error) {
      console.log('There was an error in getUncachedPeerMetadata: ', error);
      localpool.close();
      rej(undefined)
    }
  });
}

export async function getCustomEmojis() {
  // Tag in user's 10030 event.  For each a tag, 
  //    ["a", "30030:1c9dcd8fd2d2fb879d6f02d6cc56aeefd74a9678ae48434b0f0de7a21852f704:Celtic "]
  // get the relevant 30030 event. Then add to the customEmojis
  //    ["emoji", "Cacodemon", "https://media.tenor.com/BzhCHGfoSm8AAAAi/caco-cacodemon.gif"]
  // The resulting customEmojis object returned is suitable for passing to EmojiPicker of emoji-picker-react
  let legacyEmojis = [
    {id: 'E1', names: ['Pepe 1'], imgUrl:'/img/emojis/emoji-E1.png'},
    {id: 'E2', names: ['Pepe 2'], imgUrl:'/img/emojis/emoji-E2.png'},
    {id: 'E3', names: ['Pepe 3'], imgUrl:'/img/emojis/emoji-E3.png'},
    {id: 'E4', names: ['Pepe 4'], imgUrl:'/img/emojis/emoji-E4.png'},
    {id: 'E5', names: ['Pepe 5'], imgUrl:'/img/emojis/emoji-E5.png'},
    {id: 'E6', names: ['Pepe 6'], imgUrl:'/img/emojis/emoji-E6.png'},
    {id: 'E7', names: ['Pepe 7'], imgUrl:'/img/emojis/emoji-E7.png'},
  ]
  let customEmojis = legacyEmojis;
  if (window.nostr) {
    let pubkey = await getPublicKey();
    const currentTime = Math.floor(Date.now() / 1000);
    const timeToExpire = 3600; // 1 hour
    let myCustomEmojisRetrieved = sessionStorage.getItem('customEmojis.retrievedTime');
    if (myCustomEmojisRetrieved) myCustomEmojisRetrieved *= 1;
    const myCustomEmojisExpired = (myCustomEmojisRetrieved == undefined || ((myCustomEmojisRetrieved + timeToExpire) < currentTime));
    customEmojis = sessionStorage.getItem('customEmojis');
    if (myCustomEmojisExpired || customEmojis == undefined) {
      customEmojis = legacyEmojis;
      if (window.DEBUG) console.log('user pubkey', pubkey);
      let kind10030s = await getUserEventsByKind(pubkey, 10030, 0);
      if (window.DEBUG) console.log('10030', kind10030s);
      let newestkind10030 = 0;
      for (let kind10030 of kind10030s) {
        if (kind10030.tags == undefined) continue;
        if (kind10030.tags.length == 0) continue;
        if (kind10030.created_at > newestkind10030) {
          newestkind10030 = kind10030.created_at;
        }
      }
      for (let kind10030 of kind10030s) {
        if (kind10030.created_at != newestkind10030) continue;
        let kind10030tags = kind10030.tags;
        if (kind10030tags == undefined) continue;
        for (let kind10030tag of kind10030tags) {
          if (kind10030tag.length < 2) continue;
          if (kind10030tag[0] != 'a') continue;
          let aTagParts = kind10030tag[1].split(":");
          if (aTagParts.length != 3) continue;
          if (aTagParts[0] != '30030') continue;
          let emojiSetPubkey = aTagParts[1];
          let emojiSetName = aTagParts[2];
          if (window.DEBUG) console.log('pubkey that authored emoji set', emojiSetPubkey);
          let kind30030s = sessionStorage.getItem(`${emojiSetPubkey}.kind30030events`);
          if (kind30030s == undefined) {
            kind30030s = await getUserEventsByKind(emojiSetPubkey, 30030, 0);
          } else {
            kind30030s = JSON.parse(sessionStorage.getItem(`${emojiSetPubkey}.kind30030events`));
          }
          if (window.DEBUG) console.log('30030', kind30030s);
          for (let kind30030 of kind30030s) {
            let kind30030tags = kind30030.tags;
            let targetFound = false;
            for (let kind30030tag of kind30030tags) {
              if (kind30030tag.length < 2) continue;
              if (kind30030tag[0] != 'd') continue;
              if (kind30030tag[1] != emojiSetName) continue;
              targetFound = true;
              break;
            }
            if (targetFound) {
              for (let kind30030tag of kind30030tags) {
                if (kind30030tag.length < 3) continue;
                if (kind30030tag[0] != 'emoji') continue;
                let emojiName = kind30030tag[1];
                let emojiUrl = kind30030tag[2];
                let emojiId = emojiUrl;
                let addit = true;
                for (let ce of customEmojis) {
                  if (ce.id == emojiId) {addit = false; break;}
                  if (ce.imgUrl == emojiUrl) {addit = false; break;}
                }
                if (addit) customEmojis.push({id: emojiId, names: [emojiName, emojiSetName], imgUrl: emojiUrl});
              }
            }
          }
        }
      }
      sessionStorage.setItem('customEmojis.retrievedTime', currentTime);
      sessionStorage.setItem('customEmojis', JSON.stringify(customEmojis));
    } else {
      customEmojis = JSON.parse(customEmojis);
    }
  }
  return customEmojis;
}