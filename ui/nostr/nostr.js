import {nip19, validateEvent, verifySignature, getPublicKey} from 'nostr-tools';
import {RelayPool} from 'nostr-relaypool';
import {nanoid} from 'nanoid';
import crypto from 'crypto-js';
import {bech32} from 'bech32';
import {Buffer} from 'buffer';

async function getUserRelays() {
  let userRelays = [];
  if (window.nostr) {
    const relays = await window.nostr.getRelays();
    const relaysSet = Object.keys(relays).length !== 0;
    if (relaysSet) {
      for (const relay in relays) {
        if (relays[relay].read) {
          if (relay.indexOf('nostr-pub.wellorder.net') > -1) continue;
          if (relay.indexOf('nostr1.tunnelsats.com') > -1) continue;
          if (relay.indexOf('relayer.fiatjaf.com') > -1) continue;
          if (relay.indexOf('relay.nostr.info') > -1) continue;
          if (relay.indexOf('nostr-relay.wlvs.space') > -1) continue;
          const startWithWss = relay.startsWith('wss://');
          startWithWss
            ? userRelays.push(relay)
            : userRelays.push('wss://' + relay);
        }
      }
    }
  }
  return userRelays;
}

export async function signInExtension(
  state,
  setProps,
  updateInfo,
  enterRoom
) {
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
    let identities = [{type: 'nostr', id: npub, loginTime: created_at, loginId: signedLogin.id, loginSig: signedLogin.sig}];
    let metadata = await getUserMetadata(pubkey, id);
    setProps({userInteracted: true});
    if (!metadata) {
      await updateInfo({identities});
    } else {
      let name = metadata.name;
      let avatar = metadata.picture;
      await updateInfo({
        name,
        identities,
        avatar,
      });
    }
    await enterRoom(roomId);
  } catch (error) {
    console.log('There was an error logging in with extension: ', error);
    return undefined;
  }
}

export async function getUserEvent(pubkey, id) {
  return new Promise((res, rej) => {
    const pool = new RelayPool();
    try {
      const defaultRelays = [
        'wss://nos.lol',
        'wss://relay.damus.io',
        //'wss://nostr-pub.wellorder.net',
        'wss://nostr.mutinywallet.com',
        'wss://relay.snort.social',
        'wss://relay.primal.net',
      ];

      const userRelays = []; // getUserRelays();

      const relaysToUse = [...userRelays, ...defaultRelays];
      const filter = [{kinds: [1], authors: [pubkey], ids: [id]}];
      const npub = nip19.npubEncode(pubkey);

      //check if i can use a variable set to true or false
      let userEvents = [];

      const timeoutRelays = setTimeout(() => {
        if (userEvents.length === 0) {
          pool.close();
          res(undefined);
          console.log('Nostr relays did not return any events');
        }
      }, 2700);

      pool.subscribe(
        filter,
        relaysToUse,
        (event, afterEose, url) => {
          clearTimeout(timeoutRelays);
          userEvents.push(event);
          pool.close();
          res(event);
        },
        undefined,
        undefined,
        {unsubscribeOnEose: true}
      );
    } catch (error) {
      pool.close();
      rej(undefined);
      console.log('There was an error when getting user events: ', error);
    }
  });
}

export async function getUserMetadata(pubkey, id) {
  return new Promise((res, rej) => {
    const pool = new RelayPool();
    try {
      const defaultRelays = [
        'wss://nos.lol',
        'wss://relay.damus.io',
        'wss://nostr.mutinywallet.com',
        'wss://relay.snort.social',
        'wss://relay.primal.net',
      ];

      const userRelays = []; // getUserRelays();
      //console.log(userRelays);

      const relaysToUse = [...userRelays, ...defaultRelays];
      const filter = [{kinds: [0], authors: [pubkey]}];
      const npub = nip19.npubEncode(pubkey);

      //check if i can use a variable set to true or false
      let userMetadata = [];

      const timeoutRelays = setTimeout(() => {
        if (userMetadata.length === 0) {
          pool.close();
          res(undefined);
          console.log('Nostr relays did not return any events');
        }
      }, 3000);

      pool.subscribe(
        filter,
        relaysToUse,
        (event, afterEose, url) => {
          userMetadata.push(JSON.parse(event.content));
          const userInfo = {
            name: userMetadata[0]?.name, // (userMetadata[0].display_name === '' ? (userMetadata[0].name === '' ? null : userMetadata[0].name) : userMetadata[0].display_name),
            id: id,
            picture: userMetadata[0]?.picture,
            npub: npub,
            about: userMetadata[0]?.about,
            nip05: userMetadata[0]?.nip05,
            lud16: userMetadata[0]?.lud16,
            lud06: userMetadata[0]?.lud06,
            banner: userMetadata[0]?.banner,
          };
          pool.close();
          res(userInfo);
        },
        undefined,
        undefined,
        {unsubscribeOnEose: true}
      );
    } catch (error) {
      pool.close();
      rej(undefined);
      console.log('There was an error when getting user metadata: ', error);
    }
  });
}

