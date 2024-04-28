import React, {useState} from 'react';
import {Trash} from '../Svg';
import {get} from '../../jam-core/backend';
import {isValidNostr} from '../../nostr/nostr';
import {avatarUrl, displayName} from '../../lib/avatar';

export function UserList({
  allowDelete,
  room,
  roomId,
  userlist,
  setUserlist,
  userDeleteList,
  setUserDeletelist,
  label,
}) {
  let [expanded, setExpanded] = useState(false);
  // Build map of users with identities information, leveraging cache if available
  let umap = {};
  BuildIdentityMap(umap, userlist);

  function BuildIdentityMap(umap, identities) {
    for(let i = 0; i < identities.length; i ++) {
      let jamId = identities[i];
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
  }
  
  function UserList() {
    if (userlist.length === 0) {
      return (
        <div>
          <p className="text-sm text-gray-500 p-2">
            There are no users of this kind.
          </p>
        </div>
      );
    }

    function removeUser(indexUser, userDeleting) {
      let userJamId = userlist[indexUser];
      //jamRemove(roomId, userJamId);             // TODO: do this in edit room submit, not here
      let newUserlist = userlist.filter((user, index) =>
        index !== indexUser ? user : null
      );
      setUserlist(newUserlist);
      userDeleteList = [...userDeleteList, userDeleting];
      setUserDeletelist(userDeleteList);
    }
    return (
      <>
        {userlist.map((user, index) => {
          let info = umap[user];
          if (info) {
            let userDisplayName = info?.name ?? '';
            if (userDisplayName.length == 0) {
                userDisplayName = displayName(info, room);
            }
            let userAvatar = avatarUrl(info, room);
            let isNostrSigned = isValidNostr(info);
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
                </div>
                {allowDelete && (
                <div className="flex-none cursor-pointer hover:bg-red-500" onClick={() => removeUser(index, user)} >
                    <Trash />
                </div>
                )}
                </div>
            );
          } else {
            return '';
          }
        })}
      </>
    );
  }

  return (
    <div>
      <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpanded(!expanded)}>
      {expanded ? '🔽' : '▶️'} {label}
      </p>
      <div className={expanded ? '' : 'hidden'}>
      <div className="mb-2 bg-gray-300 py-2 px-4 my-5 rounded-lg">
        <UserList />
      </div>
      </div>
    </div>
  );
}
