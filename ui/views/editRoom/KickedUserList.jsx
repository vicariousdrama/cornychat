import React, {useState} from 'react';
import {Trash} from '../Svg';
import {get} from '../../jam-core/backend';
import {isValidNostr, getNpubFromInfo, getRelationshipPetname, makeLocalDate} from '../../nostr/nostr';
import {avatarUrl, displayName} from '../../lib/avatar';
import {useMqParser} from '../../lib/tailwind-mqp';

export function KickedUserList({
  allowModify,
  room,
  roomId,
  userlist,
  setUserlist,
  label,
  textColor,
  roomColor,
}) {
  let mqp = useMqParser();  
  let [expanded, setExpanded] = useState(false);
  let [npubValue, setNpubValue] = useState('');
  // Build map of users with identities information, leveraging cache if available
  let umap = {};
  let userids = [];
  for(let u of userlist) {
    if (!userids.includes(u.id)) userids.push(u.id);
    if (!userids.includes(u.kickedBy)) userids.push(u.kickedBy);
  } 
  BuildIdentityMap(umap, userids);

  function BuildIdentityMap(umap, identities) {
    for(let i = 0; i < identities.length; i ++) {
      let id = identities[i];
      if (id.length == 43) {
        let jamId = id;
        const sessionStoreIdent = sessionStorage.getItem(jamId);
        if (sessionStoreIdent != null) {
          umap[jamId] = JSON.parse(sessionStoreIdent);
        } else {
          (async () => {
              let [remoteIdent, ok] = await get(`/identities/${jamId}`);
              if (ok) {
                  sessionStorage.setItem(jamId, JSON.stringify(remoteIdent));
              } else {
              }
              umap[jamId] = remoteIdent;
          })();
        }
      }
      //TODO: if id.startswith("npub1") and id.length == 63, then treat as npub for any lookups
    }
  }
  
  function removeUser(indexUser, userDeleting) {
    let newUserlist = userlist.filter((user, index) =>
      index !== indexUser ? user : null
    );
    setUserlist(newUserlist);
  }

  return (

    <div>
      <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpanded(!expanded)}>
      {expanded ? '🔽' : '▶️'} {label}
      </p>
      <div className={expanded ? '' : 'hidden'}>
      <div className="mb-2 bg-gray-300 py-2 px-4 my-5 rounded-lg">

      {userlist.length === 0 && (
        <div>
          <p className="text-sm text-gray-500 p-2">
            There are no users of this kind.
          </p>
        </div>
      )}

      {userlist.map((user, index) => {
        if (user.id in umap) {
          let info = umap[user.id];
          if (info) {
            let userDisplayName = info?.name ?? '';
            if (userDisplayName.length == 0) {
                userDisplayName = displayName(info, room);
            }
            let userNpub = getNpubFromInfo(info);
            if (userNpub != undefined) {
              userDisplayName = getRelationshipPetname(userNpub, userDisplayName);
            }          
            let userAvatar = avatarUrl(info, room);
            let isNostrSigned = isValidNostr(info);
            let reason = user.reason;
            let until = makeLocalDate(Math.floor(user.until/1000));
            let kickedby = undefined;
            let kickedbyinfo = umap[user.kickedBy];
            if (kickedbyinfo) {
                kickedby = kickedbyinfo?.name ?? '';
                if (kickedby.length == 0) {
                    kickedby = displayName(kickedbyinfo, room);
                }
                let kickedbyNpub = getNpubFromInfo(kickedbyinfo);
                if (kickedbyNpub != undefined) {
                    kickedby = getRelationshipPetname(kickedbyNpub, kickedby);
                }
            }
            return (
                <div className="flex w-full justify-between my-3">
                <div className="flex-none">
                    <img src={userAvatar} style={{width:'32px',height:'32px'}} />
                </div>
                <div className="flex-none text-xs">{isNostrSigned ? (
                    <div title={'Verified Signature by Nostr Pubkey'}>
                    <img
                        style={{width:'auto',height:'32px'}}
                        alt={'Verified Signature by Nostr Pubkey'}
                        src={'/img/symbols/nostr-icon-purple-256x256.png'}
                    />
                    </div>
                ) : (
                    <div title={'Anonymous'}>
                    <img
                        style={{width:'auto',height:'32px'}}
                        alt={'Anonymous'}
                        src={'/img/symbols/guyfawkes.png'}
                    />
                    </div>
                )}
                </div>
                <div className="flex-grow">
                    {' '}
                    <p className="text-sm text-black" style={{overflowWrap: 'break-word'}}>{userDisplayName}</p>
                    {kickedby && (
                    <p className="text-sm text-black" style={{overflowWrap: 'break-word'}}>kickedby: {kickedby}</p>
                    )}
                    <p className="text-sm text-black" style={{overflowWrap: 'break-word'}}>reason: {reason}</p>
                    <p className="text-sm text-black" style={{overflowWrap: 'break-word'}}>until: {until}</p>
                </div>
                {allowModify && (
                <div className="flex-none cursor-pointer hover:bg-red-500" onClick={() => removeUser(index, user)} >
                    <Trash />
                </div>
                )}
                </div>
            );
          }
        } else {
          if (user.id.startsWith("npub1")) {
            let petname = localStorage.getItem(`${user.id}.petname`);
            return (
              <div className="flex w-full justify-between my-3">
              <div className="flex-none text-xs">
                <div title={'Nostr pubkey in npub format'}>
                  <img
                      style={{width:'auto',height:'32px'}}
                      alt={'Nostr pubkey in npub format'}
                      src={'/img/symbols/nostr-icon-bw-256x256.png'}
                  />
                </div>
              </div>
              <div className="flex-grow text-xs text-black break-words w-24 max-w-24">{petname || user.id}</div>
              {allowModify && (
              <div className="flex-none cursor-pointer hover:bg-red-500" onClick={() => removeUser(index, user)} >
                  <Trash />
              </div>
              )}
              </div>
          );
          }
        }
      })}

      </div>
      </div>
    </div>
  );
}
