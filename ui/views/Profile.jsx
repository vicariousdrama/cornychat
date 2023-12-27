import React, {useState, useEffect} from 'react';
import {Modal, openModal} from './Modal';
import {
  getUserMetadata,
  isOnFollowList,
  followUser,
  unFollowUser,
  verifyNip05,
} from '../nostr/nostr';
import {nip19} from 'nostr-tools';
import {avatarUrl, displayName} from '../lib/avatar';
import {CheckBadged, OpenLink} from './Svg';
import {useJam, useApiQuery} from '../jam-core-react';
import {use} from 'use-minimal-state';
import {InvoiceModal} from './Invoice';

export function Profile({info, room, peerId, iModerate, actorIdentity, close}) {
  async function setUserMetadata() {
    if (!userNpub) return;

    const pubkey = nip19.decode(userNpub).data;

    const userMetadata = await getUserMetadata(pubkey, [], null);

    return userMetadata;
  }

  function checkNostrIdentity(identities) {
    const hasNostrIdentity = identities?.some(
      identity => identity.type === 'nostr'
    );

    return hasNostrIdentity;
  }

  function userIdentity(info) {
    const hasIdentity = info?.hasOwnProperty('identities');
    if (hasIdentity) {
      return info.identities[0]?.id;
    }

    return undefined;
  }

  function iFollowUser(iFollow) {
    if (iFollow === 'npub not found') return;
    if (iFollow) setShowUnfollowBtn(true);
    if (!iFollow) setShowFollowBtn(true);
  }

  async function handleFollowBtn(userNpub, state, signEvent) {
    const myFollowList = sessionStorage.getItem('myFollowList');
    const parsedFollowingList = JSON.parse(myFollowList);
    const updateBtn = followUser(
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

  const [state, api] = useJam();
  const {
    addSpeaker,
    addModerator,
    removeSpeaker,
    removeModerator,
    addAdmin,
    removeAdmin,
    signEvent,
  } = api;

  let stageOnly = false;

  let {speakers, moderators} = room ?? {};

  let [myId, roomId] = use(state, ['myId', 'roomId']);
  let [myAdminStatus] = useApiQuery(`/admin/${myId}`, {fetchOnMount: true});
  let [peerAdminStatus] = useApiQuery(`/admin/${peerId}`, {fetchOnMount: true});

  let isSpeaker = stageOnly || speakers.includes(peerId);
  let isModerator = moderators.includes(peerId);

  const [isValidNip05, setIsValidNip05] = useState(false);
  const [lnAddress, setLnAddress] = useState('');
  const [about, setAbout] = useState(undefined);
  const [nip05, setNip05] = useState('');
  const [showFollowBtn, setShowFollowBtn] = useState(false);
  const [showUnfollowBtn, setShowUnfollowBtn] = useState(false);

  const userNpub = userIdentity(info);
  const actorNpub = userIdentity(actorIdentity.info);
  const shortNpub = userNpub ? userNpub.substring(0, 16) : null;
  const hasNostrIdentity = checkNostrIdentity(info.identities);

  useEffect(async () => {
    const wasMetadataFetched = sessionStorage.getItem(userNpub);

    if (wasMetadataFetched) {
      const data = JSON.parse(sessionStorage.getItem(userNpub));
      const iFollowCache = data.iFollow;
      const aboutCache = data.about;
      const lightningAddressCache = data.lightningAddress;
      const isNip05ValidCache = data.nip05.isValid;
      const nip05AddressCache = data.nip05.nip05Address;

      iFollowUser(iFollowCache);
      setAbout(aboutCache);
      setIsValidNip05(isNip05ValidCache);
      setNip05(nip05AddressCache);
      setLnAddress(lightningAddressCache);
    } else {
      const userMetadata = await setUserMetadata();

      let obj = {};

      if (userNpub && actorNpub) {
        const actorPubkey = nip19.decode(actorNpub).data;
        const userPubkey = nip19.decode(userNpub).data;

        const data = await isOnFollowList(actorPubkey, userPubkey);

        const iFollow = data[0];
        let myFollowList = data[1];

        obj.iFollow = iFollow;
        myFollowList = JSON.stringify(myFollowList);
        sessionStorage.setItem('myFollowList', myFollowList);

        iFollowUser(iFollow);
      } else {
        obj.iFollow = 'npub not found';
        console.log('one of them does not have an npub');
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

        obj.about = userMetadata.about;
        obj.lightningAddress = lightningAddress;
        obj.nip05 = {
          isValid: isNip05Valid,
          nip05Address: userMetadata.nip05,
        };

        const userMetadataCache = JSON.stringify(obj);
        sessionStorage.setItem(userNpub, userMetadataCache);
      }
    }
  }, []);

  return (
    <Modal close={close}>
      <div>
        <div className="flex justify-center">
          <div
            className="h-40 bg-gray-700 rounded-lg absolute top-2"
            style={{
              width: '560px',
              backgroundColor: 'linear-gradient(to bottom, #ff0000, #0000ff)',
            }}
          ></div>
        </div>

        <div className="mt-20 items-center flex flex-col relative z-20">
          <img
            className="w-32 h-32 rounded-full bg-gray-200"
            alt={displayName(info, room)}
            src={avatarUrl(info, room)}
          />
          <div className="w-96 flex flex-col items-center">
            <div className="flex flex-wrap items-center">
              <p className="text-xl mr-1 font-semibold">
                {displayName(info, room).substring(0, 12)}
              </p>
              <div className="mr-2">
                {isValidNip05 ? <CheckBadged /> : null}
              </div>
            </div>
            <div className="w-full">
              <div className="flex justify-center">
                <p className="text-sm text-gray-400">
                  {isValidNip05 ? nip05 : null}
                </p>
              </div>
              <div
                className={lnAddress !== '' ? 'flex justify-center' : 'hidden'}
              >
                <p className="text-sm text-gray-400">{'⚡ ' + lnAddress}</p>
              </div>
              <div className="flex justify-center">
                <a
                  className="text-sm text-gray-400 cursor-pointer"
                  href={'https://primal.net/p/' + userNpub}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className={userNpub ? 'flex' : 'hidden'}>
                    {userNpub ? `${shortNpub}...` : null}
                    <OpenLink />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xl mr-1 font-semibold">Actions:</p>
          <div className="flex flex-wrap items-center my-2">
            {myAdminStatus?.admin && (
              <div>
                {(peerAdminStatus?.admin && (
                  <button
                    className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs text-white"
                    onClick={() => removeAdmin(peerId).then(close)}
                  >
                    ❎️ Remove Admin
                  </button>
                )) || (
                  <button
                    className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs text-white"
                    onClick={() => addAdmin(peerId).then(close)}
                  >
                    👑️ Make Admin
                  </button>
                )}
              </div>
            )}

            {isSpeaker && iModerate ? (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => removeSpeaker(roomId, peerId).then(close)}
              >
                ↓ Move to Audience
              </button>
            ) : null}

            {!isSpeaker && iModerate ? (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => addSpeaker(roomId, peerId).then(close)}
              >
                Invite to stage
              </button>
            ) : null}

            {isSpeaker && !isModerator && (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => addModerator(roomId, peerId).then(close)}
              >
                Make moderator
              </button>
            )}

            {isModerator && iModerate && (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => removeModerator(roomId, peerId).then(close)}
              >
                ❎ Demote Moderator
              </button>
            )}

            {showFollowBtn ? (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => {
                  handleFollowBtn(userNpub, state, signEvent);
                }}
              >
                Follow
              </button>
            ) : null}

            {showUnfollowBtn ? (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                onClick={() => {
                  handleUnfollowBtn(userNpub, state, signEvent);
                }}
              >
                Unfollow
              </button>
            ) : null}

            {hasNostrIdentity ? (
              <div
                className="flex justify-center cursor-pointer"
                onClick={() => {
                  close();
                  openModal(InvoiceModal, {info: info, room: room});
                }}
              >
                <div className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center">
                  <span>⚡</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div style={{maxWidth: '568px'}}>
          <p className={about ? 'text-xl mr-1 font-semibold' : 'hidden'}>
            About
          </p>
          <p className="text-sm text-gray-400 break-words mb-1">{about}</p>
        </div>
      </div>
    </Modal>
  );
}
