const {RelayPool} = require('nostr-relaypool');
const {nip19} = require('nostr-tools');
const {isValidLoginSignature} = require('../nostr/nostr');

function decodeNote(noteId) {
  //console.log("decoding note with id ", noteId);
  const note = nip19.decode(noteId);
  const type = note.type;
  //console.log(note);
  //console.log(type);
  if (type === 'nevent') {
    return note.data.id;
  }
  if (type === 'note') {
    return note.data;
  }
}

const verify = (identity, publicKey) => {
  return new Promise((res, rej) => {
    // nip-07 user performing message signing
    if (identity.loginTime) {
      try {
        const hasRequiredFields = (identity.type && identity.id && identity.loginTime && identity.loginId && identity.loginSig);
        if (!hasRequiredFields) {
          const error_msg = `Invalid nostr identity. Missing required fields`;
          rej(new Error(error_msg));
        }
        if (identity.type != 'nostr') {
          const error_msg = `Invalid nostr identity. Value for type is not set to nostr`;
          rej(new Error(error_msg));
        }
        let p = nip19.decode(identity.id).data;
        let r = isValidLoginSignature(identity.loginId,p,identity.loginTime,publicKey,identity.loginSig)
        if (!r) {
          const error_msg = `Invalid nostr identity. Event invalid or signature did not match expected value`;
          rej(new Error(error_msg));
        }
        res(true);
      } catch(error) {
        console.log(error);
        rej(error);        
      }
    }

    // anonymous user providing nostr note id
    if (identity.verificationInfo) {
      const pool = new RelayPool();

      try {
        const noteId = identity.verificationInfo;
        const nostrPubkey = nip19.decode(identity.id).data;
        const isValidEvent = noteId.startsWith('note') || noteId.startsWith('nevent');

        if (!isValidEvent) {
          const error_msg = `Invalid nostr noteId: ${identity.verificationInfo}`;
          rej(new Error(error_msg));
        }

        const decodedNote = decodeNote(noteId);

        const filter = [{ids: [decodedNote], authors: [nostrPubkey]}];

        const defaultRelays = [
          'wss://relay.damus.io',                 // poor due to throttling
          'wss://nos.lol',                        // misses some
          'wss://nostr-pub.wellorder.net',        // seems ok
          'wss://relay.snort.social',             // poor
          'wss://thebarn.nostr1.com',             // access to write is driven by ACL and API calls
          'wss://thebarn.nostrfreaks.com',        // access to write is driven by ACL and API calls      
        ];

        const checkEventReturned = setTimeout(() => {
          pool.close();
          const error_msg = `Relays did not return any events`;
          rej(new Error(error_msg));
        }, 2500);

        pool.subscribe(
          filter,
          defaultRelays,
          (event, isAfterEose, url) => {
            const isPublicKey = event.content.includes(publicKey);
            if (isPublicKey) {
              clearTimeout(checkEventReturned);
              pool.close();
              res(true);
            } else {
              const error_msg = `Nostr event does not contain public key ${publicKey}`;
              pool.close();
              rej(new Error(error_msg));
            }
          },
          undefined,
          undefined,
          {unsubscribeOnEose: true}
        );
      } catch (error) {
        console.log(error);
        pool.close();
        rej(error);
      }
    }

    // Neither nip-07 style or note style verification? Fail it
    rej(new Error(`Invalid nostr identity. Nonconforming to requirements`));
  });
};

module.exports = verify;
