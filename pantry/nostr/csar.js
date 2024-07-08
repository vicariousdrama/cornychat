const {get, set} = require('../services/redis');
const {nip19, validateEvent, verifyEvent } = require('nostr-tools');

module.exports = {
    saveCSAR,
};

// only npubs get achievements saved
async function saveCSAR(senderId, roomId, data) {
    // {created: x, achievementId: {d: date-of-first-instance, c: count, r: [roomId,roomId2]}}
    let csar = data;
    if (data.data != undefined) csar = data.data;
    let userId = senderId.split('.')[0];
    // lookup user record to get npub
    let npubs = await getNpubs([userId]);
    if (npubs == undefined || npubs.length == 0) return;
    let npub = npubs[0];
    if (npub == undefined || npub.length == 0) return; 
    // the date
    let dt = new Date();
    let dti = dt.toISOString();
    let dts = dti.replaceAll('-','').replace('T','').replace(':','').slice(0,12); // YYYYMMDDHHmm
    let k = `userachievements/${npub}`;
    let v = await get(k);
    // not yet set, initialize object
    if (v == undefined || v == null) v = {created: dts}
    // not yet have achievement, initialize to date and 1 count
    if (!v.hasOwnProperty(csar)) {
      v[csar] = {f: dts, l: dts, c: 1, r: [roomId]}; // (f)irst, (l)ast, (c)ount, (r)ooms
      set(k, v);
      return;
    }
    // have achievement, check last time (max once per minute)
    let l = v[csar]["l"];
    if (l != undefined && l == dts) return;
    l = dts;
    v[csar]["l"] = l;
    let c = v[csar]["c"];
    if (c == undefined) c = 0;
    v[csar]["c"] = c + 1;
    let r = v[csar]["r"];
    if (r == undefined) r = [];
    if (!r.includes(roomId)) r.push(roomId);
    v[csar]["r"] = r;
    set(k, v);
  }
  
  async function getNpubs(identityKeys) {
    let npubs = [];
    for (let identityKey of identityKeys) {
      try {
        const identityInfo = await get('identities/' + identityKey);
        if (!identityInfo) continue;
        if (!identityInfo.identities) continue;
        for (let ident of identityInfo.identities) {
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
          let tags = (ident.verificationInfo ? [] : [[]]);
          let e = {
            id: i,
            pubkey: p,
            created_at: c,
            kind: 1,
            tags: tags,
            content: identityKey,
            sig: s,
          };
          let u = validateEvent(e);
          let v = verifyEvent(e);
          r = (u && v);
          if (r) npubs.push(n);
        }
      } catch (error) {
        console.log('error in getNpubs conversion for identity: ', identityKey, error);
      }
    }
    return npubs;
  }