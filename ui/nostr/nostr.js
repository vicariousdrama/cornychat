import {nip19, getPublicKey} from 'nostr-tools';
import {RelayPool} from 'nostr-relaypool';
import {nanoid} from 'nanoid';
import crypto from 'crypto-js';
import {bech32} from 'bech32';

export async function signInExtension(
  id,
  roomId,
  setProps,
  updateInfo,
  enterRoom
) {
  try {
    if (!window.nostr) {
      throw new Error('There is not nostr extension available');
    }
    const pubkey = await window.nostr.getPublicKey();
    const relays = await window.nostr.getRelays();

    const metadata = await getUserMetadata(pubkey, relays, id);

    if (!metadata) {
      setProps({userInteracted: true});
      await updateInfo();
      await enterRoom(roomId);
      return;
    }

    let name = metadata.name;
    let avatar = metadata.picture;
    let identities = [{type: 'nostr', id: metadata.npub}];

    setProps({userInteracted: true});
    await updateInfo({
      name,
      identities,
      avatar,
    });
    await enterRoom(roomId);
  } catch (error) {
    return undefined;
  }
}

export async function getUserMetadata(pubkey, relays, id) {
  return new Promise((res, rej) => {
    try {
      const defaultRelays = [
        'wss://nos.lol',
        'wss://relay.damus.io',
        'wss://nostr-pub.wellorder.net',
        'wss://nostr.mutinywallet.com',
        'wss://relay.snort.social',
        'wss://relay.primal.net',
      ];

      const relaysSet = Object.keys(relays).length !== 0;

      const userRelays = [];

      if (relaysSet) {
        for (const relay in relays) {
          if (relays[relay].read) {
            const startWithWss = relay.startsWith('wss://');

            startWithWss
              ? userRelays.push(relay)
              : userRelays.push('wss://' + relay);
          }
        }
      }

      const relaysToUse = [...userRelays, ...defaultRelays];
      const filter = [{kinds: [0], authors: [pubkey]}];
      const npub = nip19.npubEncode(pubkey);

      const pool = new RelayPool();

      //check if i can use a variable set to true or false
      let userMetadata = [];

      const timeoutRelays = setTimeout(() => {
        if (userMetadata.length === 0) {
          res(undefined);
          console.log('Nostr relays did not return any events');
        }
      }, 2700);

      pool.subscribe(
        filter,
        relaysToUse,
        (event, afterEose, url) => {
          clearTimeout(timeoutRelays);
          userMetadata.push(JSON.parse(event.content));

          const userInfo = {
            name:
              userMetadata[0].display_name === ''
                ? null
                : userMetadata[0].display_name,
            id: id,
            picture: userMetadata[0].picture,
            npub: npub,
            lud16: userMetadata[0].lud16,
            lud06: userMetadata[0].lud06,
          };
          res(userInfo);
        },
        undefined,
        undefined,
        {unsubscribeOnEose: true}
      );
    } catch (error) {
      rej(undefined);
      console.log('There was an error when getting user metadata: ', error);
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

    const nostrPrivateKey = privateKey.startsWith('nsec')
      ? nip19.decode(privateKey).data
      : privateKey;
    const roomId = state.roomId;
    const {cipherText, encryptionKey} = encryptPrivatekey(nostrPrivateKey);
    const payload = [state.myId, cipherText, encryptionKey];

    const ok = await addNostrPrivateKey(state, roomId, payload);

    if (!ok) {
      throw new Error('Failed to add nostr private key');
    }

    const userId = state.myId;
    const userPubkey = getPublicKey(nostrPrivateKey);
    let metadata = await getUserMetadata(userPubkey, [], userId);

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
    const receiverPubkey = nip19.decode(npub).data;
    const id = null;
    const metadata = await getUserMetadata(receiverPubkey, {}, id);
    let lightningAddress = null;

    let satsAmount = parseInt(amount);

    if (!(satsAmount > 0)) {
      throw new Error('Sats amount must be higher than 0');
    }

    satsAmount = satsAmount * 1000;

    if (!metadata) {
      throw new Error('Relays did not find any kind 0 event for this npub.');
    }

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
      throw new Error(signedEvent[1]);
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
  await window.webln.enable();

  const result = await window.webln.sendPayment(LNInvoice);

  console.log('this is result: ', result);

  return result;
}

export function setDefaultZapsAmount(amount) {
  localStorage.setItem('defaultZap', amount);
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

async function getLNInvoice(zapEvent, lnAddress, LNService, amount) {
  let hasPubkey = LNService.nostrPubkey;
  const encodedLnAddress = bech32.encode('lnurl', lnAddress);
  let baseUrl = `${LNService.callback}?amount=${amount}`;

  async function fetchInvoice(baseUrl) {
    const response = await fetch(baseUrl);
    const invoice = await response.json();

    return invoice;
  }

  if (hasPubkey) {
    baseUrl += `&nostr=${zapEvent}&lnurl=${encodedLnAddress}`;
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
        'wss://nostr-pub-wellorder.net/',
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
