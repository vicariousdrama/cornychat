import React, {useState, useEffect} from 'react';
import {Modal, openModal} from './Modal';
import {
  getUserMetadata,
  getNpubFromInfo,
  followUser,
  unFollowUser,
  verifyNip05,
  getUserEventsByKind,
  getOutboxRelays,
  makeLocalDate,
  loadFollowList,
  updateCacheOutboxRelays,
  getRelationshipPetname,
  updatePetname,
  normalizeLightningAddress,
  getCBadgeConfigsForPubkey,
} from '../nostr/nostr';
import {nip19} from 'nostr-tools';
import {avatarUrl, displayName} from '../lib/avatar';
import {CheckBadged, CopiedToClipboard, CopyToClipboard} from './Svg';
import {useJam, useApiQuery} from '../jam-core-react';
import {use} from 'use-minimal-state';
import {InvoiceModal} from './Invoice';
import EditPersonalSettings from './editPersonalSettings/EditPersonalSettings';
import {useMqParser} from '../lib/tailwind-mqp';
import {colors, isDark} from '../lib/theme';
import {KickBanModal} from './KickBanModal';
import {createLinksSanitized} from '../lib/sanitizedText';
import {createEmojiImages} from '../nostr/emojiText';
import EditNostrProfile from './editProfile/EditNostrProfile';
import EditNostrLists from './editLists/editNostrLists';