export async function isOnFollowList(actorPubkey, userPubkey) {
  return new Promise(async (res, rej) => {
    const pool = new RelayPool();
    try {
      let userRelays = []; //getUserRelays();

      const defaultRelays = [
        'wss://nos.lol',
        'wss://relay.damus.io',
        //'wss://nostr-pub.wellorder.net',
        'wss://nostr.mutinywallet.com',
        'wss://relay.snort.social',
        'wss://relay.primal.net',
      ];

      const relaysToUse = [...userRelays, ...defaultRelays];

      const filter = [{kinds: [3], authors: [actorPubkey]}];

      let events = [];

      setTimeout(() => {
        const lastEvent = events[events.length - 1];

        const followList = lastEvent.tags;

        const isOnList = isOnFollowList();

        if (isOnList) {
          pool.close();
          res([true, followList]);
        }

        if (!isOnList) {
          pool.close();
          res([false, followList]);
        }

        function isOnFollowList() {
          for (let i = 0; i < followList.length; i++) {
            if (followList[i][1] === userPubkey) {
              return true;
            }
          }

          return false;
        }
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
      pool.close();
      rej(undefined);
      console.log('There was an error while fetching follow list: ', error);
    }
  });
}

export async function signInPrivateKey(
  privateKey,
  state,
  setProps,
  updateInfo,
  enterRoom,
  addNostrPrivateKey
) {
  try {
    const isValidLength = privateKey.length === 63 || privateKey.length === 64;

    if (!isValidLength) {
      throw new Error('Invalid private key length');
    }

    const nostrPrivateKey = privateKey.startsWith('nsec') ? nip19.decode(privateKey).data : privateKey;
    const roomId = state.roomId;
    const {cipherText, encryptionKey} = encryptPrivatekey(nostrPrivateKey);
    const payload = [state.myId, cipherText, encryptionKey];

    const ok = await addNostrPrivateKey(state, roomId, payload);

    if (!ok) {
      throw new Error('Failed to add nostr private key');
    }

    const userId = state.myId;
    const userPubkey = getPublicKey(nostrPrivateKey);
    let metadata = await getUserMetadata(userPubkey, userId);

    if (!metadata) {
      const npub = nip19.npubEncode(userPubkey);
      setProps({userInteracted: true});
      const identities = [{type: 'nostr', id: npub}];
      await updateInfo({identities});
      await enterRoom(roomId);
    } else {
      const name = metadata.name;
      const avatar = metadata.picture;
      const identities = [{type: 'nostr', id: metadata.npub}];

      setProps({userInteracted: true});
      await updateInfo({name, identities, avatar});
      await enterRoom(roomId);
    }
  } catch (error) {
    console.log('There was an error when setting up user session: ', error);
    return undefined;
  }
}

export async function sendZaps(npub, comment, amount, state, signEvent) {
  try {
    // Validate and set sats
    let satsAmount = parseInt(amount);
    if (!(satsAmount > 0)) {
      throw new Error('Sats amount must be higher than 0');
    }
    satsAmount = satsAmount * 1000;

    // Get metadata to lookup lightning address for users npub
    const receiverPubkey = nip19.decode(npub).data;
    const id = null;
    const metadata = await getUserMetadata(receiverPubkey, id);
    if (!metadata) {
      throw new Error('Relays did not find any kind 0 event for this npub.');
    }

    // Determine lightning address to use
    let lightningAddress = null;
    if (metadata.lud06 !== '') lightningAddress = metadata.lud06;
    if (metadata.lud16 !== '') lightningAddress = metadata.lud16;

    if (!lightningAddress) {
      throw new Error('Lightning address not found for this npub.');
    }

    const LnService = await getLNService(lightningAddress);

    if (LnService.hasOwnProperty('error')) {
      throw new Error(LnService.reason);
    }

    const signedEvent = await getZapEvent(
      comment,
      receiverPubkey,
      satsAmount,
      state,
      signEvent
    );

    if (!signedEvent[0]) {
      const lnInvoice = await getLNInvoice(
        null,
        lightningAddress,
        LnService,
        satsAmount
      );
      console.log('ui/nostr/nostr.js', lnInvoice);
      return [true, lnInvoice.pr];
    }

    const lnInvoice = await getLNInvoice(
      signedEvent[1],
      lightningAddress,
      LnService,
      satsAmount
    );

    return [true, lnInvoice.pr];
  } catch (error) {
    console.log('There was an error: ', error);
    return [undefined, error];
  }
}

export async function openLNExtension(LNInvoice) {
  try {
    if (!window.webln) return undefined;
    await window.webln.enable();
    const result = await window.webln.sendPayment(LNInvoice);
    return result;
  } catch (error) {
    return undefined;
  }
}

export function setDefaultZapsAmount(amount) {
  localStorage.setItem('defaultZap', amount);
}

export async function unFollowUser(
  npub,
  myFollowList,
  state,
  roomId,
  signEvent
) {
  const pool = new RelayPool();

  const userPubkey = nip19.decode(npub).data;

  const defaultRelays = [
    'wss://nos.lol',
    'wss://relay.damus.io',
    //'wss://nostr-pub.wellorder.net',
    'wss://nostr.mutinywallet.com',
    'wss://relay.snort.social',
    'wss://relay.primal.net',
  ];

  let userRelays = []; // getUserRelays();

  const indexToRemove = myFollowList.findIndex(childArray =>
    childArray.includes(userPubkey)
  );

  if (indexToRemove !== -1) {
    myFollowList.splice(indexToRemove, 1);
  }

  const event = {
    id: null,
    pubkey: null,
    created_at: Math.floor(Date.now() / 1000),
    kind: 3,
    tags: myFollowList,
    content: '',
    sig: null,
  };

  if (window.nostr) {

    const relaysToUse = [...userRelays, ...defaultRelays];

    const EventSigned = await window.nostr.signEvent(event);
    if (!EventSigned)
      return [null, 'There was an error with your nostr extension'];

    pool.publish(EventSigned, relaysToUse);
    pool.close();
    updateCache(false, npub, myFollowList);

    return [true];
  }

  const signedEvent = await signEvent(state, roomId, event);

  const hasError = signedEvent.hasOwnProperty('error');

  if (hasError) return [null, signedEvent.error];

  pool.publish(signedEvent.nostrEvent, defaultRelays);
  pool.close();
  updateCache(false, npub, myFollowList);

  return [true];
}

export async function followUser(npub, myFollowList, state, roomId, signEvent) {
  const pool = new RelayPool();
  const userPubkey = nip19.decode(npub).data;

  myFollowList.push(['p', userPubkey]);

  const defaultRelays = [
    'wss://nos.lol',
    'wss://relay.damus.io',
    //'wss://nostr-pub.wellorder.net',
    'wss://nostr.mutinywallet.com',
    'wss://relay.snort.social',
    'wss://relay.primal.net',
  ];

  let userRelays = []; // await getUserRelays();

  const event = {
    id: null,
    pubkey: null,
    created_at: Math.floor(Date.now() / 1000),
    kind: 3,
    tags: myFollowList,
    content: '',
    sig: null,
  };

  if (window.nostr) {

    const relaysToUse = [...userRelays, ...defaultRelays];

    const EventSigned = await window.nostr.signEvent(event);

    if (!EventSigned)
      return [null, 'There was an error with your nostr extension'];

    pool.publish(EventSigned, relaysToUse);
    pool.close();
    updateCache(true, npub, myFollowList);

    return [true];
  }

  const signedEvent = await signEvent(state, roomId, event);
  const hasError = signedEvent.hasOwnProperty('error');

  if (hasError) return [null, signedEvent.error];

  pool.publish(signedEvent, defaultRelays);
  pool.close();
  updateCache(true, npub, myFollowList);

  return [true];
}

export async function verifyNip05(nip05, userNpub) {
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

async function getLNService(address) {
  let isLNUrl = address.toLowerCase().startsWith('lnurl');
  let isDecodedAddress = address.includes('@');

  if (isLNUrl) {
    let decoded = bech32.decode(address, 2000);
    let buf = bech32.fromWords(decoded.words);
    let decodedLNurl = new TextDecoder().decode(Uint8Array.from(buf));

    let service = decodedLNurl.split('@');
    let url = `https://${service[1]}/.well-known/lnurlp/${service[0]}`;

    let data = await (await fetch(url)).json();

    return data;
  }

  if (isDecodedAddress) {
    let service = address.split('@');
    let url = `https://${service[1]}/.well-known/lnurlp/${service[0]}`;

    let data = await (await fetch(url)).json();

    return data;
  }
}

async function getLNInvoice(zapEvent, lightningAddress, LNService, amount) {
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
    const data = await fetchInvoice(baseUrl);
    return data;
  }
}

async function getZapEvent(content, receiver, amount, state, signEvent) {
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

  const signedEvent = await signEvent(state, state.roomId, event);
  const hasError = signedEvent.hasOwnProperty('error');

  if (hasError) return [null, signedEvent.error];

  const eventSignedEncoded = encodeURI(JSON.stringify(signedEvent.nostrEvent));

  return [true, eventSignedEncoded];
}

function encryptPrivatekey(privateKey) {
  const textToEncode = privateKey;
  const encryptionKey = nanoid();

  const cipherText = crypto.AES.encrypt(textToEncode, encryptionKey).toString();

  return {cipherText, encryptionKey};
}

function updateCache(iFollow, npub, followList) {
  let newCache = JSON.parse(sessionStorage.getItem(npub));
  newCache.iFollow = iFollow;

  newCache = JSON.stringify(newCache);
  let newFollowingList = JSON.stringify(followList);

  sessionStorage.setItem(npub, newCache);
  sessionStorage.setItem('myFollowList', newFollowingList);
}

export const isValidNostr = (info) => {
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
  switch(kind) {
    case 30388: return "Corny Chat Slide Set";
    case 31388: return "Corny Chat Link Set";
    case 32388: return "Corny Chat Room Favorites";
    default: return "Unlabeled Kind";
  }
}

export async function saveList(dTagValue, name, about, image, kind, theList) {
  const pool = new RelayPool();
  const defaultRelays = [
    'wss://nos.lol',
    'wss://relay.damus.io',
    //'wss://nostr-pub.wellorder.net',
    'wss://nostr.mutinywallet.com',
    'wss://relay.snort.social',
    'wss://relay.primal.net',
  ];
  //let dTagValue = "cornychat-" + name.replace(/[^A-Za-z0-9]/g, '');
  let l = getLabelForKind(kind);
  let iUrl = 0;
  let iCaption = 1;
  switch(kind) {
    case 30388: 
      iUrl = 0;
      iCaption = 1;
      break;
    case 31388:
      iUrl = 1;
      iCaption = 0;
      break;
    case 32388:
      iUrl = 0;
      iCaption = 1;
      break;
  }
  let tags = [
    ["name", name],
    ["about", about],
    ["image", image],
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
    pool.close();
    return [false, 'There was an error with your nostr extension'];
  } else {
    console.log(eventSigned);
    // push to relays
    pool.publish(eventSigned, defaultRelays);
    pool.close();
    return [true, ''];
  }  
}

export async function loadList(kind, pubkey) {
  return new Promise((res, rej) => {
    const pool = new RelayPool();
    try {
      let events = [];
      const defaultRelays = [
        'wss://nos.lol',
        'wss://relay.damus.io',
        'wss://nostr.mutinywallet.com',
        'wss://relay.snort.social',
        'wss://relay.primal.net',
      ];
      const userRelays = []; // getUserRelays();
      const relaysToUse = [...userRelays, ...defaultRelays];
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
        pool.close();
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
      pool.close();
      rej(undefined);
      console.log('There was an error when getting user metadata: ', error);
    }
  });
}