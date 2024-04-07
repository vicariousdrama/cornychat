import React, {useState, useEffect} from 'react';
import {Modal, openModal} from './Modal';
import {
  getUserMetadata,
  followUser,
  unFollowUser,
  verifyNip05,
  getUserEventsByKind,
  getOutboxRelays,
  makeLocalDate,
  loadFollowList,
  updateCacheOutboxRelays,
} from '../nostr/nostr';
import {nip19} from 'nostr-tools';
import {avatarUrl, displayName} from '../lib/avatar';
import {CheckBadged, CopiedToClipboard, CopyToClipboard} from './Svg';
import {useJam, useApiQuery} from '../jam-core-react';
import {use} from 'use-minimal-state';
import {InvoiceModal} from './Invoice';
import EditIdentity from './EditIdentity';

export function Profile({info, room, peerId, iOwn, iModerate, actorIdentity, close}) {
  async function setUserMetadata() {
    if (!userNpub) return;
    const pubkey = nip19.decode(userNpub).data;
    const userMetadata = await getUserMetadata(pubkey, null);
    return userMetadata;
  }

  async function getUserPosts(actorNpub) {
    setLoadingPosts(true);
    if (!actorNpub) {
      setLoadingPosts(false);
      return undefined;
    }

    const kind = 1;
    const pubkey = nip19.decode(actorNpub).data;
    const currentTime = Math.floor(Date.now() / 1000); 
    let checkFrequency = 60; // 1 minute must pass before rechecking
    let userPostsTime = sessionStorage.getItem(`${pubkey}-kind${kind}events-retrieveTime`);
    let userPosts = sessionStorage.getItem(`${pubkey}-kind${kind}events`);
    if (userPostsTime == undefined || userPostsTime + checkFrequency < currentTime || userPosts == undefined) {
      const timeSince = currentTime - 86400; // last day
      userPosts = await getUserEventsByKind(pubkey, kind, timeSince);
    } else {
      userPosts = JSON.parse(userPosts);
    }
    //const userPosts = await getUserEventsByKind(pubkey, 1, timeSince);
    setLoadingPosts(false);
    return userPosts;
  }

  function checkNostrIdentity(identities) {
    const hasNostrIdentity = identities?.some(
      identity => identity.type === 'nostr'
    );
    return hasNostrIdentity;
  }

  function userIdentity(info) {
    const hasIdentity = info?.hasOwnProperty('identities');
    //console.log('in Profile.userIdentity',info?.name, info?.identities);
    if (hasIdentity && (info?.identities?.length > 0)) {
      return info.identities[0]?.id;
    }

    return undefined;
  }

  function iFollowUser(iFollow) {
    if (iFollow === 'npub not found') return;
    if (!window.nostr) return; // dont show follow/unfollow if not nip07 extension
    if (iFollow) setShowUnfollowBtn(true);
    if (!iFollow) setShowFollowBtn(true);
  }

  async function handleFollowBtn(userNpub, state, signEvent) {
    const myFollowList = sessionStorage.getItem('myFollowList');
    const parsedFollowingList = JSON.parse(myFollowList);
    const updateBtn = await followUser(
      userNpub,
      parsedFollowingList,
      state,
      state.roomId,
      signEvent
    );
    const ok = updateBtn[0];
    if (!ok) {
      const errorMsg = updateBtn[1];
      alert(errorMsg);
      return;
    }
    iFollowUser(true);
    setShowFollowBtn(false);
  }

  async function handleUnfollowBtn(userNpub, state, signEvent) {
    const myFollowList = sessionStorage.getItem('myFollowList');
    const parsedFollowingList = JSON.parse(myFollowList);
    const updateBtn = await unFollowUser(
      userNpub,
      parsedFollowingList,
      state,
      state.roomId,
      signEvent
    );
    const ok = updateBtn[0];
    if (!ok) {
      const errorMsg = updateBtn[1];
      alert(errorMsg);
      return;
    }
    iFollowUser(false);
    setShowUnfollowBtn(false);
  }

  function copiedToClipboardFn() {
    navigator.clipboard.writeText(userNpub);
    setCopiedToClipboard(true);

    setTimeout(() => {
      setCopiedToClipboard(false);
    }, 2500);
  }

  const [state, api] = useJam();
  const {
    addSpeaker,
    addModerator,
    addOwner,
    removeSpeaker,
    removeModerator,
    removeOwner,
    addAdmin,
    removeAdmin,
    signEvent,
  } = api;

  let stageOnly = !!room?.stageOnly;
  let {speakers, moderators, owners} = room ?? {};

  let [myId, roomId] = use(state, ['myId', 'roomId']);
  let [myAdminStatus] = useApiQuery(`/admin/${myId}`, {fetchOnMount: true});
  let [peerAdminStatus] = useApiQuery(`/admin/${peerId}`, {fetchOnMount: true});

  let isOwner = owners?.includes(peerId) || false;
  let isModerator = moderators?.includes(peerId) || false;
  let isSpeaker = speakers?.includes(peerId) || false;

  const [isValidNip05, setIsValidNip05] = useState(false);
  const [lnAddress, setLnAddress] = useState('');
  const [about, setAbout] = useState(undefined);
  const [nip05, setNip05] = useState('');
  const [banner, setbanner] = useState(undefined);
  const [showFollowBtn, setShowFollowBtn] = useState(false);
  const [showUnfollowBtn, setShowUnfollowBtn] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [loadingFollows, setLoadingFollows] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [userPosts, setUserPosts] = useState(undefined);

  const userNpub = userIdentity(info);
  const actorNpub = userIdentity(actorIdentity.info);
  //console.log('userNpub: ', userNpub, ', actorNpub: ', actorNpub);
  const shortNpub = userNpub ? userNpub.substring(0, 20) : null;
  const hasNostrIdentity = checkNostrIdentity(info.identities);
  const isSameId = info.id === actorIdentity.info.id;

  useEffect(async () => {
    const wasMetadataFetched = sessionStorage.getItem(userNpub);
    const timeToExpire = 3600; // 1 hour cache of profile and outbox relays
    const myFollowListRetrieved = sessionStorage.getItem('myFollowListRetrieved');
    const myFollowListExpired = (myFollowListRetrieved == undefined || ((myFollowListRetrieved + timeToExpire) < Math.floor(Date.now() / 1000)));

    if (wasMetadataFetched && !myFollowListExpired) {
      // Use the cached info
      const data = JSON.parse(sessionStorage.getItem(userNpub));
      setLoadingFollows(false);
      const iFollowCache = data.iFollow;
      const aboutCache = data.about;
      const lightningAddressCache = data.lightningAddress;
      const isNip05ValidCache = data.nip05.isValid;
      const nip05AddressCache = data.nip05.nip05Address;
      const bannerCache = data.banner;
      iFollowUser(iFollowCache);
      setAbout(aboutCache);
      setIsValidNip05(isNip05ValidCache);
      setNip05(nip05AddressCache);
      setLnAddress(lightningAddressCache);
      setbanner(bannerCache);
    } else {
      // Repopulate the cache
      const userMetadata = await setUserMetadata();
      let obj = {};
      if (userNpub && actorNpub) {
        const actorPubkey = nip19.decode(actorNpub).data;
        const userPubkey = nip19.decode(userNpub).data;

        // Reload follow list if expired, or not yet loaded
        let iFollow = false;
        let myFollowList = [];
        if (myFollowListExpired || !wasMetadataFetched){
          myFollowList = await loadFollowList();
          if (myFollowList) {
            sessionStorage.setItem('myFollowListRetrieved', Math.floor(Date.now() / 1000));
            sessionStorage.setItem('myFollowList', JSON.stringify(myFollowList));
          }
        } else {
          myFollowList = JSON.parse(sessionStorage.getItem('myFollowList'));
        }
        if (myFollowList) {
          for (let tag of myFollowList) {
            if (tag.length < 2) continue;
            if (tag[0] != 'p') continue;
            if (tag[1] == userPubkey) {
              iFollow = true;
              break;
            }
          }
        }

        // refetch and set the outbox relays as well
        let outboxRelays = await getOutboxRelays(actorPubkey);
        updateCacheOutboxRelays(outboxRelays, userNpub);

        obj.iFollow = iFollow;
        iFollowUser(iFollow);
        setLoadingFollows(false);
      } else {
        setLoadingFollows(false);
        obj.iFollow = 'npub not found';
      }

      if (userMetadata) {
        function hasLnAddress(userMetadata) {
          if (userMetadata.lud16) {
            setLnAddress(userMetadata.lud16);
            return userMetadata.lud16;
          }

          if (userMetadata.lud06) {
            setLnAddress(userMetadata.lud06);
            return userMetadata.lud06;
          }
          return undefined;
        }

        const isNip05Valid = await verifyNip05(userMetadata.nip05, userNpub);
        const lightningAddress = hasLnAddress(userMetadata);

        if (isNip05Valid) setIsValidNip05(true);
        setAbout(userMetadata.about);
        setNip05(userMetadata.nip05);
        setbanner(userMetadata.banner);

        obj.about = userMetadata.about;
        obj.lightningAddress = lightningAddress;
        obj.nip05 = {
          isValid: isNip05Valid,
          nip05Address: userMetadata.nip05,
        };
        obj.banner = userMetadata.banner;

        const userMetadataCache = JSON.stringify(obj);
        sessionStorage.setItem(userNpub, userMetadataCache);
      }
    }
    setLoadingProfile(false);

    // user posts
    const recentUserPosts = await getUserPosts(userNpub);
    setUserPosts(recentUserPosts);
  }, []);

  return (
    <Modal close={close}>
      <div>
        <div className="flex justify-center">
          <div
            className="h-40 bg-gray-700 rounded-lg absolute top-2"
            style={{
              width: '560px',
              backgroundImage: `url(${banner})`,
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }}
          ></div>
        </div>

        <div className="mt-20 items-center flex flex-col relative z-20">
          <img
            className="w-32 h-32 human-radius bg-gray-200"
            alt={displayName(info, room)}
            src={avatarUrl(info, room)}
          />
          <div className="w-96 flex flex-col items-center">
            <div className="flex flex-wrap items-center">
              <p className="text-xl mr-1 font-semibold text-gray-200">
                {displayName(info, room)}
              </p>
            </div>
            <div className="w-full">
              {nip05 && (
              <div className="flex justify-center">
                <p className="text-sm text-gray-400">
                  {isValidNip05 ? <CheckBadged /> : '🚫'}
                  {nip05}
                  {isValidNip05 ? '' : '(nostr address verification failed)'}
                </p>
              </div>
              )}
              <div
                className={lnAddress !== '' ? 'flex justify-center' : 'hidden'}
              >
                <p className="text-sm text-gray-400">{'⚡ ' + lnAddress}</p>
              </div>
              <div className="flex justify-center">
                <span
                  className={
                    userNpub
                      ? 'flex text-sm text-gray-400 cursor-pointer'
                      : 'hidden'
                  }
                  onClick={() => copiedToClipboardFn()}
                >
                  {userNpub ? `${shortNpub}...` : null}

                  {copiedToClipboard ? (
                    <CopiedToClipboard />
                  ) : (
                    <CopyToClipboard />
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xl mr-1 font-semibold text-gray-200">Actions:</p>
          <div className="flex flex-wrap items-center my-2">
            {myAdminStatus?.admin && (
              <div>
                {(peerAdminStatus?.admin && (
                  <button
                    className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                    onClick={() => {
                      let result = confirm('Are you sure you want to remove Admin permissions?');
                      if (result != true) {
                        return;
                      }
                      removeAdmin(peerId).then(close);
                    }}
                  >
                    ❌ Remove Admin
                  </button>
                )) || (
                  <button
                    className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                    onClick={() => {
                      let result = confirm('Are you sure you want to grant Admin permissions?');
                      if (result != true) {
                        return;
                      }
                      addAdmin(peerId).then(close)
                    }}
                  >
                    🅰️ Make Admin
                  </button>
                )}
              </div>
            )}


            {!isOwner && (iOwn || myAdminStatus?.admin) && (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => addOwner(roomId, peerId).then(close)}
              >
                👑️ Add to room owners
              </button>
            )}

            {isOwner && (iOwn || myAdminStatus?.admin) && (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => {
                  let result = confirm('Are you sure you want to remove Ownership status?');
                  if (result != true) {
                    return;
                  }
                  removeOwner(roomId, peerId).then(close)
                }}
              >
                ❌ Revoke room ownership
              </button>
            )}

            {!isModerator && (iOwn || myAdminStatus?.admin) && (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => addModerator(roomId, peerId).then(close)}
              >
                🛡️ Make moderator
              </button>
            )}

            {isModerator && (iOwn || myAdminStatus?.admin) && (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => {
                  let result = confirm('Are you sure you want to remove Moderator status?');
                  if (result != true) {
                    return;
                  }
                  removeModerator(roomId, peerId).then(close)
                }}
              >
                ❌ Demote Moderator
              </button>
            )}

            {!isSpeaker && !stageOnly && (iModerate || myAdminStatus?.admin) ? (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => addSpeaker(roomId, peerId).then(close)}
              >
                🎤 Invite to stage
              </button>
            ) : null}

            {isSpeaker && (iModerate || myAdminStatus?.admin) ? (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => removeSpeaker(roomId, peerId).then(close)}
              >
                ↓ Move to Audience
              </button>
            ) : null}

            {window.nostr ? (loadingFollows ? (<h4 className="text-sm text-gray-400">Loading Follow List...</h4>) : (
            <>
            {showFollowBtn && (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => {
                  handleFollowBtn(userNpub, state, signEvent);
                }}
              >
                Follow
              </button>
            )}
            {showUnfollowBtn && (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => {
                  let result = confirm('Are you sure you want to unfollow this user?');
                  if (result != true) {
                    return;
                  }
                  handleUnfollowBtn(userNpub, state, signEvent);
                }}
              >
                ❌ Unfollow
              </button>
            )}
            </>
            )) : (
              <div className="h-12 mx-2 text-sm rounded-md border-2 border-gray-300 w-full text-center text-gray-200">
                Use a nostr extension to follow/unfollow participants
              </div>
            )}

            {isSameId ? (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => {
                  close();
                  openModal(EditIdentity);
                }}
              >
                Edit your personal settings
              </button>
            ) : null}

            {hasNostrIdentity ? (
              <button
                className="rounded-lg bg-yellow-200 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => {
                  close();
                  openModal(InvoiceModal, {info: info, room: room});
                }}
              >
                ⚡ {window.nostr ? ('Zap some sats!') : ('Send sats anonymously via lightning')}
              </button>
            ) : null}

          </div>
        </div>
        { loadingProfile ? (<h4 className="text-sm text-gray-400">Loading Profile...</h4>) : (
        <div style={{maxWidth: '568px'}}>
          <p className={about ? 'text-xl mr-1 font-semibold text-gray-200' : 'hidden'}>
            About
          </p>
          <p className="text-sm text-gray-300 break-words mb-1"
             style={{whiteSpace:'pre-line'}}
          >{about}</p>
        </div>
        )}
        { loadingPosts ? (<h4 className="text-sm text-gray-400">Loading Recent Posts...</h4>) : userPosts && (
        <div style={{maxWidth: '568px'}}>
          <p className={userPosts ? 'text-xl mr-1 font-semibold text-gray-200' : 'hidden'}>
            Recent Text Notes
          </p>
          { userPosts?.slice(0,3).map((event) => {
            return <div>
              <p className="text-sm text-gray-300 break-words mb-1"
                 style={{whiteSpace:'pre-line'}}
              >{event.content}</p>
              <p className="text-sm text-gray-500 mb-4"
                 style={{textAlign: 'right', borderBottom: 'solid gray'}}>posted on {makeLocalDate(event.created_at)}</p>
            </div>
          })}
        </div>
        )}
      </div>
    </Modal>
  );
}
