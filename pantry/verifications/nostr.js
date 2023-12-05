const {RelayPool} = require('nostr-relaypool');
const {nip19} = require('nostr-tools');

const verify = (identity, publicKey) => {
  return new Promise((res, rej) => {
    try {
      const noteId = identity.verificationInfo;
      const nostrPubkey = nip19.decode(identity.id).data;

      if (!noteId.startsWith('note')) {
        throw new Error(`Invalid nostr noteId: ${identity.verificationInfo}`);
      }

      const decodedNote = nip19.decode(noteId).data;

      const filter = [{ids: [decodedNote], authors: [nostrPubkey]}];

      const defaultRelays = [
        'wss://nos.lol',
        'wss://relay.damus.io',
        'wss://nostr-pub.wellorder.net',
        'wss://nostr.mutinywallet.com',
        'wss://relay.snort.social',
        'wss://relay.primal.net',
      ];

      const pool = new RelayPool();

      const checkEventReturned = setTimeout(() => {
        const error_msg = `Relays did not returned any events`;
        throw new Error(error_msg);
      }, 2500);

      pool.subscribe(
        filter,
        defaultRelays,
        (event, isAfterEose, url) => {
          const isPublicKey = event.content === publicKey;
          if (isPublicKey) {
            clearTimeout(checkEventReturned);
            res(true);
          } else {
            const error_msg = `Nostr event does not contain public key ${publicKey}`;
            rej(new Error(error_msg));
          }
        },
        undefined,
        undefined,
        {unsubscribeOnEose: true}
      );
    } catch (error) {
      rej(error);
    }
  });
};

module.exports = verify;
