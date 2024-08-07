import {nip19, validateEvent, verifySignature, getPublicKey} from 'nostr-tools';
import {RelayPool} from 'nostr-relaypool';
import {nanoid} from 'nanoid';
import crypto from 'crypto-js';
import {bech32} from 'bech32';
import {Buffer} from 'buffer';

const pool = new RelayPool();
function unique(arr) {
  return [...new Set(arr)];
}
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function getDefaultOutboxRelays() {
  return [
    'wss://nos.lol',
    'wss://relay.damus.io',
    'wss://nostr.mutinywallet.com',
    'wss://relay.snort.social',
  ];
}

function getCachedOutboxRelaysByPubkey(pubkey) {
  if(window.DEBUG) console.log('in getCachedOutboxRelaybyPubkey for ', pubkey);
  const npub = nip19.npubEncode(pubkey);
  return getCachedOutboxRelaysByNpub(npub);
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
    //const pool = new RelayPool();
    try {
      const userRelays = getCachedOutboxRelaysByPubkey(pubkey);
      const defaultRelays = getDefaultOutboxRelays();
      const relaysToUse = unique([...userRelays, ...defaultRelays]);
      const filter = [{kinds: [10002], authors: [pubkey]}];
      let events = [];
      setTimeout(() => {
        //pool.close();
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
      }, 2700);

      pool.subscribe(
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
      //pool.close();
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
  sessionStorage.setItem('dmPubkey', exportedPubkeyString);
  sessionStorage.setItem('dmPrivkey', exportedPrivkeyString);
}
export async function getDMPrivkey() {
  if ((sessionStorage.getItem("dmPrivkey") || '') == '' || (sessionStorage.getItem("dmPubkey") || '') == '') {
    await createDMKeys();
  }
  return sessionStorage.getItem("dmPrivkey");
}
export async function getDMPubkey() {
  if ((sessionStorage.getItem("dmPubkey") || '') == '' || (sessionStorage.getItem("dmPrivkey") || '') == '') {
    await createDMKeys();
  }
  return sessionStorage.getItem("dmPubkey");
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
    let pubkey = await window.nostr.getPublicKey();
    let created_at = Math.floor(Date.now()/1000);
    let kind = 1;
    let tags = [[]];
    let myId = state.myId;
    let loginEvent = {created_at: created_at, pubkey: pubkey, kind: kind, tags: tags, content: myId};
    let signedLogin = await window.nostr.signEvent(loginEvent);
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
    //const pool = new RelayPool();
    try {
      const userRelays = getCachedOutboxRelaysByPubkey(pubkey);
      const defaultRelays = getDefaultOutboxRelays();
      const relaysToUse = unique([...userRelays, ...defaultRelays]);
      const since = timeSince;
      const filter = [{kinds: [kind], authors: [pubkey], since: since, limit: 50}];
      let userEvents = [];
      setTimeout(() => {
        //pool.close();
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
        sessionStorage.setItem(`${pubkey}.kind${kind}events`, JSON.stringify(userEvents));
        sessionStorage.setItem(`${pubkey}.kind${kind}events.retrieveTime`, Math.floor(Date.now() / 1000));
        res(userEvents);
      }, 2700);
      let options = {unsubscribeOnEose: true, allowDuplicateEvents: false};
      
      pool.subscribe(
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
      //pool.close();
      rej(undefined);
    }
  });
}

export async function getUserEventById(pubkey, id) {
  if(window.DEBUG) console.log("in getUserEventById for pubkey ", pubkey, ", id", id);
  return new Promise((res, rej) => {
    //const pool = new RelayPool();
    try {
      const userRelays = getCachedOutboxRelaysByPubkey(pubkey);
      const defaultRelays = getDefaultOutboxRelays();
      const relaysToUse = unique([...userRelays, ...defaultRelays]);
      const filter = [{kinds: [1], authors: [pubkey], ids: [id]}];
      let userEvents = [];
      const timeoutRelays = setTimeout(() => {
        if (userEvents.length === 0) {
          //pool.close();
          res(undefined);
          if (window.DEBUG) console.log('Nostr relays did not return any events');
        }
      }, 2700);

      pool.subscribe(
        filter,
        relaysToUse,
        (event, afterEose, url) => {
          clearTimeout(timeoutRelays);
          userEvents.push(event);
          //pool.close();
          res(event);
        },
        undefined,
        undefined,
        {unsubscribeOnEose: true}
      );
    } catch (error) {
      console.log('There was an error when getting user events by id: ', error);
      //pool.close();
      rej(undefined);
    }
  });
}

export async function getUserMetadata(pubkey, id) {
  if(window.DEBUG) console.log("in getUserMetadata for pubkey", pubkey, ", id", id);
  return new Promise((res, rej) => {
    //const pool = new RelayPool();
    try {
      const userRelays = getCachedOutboxRelaysByPubkey(pubkey);
      const defaultRelays = getDefaultOutboxRelays();
      const relaysToUse = unique([...userRelays, ...defaultRelays]);
      const filter = [{kinds: [0], authors: [pubkey]}];
      //check if i can use a variable set to true or false
      let userMetadata = [];
      const timeoutRelays = setTimeout(() => {
        if (userMetadata.length === 0) {
          if(window.DEBUG) console.log('Nostr relays did not return any events');
          //pool.close();
          res(undefined);
        }
      }, 3000);
      const npub = nip19.npubEncode(pubkey);
      pool.subscribe(
        filter,
        relaysToUse,
        (event, afterEose, url) => {
          clearTimeout(timeoutRelays);
          userMetadata.push(JSON.parse(event.content));
          let username = userMetadata[0]?.display_name || '';
          if (username.length == 0) username = userMetadata[0]?.name || '';
          const userInfo = {
            name: username,
            id: id,
            picture: userMetadata[0]?.picture,
            npub: npub,
            about: userMetadata[0]?.about,
            nip05: userMetadata[0]?.nip05,
            lud16: userMetadata[0]?.lud16,
            lud06: userMetadata[0]?.lud06,
            banner: userMetadata[0]?.banner,
          };

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
            const userMetadataCache = JSON.stringify(obj);
            sessionStorage.setItem(npub, userMetadataCache);
            return userMetadataCache;
          })();
          if(!!false) console.log(savingToSession);

          //pool.close();
          res(userInfo);
        },
        undefined,
        undefined,
        {unsubscribeOnEose: true}
      );
    } catch (error) {
      console.log('There was an error when getting user metadata: ', error);
      //pool.close();
      rej(undefined);
    }
  });
}