export function Profile({
  info,
  room,
  peerId,
  iOwn,
  iModerate,
  iAmAdmin,
  actorIdentity,
  close,
}) {
  const supportFollows = window.nostr != undefined; // kind 3 is deprecated, now using kind 30000 as d=cornychat-follows

  async function setUserMetadata() {
    if (!userNpub) return;
    const pubkey = nip19.decode(userNpub).data;
    const userMetadata = await getUserMetadata(pubkey, peerId);
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
    let userPostsTime = sessionStorage.getItem(
      `${pubkey}.kind${kind}events.retrieveTime`
    );
    let userPosts = sessionStorage.getItem(`${pubkey}.kind${kind}events`);
    if (
      userPostsTime == undefined ||
      userPostsTime + checkFrequency < currentTime ||
      userPosts == undefined
    ) {
      const timeSince = currentTime - 86400; // last day
      userPosts = await getUserEventsByKind(pubkey, kind, timeSince);
    } else {
      userPosts = JSON.parse(userPosts);
    }
    // sort to reverse chronological order
    userPosts.sort((a, b) =>
      a.created_at > b.created_at ? -1 : b.created_at > a.created_at ? 1 : 0
    );
    setLoadingPosts(false);
    return userPosts;
  }

  function checkNostrIdentity(identities) {
    const hasNostrIdentity = identities?.some(
      identity => identity.type === 'nostr'
    );
    return hasNostrIdentity;
  }

  function iFollowUser(iFollow) {
    if (iFollow === 'npub not found') return;
    if (!window.nostr) return; // dont show follow/unfollow if not nip07 extension
    if (!supportFollows) return;
    if (iFollow) setShowUnfollowBtn(true);
    if (!iFollow) setShowFollowBtn(true);
  }

  async function handleFollowBtn(userNpub, state) {
    if (!supportFollows) {
      setShowFollowBtn(false);
      setShowUnfollowBtn(false);
      return;
    }
    const myFollowList = sessionStorage.getItem('myFollowList');
    const parsedFollowingList = JSON.parse(myFollowList);
    const updateBtn = await followUser(userNpub, parsedFollowingList);
    const ok = updateBtn[0];
    if (!ok) {
      const errorMsg = updateBtn[1];
      alert(errorMsg);
      return;
    }
    iFollowUser(true);
    setShowFollowBtn(false);
  }

  async function handleUnfollowBtn(userNpub, state) {
    if (!supportFollows) {
      setShowFollowBtn(false);
      setShowUnfollowBtn(false);
      return;
    }
    const myFollowList = sessionStorage.getItem('myFollowList');
    const parsedFollowingList = JSON.parse(myFollowList);
    const updateBtn = await unFollowUser(userNpub, parsedFollowingList);
    const ok = updateBtn[0];
    if (!ok) {
      const errorMsg = updateBtn[1];
      alert(errorMsg);
      return;
    }
    iFollowUser(false);
    setShowUnfollowBtn(false);
  }

  async function savePetname(e) {
    e.preventDefault();
    if (userNpub != undefined) {
      localStorage.setItem(`${userNpub}.petname`, petname);
      if (!petname || petname.length == 0)
        localStorage.removeItem(`${userNpub}.petname`);
      userDisplayName = petname;
      let allowUnencrypted = localStorage.getItem('petnames.allowunencrypted');
      if (window.nostr) {
        if (window.nostr.nip44) allowUnencrypted = true; // just setting the check flag to bypass the need to ask
        if (allowUnencrypted == undefined) {
          allowUnencrypted = confirm(
            'Your NIP07 extension does not support encryption. Do you still want to publish petname to nostr?'
          );
          localStorage.setItem('petnames.allowunencrypted', allowUnencrypted);
        }
        if (allowUnencrypted) {
          updatePetname(userNpub, petname);
        }
      }
      if (window.nostr?.nip44) allowUnencrypted = true;
    }
    setEditingPetname(false);
  }

  async function cancelPetname(e) {
    e.preventDefault();
    setPetname(userDisplayName);
    setEditingPetname(false);
  }

  function copiedToClipboardFn() {
    navigator.clipboard.writeText(userNpub);
    setCopiedToClipboard(true);

    setTimeout(() => {
      setCopiedToClipboard(false);
    }, 2500);
  }

  function showBadgeDetail(img, txt) {
    let i = document.getElementById('badgeDetailImage');
    if (i) i.src = img;
    let t = document.getElementById('badgeDetailText');
    if (t) t.textContent = txt;
    let b = document.getElementById('badgeDetail');
    if (b) b.style.display = 'initial';
  }
  function hideBadgeDetail() {
    document.getElementById('badgeDetail').style.display = 'none';
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
    sendCSAR,
    assignTalkingStick,
  } = api;

  let mqp = useMqParser();
  let stageOnly = !!room?.stageOnly;
  let {speakers, moderators, owners} = room ?? {};

  let [myId, roomId] = use(state, ['myId', 'roomId']);
  let isPeerAdmin = false;
  if (iAmAdmin) {
    if (peerId == myId) {
      isPeerAdmin = true;
    } else {
      let peerAdminStatus = useApiQuery(`/admin/${peerId}`, {
        fetchOnMount: true,
      });
      isPeerAdmin = peerAdminStatus.admin ?? false;
    }
  }
  const userNpub = getNpubFromInfo(info);

  let isOwner =
    owners?.includes(peerId) ||
    (userNpub != undefined && owners?.includes(userNpub)) ||
    false;
  let isModerator =
    moderators?.includes(peerId) ||
    (userNpub != undefined && moderators?.includes(userNpub)) ||
    false;
  let isSpeaker =
    speakers?.includes(peerId) ||
    (userNpub != undefined && speakers?.includes(userNpub)) ||
    false;

  let canKick = false;
  if (iAmAdmin && !isPeerAdmin) canKick = true;
  if (iOwn && !isPeerAdmin) canKick = true;
  if (iModerate && !(isPeerAdmin || isOwner)) canKick = true;

  let roomHasTalkingStick = room?.isTS ?? false;
  // Do I naturally have the stick?
  let actorHasTalkingStick =
    roomHasTalkingStick && (room?.tsID ?? '') == actorIdentity?.info?.id;
  // If no speaker has the stick and Im a speaker, assume I have the stick
  if (roomHasTalkingStick && (room?.tsID ?? '') == '' && isSpeaker)
    actorHasTalkingStick = true;
  // TODO: If room has talking stick and its assigned but the user referenced is not in the room.. then clear it
  let peerHasTalkingStick = roomHasTalkingStick && (room?.tsID ?? '') == peerId;

  const [isValidNip05, setIsValidNip05] = useState(false);
  const [lnAddress, setLnAddress] = useState('');
  const [profileTags, setProfileTags] = useState([]);
  const [about, setAbout] = useState(undefined);
  const [nip05, setNip05] = useState('');
  const [banner, setbanner] = useState(undefined);
  const [badgeConfigs, setBadgeConfigs] = useState([]);
  const [showFollowBtn, setShowFollowBtn] = useState(false);
  const [showUnfollowBtn, setShowUnfollowBtn] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [loadingFollows, setLoadingFollows] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [userPosts, setUserPosts] = useState(undefined);
  const [editingPetname, setEditingPetname] = useState(false);
  const maxPostsToDisplay = Math.floor(
    localStorage.getItem('maxPostsToDisplay') || '3'
  );

  const actorNpub = getNpubFromInfo(actorIdentity?.info);
  const shortNpub = userNpub ? userNpub.substring(0, 20) : null;
  const userNpub1 = userNpub ? userNpub.substring(0, 32) : null;
  const userNpub2 = userNpub ? userNpub.substring(32, userNpub.length) : null;
  const hasNostrIdentity = checkNostrIdentity(info?.identities);
  const isSameId = info?.id === actorIdentity?.info?.id;

  const colorTheme = room?.color ?? 'default';
  const roomColor = colors(colorTheme, room.customColor);
  const textColor = isDark(roomColor.buttons.primary)
    ? roomColor.text.light
    : roomColor.text.dark;

  useEffect(async () => {
    const wasMetadataFetched = sessionStorage.getItem(userNpub);
    const timeToExpire = 3600; // 1 hour cache of profile and outbox relays
    const myFollowListRetrieved = sessionStorage.getItem(
      'myFollowList.retrievedTime'
    );
    const myFollowListExpired =
      supportFollows &&
      (myFollowListRetrieved == undefined ||
        myFollowListRetrieved + timeToExpire < Math.floor(Date.now() / 1000));

    if (wasMetadataFetched && !myFollowListExpired) {
      // Use the cached info
      const data = JSON.parse(sessionStorage.getItem(userNpub));
      setLoadingFollows(false);
      const iFollowCache = data.iFollow;
      const aboutCache = data.about;
      const lightningAddressCache = normalizeLightningAddress(
        data.lightningAddress
      );
      const isNip05ValidCache = data.nip05?.isValid || false;
      const nip05AddressCache = data.nip05?.nip05Address;
      const bannerCache = data.banner;
      iFollowUser(iFollowCache);
      setAbout(aboutCache);
      setIsValidNip05(isNip05ValidCache);
      setNip05(nip05AddressCache);
      setLnAddress(lightningAddressCache);
      setbanner(bannerCache);
      if (!data.badgeConfigs) {
        const userPubkey = nip19.decode(userNpub).data;
        const badgeconfigs = await getCBadgeConfigsForPubkey(userPubkey);
        data.badgeConfigs = badgeconfigs;
        const userMetadataCache = JSON.stringify(data);
        sessionStorage.setItem(userNpub, userMetadataCache);
      }
      setBadgeConfigs(data.badgeConfigs || []);
    } else {
      // Repopulate the cache
      const userMetadata = await setUserMetadata();
      let obj = {badgeConfigs: []};
      if (userNpub && actorNpub) {
        const actorPubkey = nip19.decode(actorNpub).data;
        const userPubkey = nip19.decode(userNpub).data;

        // Reload follow list if expired, or not yet loaded
        let iFollow = false;
        if (supportFollows && window.nostr) {
          let myFollowList = await loadFollowList();
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
        obj.badgeConfigs = [];
        setBadgeConfigs(obj.badgeConfigs);
      }

      if (userMetadata) {
        function hasLnAddress(userMetadata) {
          if (userMetadata.lud16) {
            setLnAddress(normalizeLightningAddress(userMetadata.lud16));
            return userMetadata.lud16;
          }
          if (userMetadata.lud06) {
            setLnAddress(normalizeLightningAddress(userMetadata.lud06));
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
        if (userMetadata.nip05) {
          obj.nip05 = {
            isValid: isNip05Valid,
            nip05Address: userMetadata.nip05,
          };
        }
        obj.banner = userMetadata.banner;
        obj.jamId = peerId;

        const userPubkey = nip19.decode(userNpub).data;
        const badgeconfigs = await getCBadgeConfigsForPubkey(userPubkey);
        obj.badgeConfigs = badgeconfigs;
        setBadgeConfigs(badgeconfigs);

        const userMetadataCache = JSON.stringify(obj);
        sessionStorage.setItem(userNpub, userMetadataCache);
      }
    }
    const tagCache = JSON.parse(
      sessionStorage.getItem(`${userNpub}.kind0tags`) || '[]'
    );
    setProfileTags(tagCache);
    setLoadingProfile(false);

    // user posts
    const recentUserPosts = await getUserPosts(userNpub);
    let filteredUserPosts = [];
    if (recentUserPosts) {
      for (let recentUserPost of recentUserPosts) {
        let includePost = true;
        if (recentUserPost.tags.length > 0) {
          for (let postTag of recentUserPost.tags) {
            // filter out tags that are a reply or quote
            if (postTag.length > 0 && postTag[0] == 'e') includePost = false;
          }
        }
        if (includePost) filteredUserPosts.push(recentUserPost);
      }
    }
    setUserPosts(filteredUserPosts);
  }, []);

  let userDisplayName = displayName(info, room);
  userDisplayName = createEmojiImages(userDisplayName, profileTags);
  if (userNpub != undefined) {
    userDisplayName = getRelationshipPetname(userNpub, userDisplayName);
  }
  const [petname, setPetname] = useState(userDisplayName);

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
            alt={userDisplayName}
            src={avatarUrl(info, room)}
          />
          <div className="w-96 flex flex-col items-center">
            <div className="flex flex-wrap items-center">
              {editingPetname && (
                <div className="flex">
                  <input
                    className={mqp(
                      'rounded placeholder-black bg-gray-400 text-black w-full mx-1 md:w-full'
                    )}
                    type="text"
                    placeholder=""
                    value={petname}
                    autoComplete="off"
                    style={{
                      borderWidth: '0px',
                      fontSize: '15px',
                    }}
                    onChange={e => {
                      setPetname(e.target.value);
                      sendCSAR('setpetname');
                    }}
                  ></input>
                  <button
                    className="px-2 mx-1 h-10 text-sm rounded-md"
                    style={{
                      color: textColor,
                      backgroundColor: roomColor.buttons.primary,
                    }}
                    onClick={e => savePetname(e)}
                  >
                    Save Petname
                  </button>
                  <button
                    className="px-2 mx-1 h-10 text-sm rounded-md"
                    style={{
                      color: textColor,
                      backgroundColor: roomColor.buttons.primary,
                    }}
                    onClick={e => cancelPetname(e)}
                  >
                    Cancel
                  </button>
                </div>
              )}
              {!editingPetname && userNpub && (
                <p
                  className="text-xl mr-1 font-semibold text-gray-200 cursor-pointer"
                  onClick={() => setEditingPetname(true)}
                  style={{whiteSpace: 'pre-line'}}
                  dangerouslySetInnerHTML={{
                    __html: createLinksSanitized(
                      createEmojiImages(userDisplayName, profileTags),
                      '1.4rem',
                      false
                    ),
                  }}
                ></p>
              )}
              {!editingPetname && !userNpub && (
                <p className="text-xl mr-1 font-semibold text-gray-200">
                  {userDisplayName}
                </p>
              )}
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
              {lnAddress && lnAddress != '' && (
                <div className={'flex justify-center'}>
                  <p className="text-sm text-gray-400">{'⚡ ' + lnAddress}</p>
                </div>
              )}
              <div className="flex justify-center">
                <span
                  className={
                    userNpub
                      ? 'flex text-sm text-gray-400 cursor-pointer'
                      : 'hidden'
                  }
                  onClick={() => copiedToClipboardFn()}
                >
                  NPUB: <br />
                  {userNpub1}
                  <br />
                  {userNpub2}
                  {copiedToClipboard ? (
                    <CopiedToClipboard />
                  ) : (
                    <CopyToClipboard />
                  )}
                </span>
              </div>
              {iAmAdmin && (
                <div className="flex justify-center">
                  <span
                    className={'flex text-sm text-gray-400 cursor-pointer'}
                    onClick={() => navigator.clipboard.writeText(peerId)}
                  >
                    Device ID:
                    <br />
                    {peerId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <p className="text-xl mr-1 font-semibold text-gray-200">Actions:</p>
          <div className="flex flex-wrap items-center my-2">
            {(iAmAdmin || iOwn || iModerate) &&
              roomHasTalkingStick &&
              !actorHasTalkingStick && (
                <button
                  className="rounded-lg px-3 py-2 mx-1 my-1 text-xs bg-green-500 text-gray-300"
                  style={{
                    backgroundColor: 'rgb(0,96,0)',
                    color: 'rgb(255,255,255)',
                  }}
                  onClick={() =>
                    assignTalkingStick(roomId, actorIdentity?.info?.id).then(
                      close
                    )
                  }
                >
                  🎤 Take Talking Stick
                </button>
              )}

            {isSameId && (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                style={{
                  backgroundColor: 'rgb(21,21,210)',
                  color: 'rgb(255,255,255)',
                }}
                onClick={() => {
                  close();
                  openModal(EditPersonalSettings);
                }}
              >
                Edit your personal settings
              </button>
            )}
            {isSameId && window.nostr && (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                style={{
                  backgroundColor: 'rgb(21,21,210)',
                  color: 'rgb(255,255,255)',
                }}
                onClick={() => {
                  close();
                  openModal(EditNostrProfile);
                }}
              >
                Edit your profile
              </button>
            )}
            {true && isSameId && window.nostr && (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
                style={{
                  backgroundColor: 'rgb(21,21,210)',
                  color: 'rgb(255,255,255)',
                }}
                onClick={() => {
                  close();
                  openModal(EditNostrLists);
                }}
              >
                Edit your lists
              </button>
            )}

            <button
              className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs"
              style={{
                backgroundColor: 'rgb(21,21,210)',
                color: 'rgb(255,255,255)',
              }}
              onClick={() => {
                sessionStorage.setItem('peerSelected', peerId);
                close();
              }}
            >
              Target for Reactions
            </button>

            {iAmAdmin && (
              <div>
                {(isPeerAdmin && (
                  <button
                    className="rounded-lg px-3 py-2 mx-1 my-1 text-xs bg-red-500 text-gray-300"
                    onClick={() => {
                      let result = confirm(
                        'Are you sure you want to remove Admin permissions?'
                      );
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
                    className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-black text-xs"
                    onClick={() => {
                      let result = confirm(
                        'Are you sure you want to grant Admin permissions?'
                      );
                      if (result != true) {
                        return;
                      }
                      addAdmin(peerId).then(close);
                    }}
                  >
                    🅰️ Make Admin
                  </button>
                )}
              </div>
            )}

            {!isOwner && (iOwn || iAmAdmin) && (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-black text-xs"
                onClick={() => addOwner(roomId, peerId).then(close)}
              >
                👑️ Add to room owners
              </button>
            )}

            {isOwner && (iOwn || iAmAdmin) && (
              <button
                className="rounded-lg px-3 py-2 mx-1 my-1 text-xs bg-red-500 text-gray-300"
                onClick={() => {
                  let result = confirm(
                    'Are you sure you want to remove Ownership status?'
                  );
                  if (result != true) {
                    return;
                  }
                  removeOwner(roomId, peerId).then(close);
                }}
              >
                ❌ Remove Room Owner
              </button>
            )}

            {!isModerator && (iOwn || iAmAdmin) && (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-black text-xs"
                onClick={() => addModerator(roomId, peerId).then(close)}
              >
                🛡️ Make moderator
              </button>
            )}

            {isModerator && (iOwn || iAmAdmin) && (
              <button
                className="rounded-lg px-3 py-2 mx-1 my-1 text-xs bg-red-500 text-gray-300"
                onClick={() => {
                  let result = confirm(
                    'Are you sure you want to remove Moderator status?'
                  );
                  if (result != true) {
                    return;
                  }
                  removeModerator(roomId, peerId).then(close);
                }}
              >
                ❌ Remove Moderator
              </button>
            )}

            {!isSpeaker &&
            !roomHasTalkingStick &&
            !stageOnly &&
            (iModerate || iAmAdmin) ? (
              <button
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-black text-xs"
                onClick={() => addSpeaker(roomId, peerId).then(close)}
              >
                🎤 Invite to stage
              </button>
            ) : null}

            {roomHasTalkingStick && actorHasTalkingStick && !isSameId && (
              <button
                className="rounded-lg px-3 py-2 mx-1 my-1 text-xs bg-gray-300 text-black"
                onClick={() => assignTalkingStick(roomId, peerId).then(close)}
              >
                🎤 Hand Over Talking Stick
              </button>
            )}

            {isSpeaker && (iModerate || iOwn || iAmAdmin) ? (
              <button
                className="rounded-lg px-3 py-2 mx-1 my-1 text-xs bg-red-500 text-gray-300"
                onClick={() => removeSpeaker(roomId, peerId).then(close)}
              >
                ↓ Move to Audience
              </button>
            ) : null}

            {supportFollows && (
              <>
                {window.nostr ? (
                  loadingFollows ? (
                    <h4 className="text-sm text-gray-400">
                      Loading Contact List...
                    </h4>
                  ) : (
                    <>
                      {showFollowBtn && (
                        <button
                          className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-black text-xs"
                          onClick={() => {
                            handleFollowBtn(userNpub, state);
                          }}
                        >
                          Add to contact list
                        </button>
                      )}
                      {showUnfollowBtn && (
                        <button
                          className="rounded-lg px-3 py-2 mx-1 my-1 text-xs bg-red-500 text-gray-300"
                          onClick={() => {
                            let result = confirm(
                              'Are you sure you want to remove this user from contact list?'
                            );
                            if (result != true) {
                              return;
                            }
                            handleUnfollowBtn(userNpub, state);
                          }}
                        >
                          ❌ Remove from Contact List
                        </button>
                      )}
                    </>
                  )
                ) : (
                  <div className="h-12 mx-2 text-sm rounded-md border-2 border-gray-300 w-full text-center text-gray-200">
                    Use a nostr extension to modify contact list
                  </div>
                )}
              </>
            )}

            {hasNostrIdentity && lnAddress != undefined && lnAddress != '' ? (
              <button
                className="rounded-lg bg-yellow-200 px-3 py-2 mx-1 my-1 text-black text-xs"
                onClick={() => {
                  close();
                  openModal(InvoiceModal, {info: info, room: room});
                }}
              >
                ⚡{' '}
                {window.nostr
                  ? 'Zap some sats!'
                  : 'Send sats anonymously via lightning'}
              </button>
            ) : null}

            {!isSameId && canKick && (
              <button
                className="rounded-lg bg-red-500 text-gray-300 px-3 py-2 mx-1 my-1 text-white text-xs"
                onClick={() => {
                  close();
                  openModal(KickBanModal, {
                    peerId,
                    peerDisplayName: userDisplayName,
                    actorId: myId,
                    room,
                    roomId,
                    roomColor,
                    iOwn,
                    iModerate,
                    iAmAdmin,
                    isOwner,
                    isModerator,
                    isAdmin: isPeerAdmin,
                  });
                }}
              >
                🦶 Kick User
              </button>
            )}
          </div>
        </div>
        {loadingProfile ? (
          <h4 className="text-sm text-gray-400">Loading Profile...</h4>
        ) : (
          <>
            <div style={{maxWidth: '568px', display: 'inline-block'}}>
              <p
                className={
                  badgeConfigs.length
                    ? 'text-xl mr-1 font-semibold text-gray-200'
                    : 'hidden'
                }
              >
                Badges:
              </p>
              {badgeConfigs.map((badgeconfig, index) => {
                let badgekey = `badgekey_${badgeconfig[0]}_${index}`;
                let smallBadgeImage = `/img/badges/${badgeconfig[0]}.96.png`;
                let bigBadgeImage = `/img/badges/${badgeconfig[0]}.png`;
                let badgeText = badgeconfig[1];
                return (
                  <img
                    key={badgekey}
                    align="left"
                    src={smallBadgeImage}
                    className="h-24 w-24 rounded-lg"
                    onClick={async () => {
                      showBadgeDetail(bigBadgeImage, badgeText);
                    }}
                    style={{
                      margin: '2px',
                      width: '96px',
                      height: '96px',
                      objectFit: 'cover',
                      cursor: 'pointer',
                    }}
                  />
                );
              })}
              <div
                id="badgeDetail"
                style={{
                  display: 'none',
                  position: 'absolute',
                  top: '20px',
                  left: '0px',
                  zIndex: '20',
                  cursor: 'pointer',
                }}
                onClick={async () => {
                  hideBadgeDetail();
                }}
              >
                <img id="badgeDetailImage" style={{cursor: 'pointer'}} src="" />
                <div
                  id="badgeDetailText"
                  style={{
                    cursor: 'pointer',
                    backgroundColor: 'rgb(255,192,128)',
                  }}
                >
                  x
                </div>
              </div>
            </div>
            <div style={{maxWidth: '568px', display: 'inline-block'}}>
              <p
                className={
                  about ? 'text-xl mr-1 font-semibold text-gray-200' : 'hidden'
                }
              >
                About:
              </p>
              <p
                className="text-sm text-gray-300 break-word mb-1"
                style={{whiteSpace: 'pre-line'}}
                dangerouslySetInnerHTML={{
                  __html: createLinksSanitized(
                    createEmojiImages(about, profileTags),
                    '20rem',
                    true
                  ),
                }}
              ></p>
            </div>
          </>
        )}
        {loadingPosts ? (
          <h4 className="text-sm text-gray-400">Loading Recent Posts...</h4>
        ) : (
          userPosts &&
          userPosts.length > 0 && (
            <div style={{maxWidth: '568px', display: 'inline-block'}}>
              <p
                className={
                  userPosts && maxPostsToDisplay > 0
                    ? 'text-xl mr-1 font-semibold text-gray-200'
                    : 'hidden'
                }
              >
                Recent Text Notes:
              </p>
              {userPosts?.slice(0, maxPostsToDisplay).map((event, index) => {
                let eventkey = `eventkey_${index}`;
                return (
                  <div key={eventkey}>
                    <p
                      className="text-sm text-gray-300 break-word mb-1"
                      style={{whiteSpace: 'pre-line'}}
                      dangerouslySetInnerHTML={{
                        __html: createLinksSanitized(
                          createEmojiImages(event.content, event.tags),
                          '20rem',
                          false
                        ),
                      }}
                    ></p>
                    <p
                      className="text-sm text-gray-500 mb-4"
                      style={{
                        textAlign: 'right',
                        borderBottom: 'solid 1px gray',
                      }}
                    >
                      posted on {makeLocalDate(event.created_at)}
                    </p>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </Modal>
  );
}
