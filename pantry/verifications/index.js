const verifiers = {
  nostr: require('./nostr.js'),
};

const verifyIdentities = async (identities, publicKey) => {
  if (Array.isArray(identities)) {
    for (const identity of identities) {
      if (!verifiers[identity.type]) {
        throw new Error(`No verifier for identity type ${identity.type}`);
      }
      if (identity.verificationInfo || identity.loginTime) {
        let isok = await verifiers[identity.type](identity, publicKey);
      }
    }
  } else {
    throw new Error('Identities object is not an array');
  }
};

module.exports = verifyIdentities;