export async function sendZaps(npubToZap, comment, amount, state) {
  if(window.DEBUG) console.log("in sendZaps");
  try {
    // Validate and set sats
    let satsAmount = parseInt(amount);
    if (!(satsAmount > 0)) {
      throw new Error('Sats amount must be higher than 0');
    }
    satsAmount = satsAmount * 1000;

    const pubkeyToZap = npubToZap.startsWith("fakenpub") ? undefined : nip19.decode(npubToZap).data;
    const id = null;

    // Determine lightning address to use
    let lightningAddress = null;
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

    if (!lightningAddress) {
      throw new Error('Lightning address not found for this npub.');
    }

    const LnService = await getLNService(lightningAddress);

    if (LnService.hasOwnProperty('error')) {
      throw new Error(LnService.reason);
    }
    if (pubkeyToZap) {
      if(window.DEBUG) console.log("about to call getZapEvent");
      const signedEvent = await getZapEvent(
        comment,
        pubkeyToZap,
        satsAmount,
        state
      );
      // happens if they cancel signing the zap request
      if (!signedEvent[0]) {
        if(window.DEBUG) console.log("about to call getLNInvoice as direct lightning");
        const lnInvoice = await getLNInvoice(
          null,
          lightningAddress,
          LnService,
          satsAmount,
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
        satsAmount,
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
        satsAmount,
        comment
      );
      return [true, lnInvoice.pr];
    }
  } catch (error) {
    console.log('There was an error sending zaps: ', error);
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
  if(window.DEBUG) console.log("in saveFollowList");
  const event = {
    id: null,
    pubkey: null,
    created_at: Math.floor(Date.now() / 1000),
    kind: 3,
    tags: myFollowList,
    content: '',
    sig: null,
  };
  const EventSigned = await window.nostr.signEvent(event);
  if(window.DEBUG) console.log(EventSigned);
  //if (!EventSigned) return [null, 'There was an error with your nostr extension'];
  const defaultRelays = getDefaultOutboxRelays();
  const myPubkey = await window.nostr.getPublicKey();
  const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
  let myOutboxRelays = [];
  if (userRelays?.length == 0) {
    const myNpub = nip19.npubEncode(myPubkey);
    myOutboxRelays = await getOutboxRelays(myPubkey);
    updateCacheOutboxRelays(myOutboxRelays, myNpub);
  }
  const relaysToUse = unique([...myOutboxRelays, ...userRelays, ...defaultRelays]);
  //const pool = new RelayPool();
  pool.publish(EventSigned, relaysToUse);
  const sleeping = await sleep(100);
  //pool.close();
  return true;
}

export async function loadFollowList() {
  if(window.DEBUG) console.log("in loadFollowList");
  return new Promise(async (res, rej) => {
    //const pool = new RelayPool();
    try {
      const defaultRelays = getDefaultOutboxRelays();
      const myPubkey = await window.nostr.getPublicKey();
      const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
      let myOutboxRelays = [];
      if (userRelays?.length == 0) {
        const myNpub = nip19.npubEncode(myPubkey);
        myOutboxRelays = await getOutboxRelays(myPubkey);
        updateCacheOutboxRelays(myOutboxRelays, myNpub);
      }
      const relaysToUse = unique([...myOutboxRelays, ...userRelays, ...defaultRelays]);
      const filter = [{kinds: [3], authors: [myPubkey]}];
      let events = [];

      setTimeout(() => {
        //pool.close();
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
        res(followList);
      }, 2700);

      pool.subscribe(
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
      //pool.close();
      rej(undefined);
    }
  });
}

export async function unFollowUser(
  npubToUnfollow,
  myFollowList,
  state,
  roomId,
) {
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

export async function followUser(npubToFollow, myFollowList, state, roomId) {
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
  // ensure we have a list to work with
  const currentTime = Math.floor(Date.now() / 1000);
  const timeToExpire = 3600; // 1 hour
  const myFollowListRetrieved = sessionStorage.getItem('myFollowList.retrievedTime');
  const myFollowListExpired = (myFollowListRetrieved == undefined || ((myFollowListRetrieved + timeToExpire) < currentTime));
  let myFollowList = sessionStorage.getItem('myFollowList');
  if (myFollowListExpired || myFollowList == undefined) {
    myFollowList = await loadFollowList();
    if (myFollowList) {
      sessionStorage.setItem('myFollowList.retrievedTime', currentTime);
      sessionStorage.setItem('myFollowList', JSON.stringify(myFollowList));
    }
  } else {
    myFollowList = JSON.parse(sessionStorage.getItem('myFollowList'));
  }

  // tracking
  let numberOfAddedPubkeys = 0;

  // iterate all peer ids, checking for pubkeys to add
  for (let peerId of inRoomPeerIds) {
    const peerValue = sessionStorage.getItem(peerId);
    if (peerValue == undefined) continue;
    const peerObj = JSON.parse(peerValue);
    const npub = getNpubFromInfo(peerObj);
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
    }
  }

  if (numberOfAddedPubkeys > 0) {
    sessionStorage.setItem('myFollowList', JSON.stringify(myFollowList));
    const isOK = await saveFollowList(myFollowList);
    alert('Followed ' + numberOfAddedPubkeys + ' new nostr users');
  } else {
    alert('You are already following everyone in the room');
  }
}

export async function verifyNip05(nip05, userNpub) {
  if(window.DEBUG) console.log("in verifyNip05");
  if (!nip05) {
    return false;
  }
  if (nip05 !== '' && userNpub) {
    const pubkey = nip19.decode(userNpub).data;
    const url = nip05.split('@');
    const domain = url[1];
    const name = url[0];

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

  let username = address2.split("@")[0];
  let domain = address2.split("@")[1];
  let url = `https://${domain}/.well-known/lnurlp/${username}`;
  let data = await (await fetch(url)).json();
  return data;
}

async function getLNInvoice(zapEvent, lightningAddress, LNService, amount, comment) {
  if(window.DEBUG) console.log("in getLNInvoice");
  let hasPubkey = LNService.nostrPubkey;
  const dataBytes = Buffer.from(lightningAddress, 'utf-8');
  const lnurlEncoded = bech32.encode('lnurl', bech32.toWords(dataBytes));
  let baseUrl = `${LNService.callback}?amount=${amount}`;
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

async function getZapEvent(content, receiver, amount, state) {
  if(window.DEBUG) console.log("in getZapEvent");
  let event = {
    id: null,
    pubkey: null,
    created_at: Math.floor(Date.now() / 1000),
    kind: 9734,
    tags: [
      ['p', `${receiver}`],
      [
        'relays',
        'wss://relay.damus.io',
        'wss://nos.lol',
        //'wss://nostr-pub-wellorder.net/',
        'wss://nostr.pleb.network',
      ],
      ['amount', `${amount}`],
    ],
    content: content,
    sig: null,
  };

  if (window.nostr) {
    const EventSigned = await window.nostr.signEvent(event);
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
  try {
    let jamid = info.id;
    let j = info?.identities || [];
    for (let k = 0; k < j.length; k ++) {
      let t = j[k].type || '';
      if (t == 'nostr') {
        let n = j[k].id || '';
        let c = j[k].loginTime || 0;
        let i = j[k].loginId || '';
        let s = j[k].loginSig || '';
        let p = nip19.decode(n).data;
        let tags = (j[k].verificationInfo ? [] : [[]]);
//        console.log('n',n, 'c',c, 'i',i, 's', s, 'p', p, 'jamid', jamid);
        let e = {
          id: i,
          pubkey: p,
          created_at: c,
          kind: 1,
          tags: tags,
          content: jamid,
          sig: s,
        };
        let u = validateEvent(e);
        let v = verifySignature(e);
        r = (u && v);
//        console.log(u, v, r, e);
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
  const eventSigned = await window.nostr.signEvent(event);
  if (!eventSigned) {
    return [false, 'There was an error with your nostr extension'];
  } else {
    if (window.DEBUG) console.log(eventSigned);
    // push to relays
    const defaultRelays = getDefaultOutboxRelays();
    const myPubkey = await window.nostr.getPublicKey();
    const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
    let myOutboxRelays = [];
    if (userRelays?.length == 0) {
      const myNpub = nip19.npubEncode(myPubkey);
      myOutboxRelays = await getOutboxRelays(myPubkey); // (async() => {await getOutboxRelays(myPubkey)})();
      updateCacheOutboxRelays(myOutboxRelays, myNpub);
    }
    const relaysToUse = unique([...myOutboxRelays, ...userRelays, ...defaultRelays]);
    if (window.DEBUG) console.log(relaysToUse);
    //const pool = new RelayPool();
    if (window.DEBUG) console.log("992-publishing");
    pool.publish(eventSigned, relaysToUse);
    if (window.DEBUG) console.log("994-published");
    const sleeping = await sleep(100);
    //pool.close();
    return [true, ''];
  }
}

export async function loadList(kind, pubkey) {
  if(window.DEBUG) console.log("in loadList for kind ", kind);
  return new Promise(async(res, rej) => {
    //const pool = new RelayPool();
    try {
      let events = [];
      const defaultRelays = getDefaultOutboxRelays();
      const myPubkey = await window.nostr.getPublicKey();
      const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
      let myOutboxRelays = [];
      if (userRelays?.length == 0) {
        const myNpub = nip19.npubEncode(myPubkey);
        myOutboxRelays = await getOutboxRelays(myPubkey); // (async() => {await getOutboxRelays(myPubkey)})();
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
        //pool.close();
        res(validEvents);
      }, 3000);
      pool.subscribe(
        filters,
        relaysToUse,
        (event, onEose, url) => { events.push(event); },
        undefined,
        undefined,
        { unsubscribeOnEose: true, allowDuplicateEvents: false, allowOlderEvents: false }
      );
    } catch (error) {
      console.log('There was an error when loading lists: ', error);
      //pool.close();
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
  const EventSigned = await window.nostr.signEvent(event);
  if(window.DEBUG) console.log(EventSigned);
  const defaultRelays = getDefaultOutboxRelays();
  const myPubkey = await window.nostr.getPublicKey();
  const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
  let myOutboxRelays = [];
  if (userRelays?.length == 0) {
    const myNpub = nip19.npubEncode(myPubkey);
    myOutboxRelays = await getOutboxRelays(myPubkey);
    updateCacheOutboxRelays(myOutboxRelays, myNpub);
  }
  const relaysToUse = unique([...myOutboxRelays, ...userRelays, ...defaultRelays]);
  //const pool = new RelayPool();
  pool.publish(EventSigned, relaysToUse);
  const sleeping = await sleep(100);
  //pool.close();
  return true;  
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
    //const pool = new RelayPool();
    try {
      let events = [];
      if(Window.DEBUG) console.log('loadPetnames: getDefaultOutboxRelays');
      const defaultRelays = getDefaultOutboxRelays();
      if(Window.DEBUG) console.log('loadPetnames: getPublicKey');
      const myPubkey = await window.nostr.getPublicKey();
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
        //pool.close();
        res(true);
      }, 3000);
      pool.subscribe(
        filters,
        relaysToUse,
        (event, onEose, url) => { events.push(event); },
        undefined,
        undefined,
        { unsubscribeOnEose: true, allowDuplicateEvents: false, allowOlderEvents: false }
      );
    } catch (error) {
      console.log('There was an error when loading petnames: ', error);
      //pool.close();
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
    //const pool = new RelayPool();
    try {
      let events = [];
      const defaultRelays = getDefaultOutboxRelays();
      const myPubkey = await window.nostr.getPublicKey();
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
        //pool.close();
        res(false);
      }, 3000);
      pool.subscribe(
        filters,
        relaysToUse,
        (event, onEose, url) => { events.push(event); },
        undefined,
        undefined,
        { unsubscribeOnEose: true, allowDuplicateEvents: false, allowOlderEvents: false }
      );
    } catch (error) {
      console.log('There was an error when loading petnames: ', error);
      //pool.close();
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
    const myPubkey = await window.nostr.getPublicKey();
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
    if (!petnameFound) {
      isEncrypted = true;
      dectags.push(["petname",petname]);
    }
    // Re-Encrypt the content
    let dec = JSON.stringify(dectags);
    enc = await window.nostr.nip44.encrypt(myPubkey, dec);
    newRelationship.content = enc;
  } else {
    // If no petname found, add to tags
    if (!petnameFound) {
      isCleartext = true;
      newRelationship.tags.push(["petname",petname]);
    }
  }

  // Sign and send newRelationship
  if(window.DEBUG) console.log(newRelationship);
  const EventSigned = await window.nostr.signEvent(newRelationship);
  await sleep(100);
  if(window.DEBUG) console.log(EventSigned);
  const defaultRelays = getDefaultOutboxRelays();
  const myPubkey = await window.nostr.getPublicKey();
  const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
  let myOutboxRelays = [];
  if (userRelays?.length == 0) {
    const myNpub = nip19.npubEncode(myPubkey);
    myOutboxRelays = await getOutboxRelays(myPubkey);
    updateCacheOutboxRelays(myOutboxRelays, myNpub);
  }
  const relaysToUse = unique([...myOutboxRelays, ...userRelays, ...defaultRelays]);
  //const pool = new RelayPool();
  pool.publish(EventSigned, relaysToUse);
  const sleeping = await sleep(100);
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
  //let nwcSecret = localStorage.getItem('nwc.secret');
  if (!nwcWSPubkey || !nwcRelay || !nwcSecret) {
    return undefined;
  }
  return `nostr+walletconnect:${nwcWSPubkey}?relay=${nwcRelay}&secret=${nwcSecret}`;   
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
  const eventSigned = await window.nostr.signEvent(event);
  if (!eventSigned) {
    return [false, 'There was an error with your nostr extension'];
  } else {
    // push to relays
    const defaultRelays = getDefaultOutboxRelays();
    const myPubkey = await window.nostr.getPublicKey();
    const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
    let myOutboxRelays = [];
    if (userRelays?.length == 0) {
      const myNpub = nip19.npubEncode(myPubkey);
      myOutboxRelays = await getOutboxRelays(myPubkey); // (async() => {await getOutboxRelays(myPubkey)})();
      updateCacheOutboxRelays(myOutboxRelays, myNpub);
    }
    const relaysToUse = unique([...myOutboxRelays, ...userRelays, ...defaultRelays]);
    //const pool = new RelayPool();
    pool.publish(eventSigned, relaysToUse);
    const sleeping = await sleep(100);
    //pool.close();
    return [true, ''];
  }  
}

export async function getCBadgeConfigsForPubkey(pubkey) {
  if(window.DEBUG) console.log("in getCBadgeIdsForPubkey for pubkey ", pubkey);
  return new Promise(async(res, rej) => {
    //const pool = new RelayPool();
    try {
      let events = [];
      const defaultRelays = getDefaultOutboxRelays();
      const myPubkey = await window.nostr.getPublicKey();
      const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
      let myOutboxRelays = [];
      if (userRelays?.length == 0) {
        const myNpub = nip19.npubEncode(myPubkey);
        myOutboxRelays = await getOutboxRelays(myPubkey); // (async() => {await getOutboxRelays(myPubkey)})();
        if(window.DEBUG) console.log('myOutboxRelays from await call', myOutboxRelays);
        updateCacheOutboxRelays(myOutboxRelays, myNpub);
      }
      const relaysToUse = unique([...myOutboxRelays, ...userRelays, ...defaultRelays]);
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
        //pool.close();
        res(foundBadgeConfigs);
      }, 3000);
      pool.subscribe(
        filters,
        relaysToUse,
        (event, onEose, url) => { events.push(event); },
        undefined,
        undefined,
        { unsubscribeOnEose: true, allowDuplicateEvents: false, allowOlderEvents: false }
      );
    } catch (error) {
      console.log('There was an error when getting badges: ', error);
      //pool.close();
      rej(undefined);
    }
  });
}

export async function sendLiveChat(roomATag, textchat) {
  if (!window.nostr) return;
  let kind = 1311;
  let tags = [
    ["a", roomATag]
  ];
  let event = {
    id: null,
    pubkey: null,
    created_at: Math.floor(Date.now() / 1000),
    kind: kind,
    tags: tags,
    content: textchat,
    sig: null,
  };
  const eventSigned = await window.nostr.signEvent(event);
  if (!eventSigned) {
    return [false, 'There was an error with your nostr extension'];
  } else {
    // push to relays
    const defaultRelays = getDefaultOutboxRelays();
    const myPubkey = await window.nostr.getPublicKey();
    const userRelays = getCachedOutboxRelaysByPubkey(myPubkey);
    let myOutboxRelays = [];
    if (userRelays?.length == 0) {
      const myNpub = nip19.npubEncode(myPubkey);
      myOutboxRelays = await getOutboxRelays(myPubkey); // (async() => {await getOutboxRelays(myPubkey)})();
      updateCacheOutboxRelays(myOutboxRelays, myNpub);
    }
    const relaysToUse = unique([...myOutboxRelays, ...userRelays, ...defaultRelays]);
    //const pool = new RelayPool();
    pool.publish(eventSigned, relaysToUse);
    const sleeping = await sleep(100);
    //pool.close();
    return [true, ''];
  }  
}