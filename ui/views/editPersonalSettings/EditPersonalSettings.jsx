import React, {useState} from 'react';
import {Modal} from '../Modal.jsx';
import {use} from 'use-minimal-state';
import {useJam} from '../../jam-core-react.js';
import {getUserMetadata, getUserEventById} from '../../nostr/nostr.js';
import {nip19} from 'nostr-tools';
import {isDark, colors} from '../../lib/theme.js';
import {avatarUrl, displayName} from '../../lib/avatar.js';
import EmojiPicker from 'emoji-picker-react';
import {doorbellsounds} from '../../lib/doorbell.js';
import crypto from 'crypto-js';
import {LoadingIcon} from '../Svg.jsx';

function addNostr(identities, nostrNpub, nostrNoteId, nostrEvent) {
  if (!nostrNpub) return;
  if (!nostrNoteId) return;
  if (!nostrEvent) return;
  const startWithNpub = nostrNpub.startsWith('npub');
  const hasNpubLength = nostrNpub.length === 63;

  if (startWithNpub && hasNpubLength) {

    let loginTime = nostrEvent.created_at;
    let loginId = nostrEvent.id;
    let loginSig = nostrEvent.sig;

    identities.push({type: 'nostr', id: nostrNpub, verificationInfo: nostrNoteId, loginTime: loginTime, loginId: loginId, loginSig: loginSig});
  }
}

export default function EditPersonalSettings({close}) {
  const [state, {updateInfo, sendCSAR}] = useJam();
  const [id, myIdentity] = use(state, ['myId', 'myIdentity']);
  const info = myIdentity?.info;
  const nostrIdentity = info?.identities?.find(i => i.type === 'nostr');
  const colorTheme = state.room?.color ?? 'default';
  const roomColor = colors(colorTheme, state.room.customColor);

  let [isSaving, setIsSaving] = useState(false);

  let [name, setName] = useState(info?.name);
  let [avatar, setAvatar] = useState(info?.avatar);
  let [verifyingNpub, setVerifyingNpub] = useState(false);
  let [nostrNpub, setNostrNpub] = useState(nostrIdentity?.id);
  let [nostrNoteId, setNostrNoteId] = useState(nostrIdentity?.verificationInfo);
  let room = use(state, 'room');

  if (name == undefined) {
    let userDisplayName = displayName(myIdentity.info, room);
    name = userDisplayName;
  }

  if (avatar == undefined) {
    let userAvatar = avatarUrl(myIdentity.info, room);
    avatar = userAvatar;
  }
  const myEncryptionKey = JSON.parse(localStorage.getItem('identities'))._default.secretKey;
  const [showErrorMsg, setErrorMsg] = useState(false);
  let [defaultZapAmount, setDefaultZapAmount] = useState(
    localStorage.getItem('zaps.defaultAmount') ?? (localStorage.getItem('defaultZap') ?? '')
  );
  let [defaultZapComment, setDefaultZapComment] = useState(
    localStorage.getItem('zaps.defaultComment') ?? 'Zapping from Corny Chat!'
  )
  let [byeEmoji, setByeEmoji] = useState(
    localStorage.getItem('byeEmoji') ?? 'Goodbye'
  );
  let [animEnabled, setAnimEnabled] = useState(
    localStorage.getItem('animationsEnabled') ?? 'false'
  );
  let [ghostsEnabled, setGhostsEnabled] = useState(
    localStorage.getItem('ghostsEnabled') ?? 'false'
  );
  let [maxPostsToDisplay, setMaxPostsToDisplay] = useState(
    localStorage.getItem('maxPostsToDisplay') ?? '3'
  );
  let [onlyZapsEnabled, setOnlyZapsEnabled] = useState(
    localStorage.getItem('onlyZapsEnabled') ?? 'false'
  );
  let [showFullsizeAvatars, setShowFullsizeAvatars] = useState(
    localStorage.getItem('fullsizeAvatars') ?? 'true'
  );
  let [doorbellEnabled, setDoorbellEnabled] = useState(
    localStorage.getItem('doorbellEnabled') ?? '0'
  );
  let [textchatLayout, setTextchatLayout] = useState(
    localStorage.getItem('textchat.layout') ?? 'left'
  );
  let [textchatBufferSize, setTextchatBufferSize] = useState(
    localStorage.getItem('textchat.bufferSize') ?? '50'
  );
  let [textchatShowAvatars, setTextchatShowAvatars] = useState(
    localStorage.getItem('textchat.showAvatars') ?? 'true'
  );
  let [textchatShowNames, setTextchatShowNames] = useState(
    localStorage.getItem('textchat.showNames') ?? 'true'
  );
  let [textchatShowDates, setTextchatShowDates] = useState(
    localStorage.getItem('textchat.showDates') ?? 'false'
  );
  let [textchatShowDatesDuration, setTextchatShowDatesDuration] = useState(
    localStorage.getItem('textchat.showDates.duration') ?? '3600'
  );
  let [textchatShowTimestamps, setTextchatShowTimestamps] = useState(
    localStorage.getItem('textchat.showTimestamps') ?? 'false'
  );
  let [textchatEncryptPM, setTextchatEncryptPM] = useState(
    localStorage.getItem('textchat.encryptPM') ?? 'true'
  );
  let [textchatToNostr, setTextchatToNostr] = useState(
    localStorage.getItem('textchat.tonostr') ?? 'false'
  );
  let [nwcEnabled, setNWCEnabled] = useState(    
    localStorage.getItem('nwc.enabled') ?? 'false'
  );
  let [nwcWSPubkey, setNWCWSPubkey] = useState(
    localStorage.getItem('nwc.pubkey') ?? ''
  );
  let [nwcRelay, setNWCRelay] = useState(
    localStorage.getItem('nwc.relay') ?? ''
  );
  let [nwcSecret, setNWCSecret] = useState(
    (localStorage.getItem('nwc.secret') ?? '').length > 0 ? 
    crypto.AES.decrypt((localStorage.getItem('nwc.secret') ?? ''), myEncryptionKey ).toString(crypto.enc.Utf8) : ''
    //localStorage.getItem('nwc.secret') ?? ''
  );
  let [nwcConnectURL, setNWCConnectURL] = useState(
    (localStorage.getItem('nwc.connectUrl') ?? '').length > 0 ?
    crypto.AES.decrypt((localStorage.getItem('nwc.connectUrl') ?? ''), myEncryptionKey ).toString(crypto.enc.Utf8) : ''
    //localStorage.getItem('nwc.connectUrl') ?? ''
  );

  let [v4vSkipAdEnabled, setV4vSkipAdEnabled] = useState(
    localStorage.getItem('v4v2skipad.enabled') ?? 'false'
  );
  let [v4vSkipAdAmount, setV4vSkipAdAmount] = useState(
    localStorage.getItem('v4v2skipad.amount') ?? '10'
  );
  let [v4vSkipAdFrequency, setV4vSkipAdFrequency] = useState(
    localStorage.getItem('v4v2skipad.frequency') ?? '15'
  );
  let [v4vTipRoomEnabled, setV4vTipRoomEnabled] = useState(
    localStorage.getItem('v4vtiproom.enabled') ?? 'false'
  );
  let [v4vTipRoomAmount, setV4vTipRoomAmount] = useState(
    localStorage.getItem('v4vtiproom.amount') ?? '10'
  );
  let [v4vTipRoomFrequency, setV4vTipRoomFrequency] = useState(
    localStorage.getItem('v4vtiproom.frequency') ?? '15'
  );

  let [fileUploadAuth, setFileUploadAuth] = useState(
    localStorage.getItem('fileUpload.auth') ?? 'true'
  );


  let [petnameDecrypt, setPetnameDecrypt] = useState(
    localStorage.getItem('petnames.decryptwithoutprompt') ?? 'false'
  );
  let petnames = [];
  for (let lsk in localStorage) {
    if (lsk.endsWith(".petname")) {
      let v = localStorage.getItem(lsk);
      let n = lsk.replace('.petname','');
      petnames.push({npub: n, petname: v});
    }
  }
  let [publishStatus, setPublishStatus] = useState(
    localStorage.getItem('publishStatus.enabled') ?? 'false'
  );

  let userType = (nostrIdentity == undefined ? 'anon' : 'nostr');
  if (userType == 'nostr') {
    userType = (nostrNoteId == undefined ? 'nostrExtension' : 'nostrManual');
  }

  let [stickyEmoji1, setStickyEmoji1] = useState(localStorage.getItem('stickyEmoji1') ?? '☕');
  let [stickyEmoji2, setStickyEmoji2] = useState(localStorage.getItem('stickyEmoji2') ?? '🌽');
  function setStickyEmoji(position, emoji) {
    let theemoji = emoji.toString().toUpperCase().startsWith('E') ? emoji.toString().toUpperCase() : emoji;
    if (position < 1) {
      return;
    }
    let k = 'stickyEmoji' + position;
    localStorage.setItem(k, theemoji);
    if (position == 1) {setStickyEmoji1(theemoji)};
    if (position == 2) {setStickyEmoji2(theemoji)};
    sendCSAR("setstickyemoji");
  }
  function delStickyEmoji(position) {
    let k = 'stickyEmoji' + position;
    localStorage.removeItem(k);
    if (position == 1) {setStickyEmoji1('')};
    if (position == 2) {setStickyEmoji2('')};
  }
  
  async function copyIdToClipboard() {
    await window.navigator.clipboard.writeText(id);
    alert('Id copied to clipboard');
  }

  function AvatarChoices() {
    let avatarChoices = [];
    for (var i in Array.from(Array(9))) avatarChoices.push(`/img/avatars/avatar-corn-${i}.png`);
    let avatarFound = false;
    return (
      <>
      {avatarChoices.map((avatarChoice, index) => {
        let avatarChoiceUrl = avatarChoice;
        let avatarkey=`avatarkey_${index}`;
        if (avatarChoiceUrl == avatar) {
        avatarFound = true;
        return (
          <div
            key={avatarkey}
            className="w-16 h-16 m-2 border-2 rounded-lg border-blue-500"
          >
            <img
              src={avatarChoiceUrl}
              className="w-full h-full"
            />
          </div>
        );
        } else {
        return (
          <div
            key={avatarkey}
            onClick={() => setAvatar(avatarChoiceUrl)}
            className="w-16 h-16 m-2 cursor-pointer hover:border-blue-500"
          >
            <img
              src={avatarChoiceUrl}
              className="w-full h-full"
            />
          </div>
        );
        }
      })}
      {!avatarFound && (
          <div
            className="w-16 h-16 m-2 border-2 rounded-lg border-blue-500"
          >
            <img
              src={avatar}
              className="w-full h-full"
            />
          </div>
      )}
      </>
    );
  }

  const processFile = file => {
    return new Promise((res, rej) => {
      try {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
          // e.preventDefault();
          let avatar = reader.result;
          res(avatar);
        };
      } catch (error) {
        console.log('There was an error with the image');
        rej(undefined);
      }
    });
  };

  const updateValues = async (file, identities) => {
    setIsSaving(true);
    if (file) {
      const avatar = await processFile(file);
      if (!avatar) return;
      if (identities) {
        const ok = await updateInfo({name, avatar, identities});
        if (ok) close();
      } else {
        const ok = await updateInfo({name, avatar});
        if (ok) close();
      }
      setErrorMsg('The profile picture size must be less than 500kb.');
    } else {
      let bMode = 1;
      switch (bMode) {
        case 0:
          let ok = await updateInfo({name, identities});
          if (ok) {
            close();
          } else {
            setErrorMsg('Error calling updateInfo with identities');
          }
          break;
        case 1:
          if (nostrNpub) {
            // Nostr info present. But only set identities if already prepared
            const pubkey = nip19.decode(nostrNpub).data;
            const metadata = await getUserMetadata(pubkey, id);
            if (!metadata) {
              let ok = false;
              if (!identities) {
                ok = await updateInfo({name});
              } else {
                ok = await updateInfo({name, identities});
              }
              if (ok) {
                close();
              } else {
                setErrorMsg('Error calling updateInfo with identities');
              }
            } else {
              const avatar = metadata.picture;
              const name = metadata.name;
              let ok = false;
              if (!identities) {
                ok = await updateInfo({name, avatar});
              } else {
                ok = await updateInfo({name, avatar, identities});
              }
              if (ok) {
                close();
              } else {
                setErrorMsg('Error setting profile from nostr information');
              }
            }
          } else {
            // ensure a name is set
            if (name == undefined || name == '') {
              let userDisplayName = displayName(myIdentity.info, room);
              name = userDisplayName;
            }
            if (window.DEBUG) console.log('setting name for anonymous user and clearing identity verification');
            let ok = await updateInfo({name, avatar, identities});
            if (ok) {
              close();
            } else {
              setErrorMsg('Error setting name');
            }
          }
          break;
      }
    }
  };

  let submit = async e => {
    e.preventDefault();
    //sessionStorage.clear();
    setIsSaving(true);
    // for now, disallow uploading file, so we set as undefined to alter flow
    const selectedFile = undefined; // document.querySelector('.edit-profile-file-input').files[0];    
    localStorage.setItem('zaps.defaultAmount', defaultZapAmount);
    localStorage.setItem('zaps.defaultComment', defaultZapComment);
    localStorage.setItem('byeEmoji',byeEmoji);
    localStorage.setItem('animationsEnabled',animEnabled);
    localStorage.setItem('ghostsEnabled',ghostsEnabled);
    localStorage.setItem('fullsizeAvatars',showFullsizeAvatars);
    localStorage.setItem('maxPostsToDisplay',maxPostsToDisplay);
    localStorage.setItem('onlyZapsEnabled',onlyZapsEnabled);
    localStorage.setItem('doorbellEnabled',doorbellEnabled);
    localStorage.setItem('textchat.layout',textchatLayout);
    localStorage.setItem('textchat.showNames',textchatShowNames);
    localStorage.setItem('textchat.showAvatars',textchatShowAvatars);
    localStorage.setItem('textchat.showDates',textchatShowDates);
    localStorage.setItem('textchat.showDates.duration',textchatShowDatesDuration);
    localStorage.setItem('textchat.showTimestamps',textchatShowTimestamps);
    localStorage.setItem('textchat.bufferSize', textchatBufferSize);
    localStorage.setItem('textchat.encryptPM', textchatEncryptPM);
    localStorage.setItem('textchat.tonostr', textchatToNostr);
    localStorage.setItem('nwc.enabled', nwcEnabled);
    localStorage.setItem('nwc.pubkey', nwcWSPubkey);
    localStorage.setItem('nwc.relay', nwcRelay);
    localStorage.setItem('nwc.secret', crypto.AES.encrypt(nwcSecret, myEncryptionKey).toString());
    localStorage.setItem('nwc.connectUrl', crypto.AES.encrypt(nwcConnectURL, myEncryptionKey).toString());
    localStorage.setItem('v4v2skipad.enabled', v4vSkipAdEnabled);
    localStorage.setItem('v4v2skipad.amount', v4vSkipAdAmount);
    localStorage.setItem('v4v2skipad.frequency', v4vSkipAdFrequency);
    localStorage.setItem('v4vtiproom.enabled', v4vTipRoomEnabled);
    localStorage.setItem('v4vtiproom.amount', v4vTipRoomAmount);
    localStorage.setItem('v4vtiproom.frequency', v4vTipRoomFrequency);
    localStorage.setItem('petnames.decryptwithoutprompt', petnameDecrypt);
    localStorage.setItem('publishStatus.enabled', publishStatus);
    localStorage.setItem('fileUpload.auth', fileUploadAuth);

    if (verifyingNpub) {
      let identities = [];
      const pubkey = nip19.decode(nostrNpub).data;
      const nip19Decoded = nip19.decode(nostrNoteId);
      const nip19Type = nip19Decoded.type;
      let noteid = '';
      if (nip19Type === 'nevent') { noteid = nip19Decoded.data.id; }
      if (nip19Type === 'note') { noteid = nip19Decoded.data; }
      if (noteid.length == 0) {
        setErrorMsg(nip19Type + ' type of note or event id not handled');
        setIsSaving(false);
      } else {
        const verEvent = await getUserEventById(pubkey, noteid);
        if (!verEvent) {
          setErrorMsg('Nostr verification event was not found');
          setIsSaving(false);
        } else {
          addNostr(identities, nostrNpub, nostrNoteId, verEvent);
          await updateValues(selectedFile, identities);
        }
      }
    } else {
      await updateValues(selectedFile);
    }
    setIsSaving(false);
  };

  let cancel = e => {
    e.preventDefault();
    close();
  };

  let previewDoorbell = e => {
    e.preventDefault();
    let dbe = doorbellEnabled;
    if (dbe == undefined || dbe == '0') return;
    let dbs = document.getElementById("doorbellsound");
    if(dbs == undefined) return;
    dbs.src = doorbellsounds[Math.floor(dbe)-1][0];
    dbs.volume = .5;
    dbs.play();
    let r = (async () => {await sendCSAR("previewdoorbell");})();
  }

  let [expandedAnon, setExpandedAnon] = useState(false);
  let [expandedNostr, setExpandedNostr] = useState(false);
  let [expandedNotes, setExpandedNotes] = useState(false);
  let [expandedVisuals, setExpandedVisuals] = useState(false);
  let [expandedPetnames, setExpandedPetnames] = useState(false);  
  let [expandedSound, setExpandedSound] = useState(false);
  let [expandedStatus, setExpandedStatus] = useState(false);
  let [expandedTextChat, setExpandedTextChat] = useState(false);
  let [expandedZaps, setExpandedZaps] = useState(false);
  let [expandedFiles, setExpandedFiles] = useState(false);

  return (
    <Modal close={close}>
      <h1 className="text-gray-200">Edit Personal Settings</h1>
      <form onSubmit={submit}>

      {userType == 'anon' && (
      <div>
        <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpandedAnon(!expandedAnon)}>
          {expandedAnon ? '🔽' : '▶️'} Anon Identity
        </p>
        <div className={expandedAnon ? 'p-4 py-2 bg-gray-700 rounded-lg my-3' : 'hidden'}>

          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              Change Display Name
            </div>
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
              type="text"
              placeholder=""
              value={name ?? ''}
              name="display-name"
              onChange={e => {
                setName(e.target.value);
              }}
            />
            <br />
            <div className="p-2 text-gray-200 bold">
              Choose Avatar Image
            </div>
            <div className="flex flex-wrap justify-between">
              <AvatarChoices />
            </div>
            <div className="p-2 text-gray-200 bold">
              or specify a url for your avatar
            </div>
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
              type="text"
              placeholder=""
              value={avatar ?? ''}
              name="avatar-url"
              onChange={e => {
                setAvatar(e.target.value);
              }}
            />

            <span className={'hidden'}>
            <input
              type="file"
              accept="image/*"
              className="edit-profile-file-input rounded placeholder-gray-500 bg-gray-300 text-black w-72"
            />
            <div className="p-2 text-gray-200 italic">
              Change your profile picture. Limited to 500kb. If your picture is too large, try
              compressing it{' '}
              <a
                href="https://tinypng.com/"
                target="blank"
                className="text-blue-500"
              >
                here
              </a>
              <span className="text-gray-300"> (optional)</span>
            </div>
            <br />
            </span>
          </div>
        </div>
      </div>
      )}

      {userType != 'nostrExtension' && (
      <div>
        <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpandedNostr(!expandedNostr)}>
          {expandedNostr ? '🔽' : '▶️'} Nostr Identity
        </p>
        <div className={expandedNostr ? 'p-4 py-2 bg-gray-700 rounded-lg my-3' : 'hidden'}>

          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              Nostr Account Verification <span className="text-gray-300"> (optional)</span>
            </div>

            <div className="p-2 text-gray-300 italic">
            1. Specify your nostr npub
            </div>
            <input
              className="rounded placeholder-black bg-gray-400 text-black w-full"
              type="text"
              placeholder=""
              value={nostrNpub ?? ''}
              name="NostrNpub"
              style={{fontSize: '.75em'}}
              onChange={e => {
                setVerifyingNpub(true);
                setNostrNpub(e.target.value);
              }}
            />

            <div className="p-2 text-gray-300 italic">
            2. Create a nostr post that includes only the following (click to copy)
            </div>
            <input
              className="mt-2 rounded placeholder-black bg-gray-400 text-black w-full"
              type="text"
              style={{fontSize: '.75em'}}
              placeholder=""
              name="CornyChatJAMID"
              value={id ?? ''}
              onClick={async () => copyIdToClipboard()}
            />

            <div className="p-2 text-gray-300 italic">
            3. Copy and paste the nostr note or event id to the following field
            </div>
            <input
              className="mt-2 rounded placeholder-black bg-gray-400 text-black w-full"
              type="text"
              style={{fontSize: '.75em'}}
              placeholder=""
              name="NostrNoteID"
              value={nostrNoteId ?? ''}
              onChange={e => {
                setVerifyingNpub(true);
                setNostrNoteId(e.target.value.replace(/nostr:/,''));
              }}
            />
          </div>
        </div>
      </div>
      )}

      <div>
        <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpandedVisuals(!expandedVisuals)}>
          {expandedVisuals ? '🔽' : '▶️'} Visual Settings
        </p>
        <div className={expandedVisuals ? 'p-4 py-2 bg-gray-700 rounded-lg my-3' : 'hidden'}>

          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              Sticky Emojis - These may be displayed with the raise hand icon from the navigation bar. Click an existing emoji to clear it and choose another one.
            </div>
            <div className="p-2 text-gray-200">
              <span className="italic">Sticky Emoji 1 </span>{(stickyEmoji1.length != 0) && (
                <div className="p-2 m-2 bg-gray-700 cursor-pointer rounded-lg hover:bg-red-500"
                      onClick={() => delStickyEmoji(1)}
                ><p>{stickyEmoji1.toString().toUpperCase().startsWith('E') ? (
                <img
                  src={`/img/emojis/emoji-${stickyEmoji1.toString().toUpperCase()}.png`}
                  style={{
                  width: '24px',
                    height: 'auto',
                    border: '0px',
                    display: 'inline',
                  }}
                />
                ) : (stickyEmoji1)}</p>
                </div>
              )}
            </div>
            {stickyEmoji1.length == 0 && (
            <EmojiPicker
              width={'width:max-content'}
              onEmojiClick={emoji => setStickyEmoji(1, emoji.emoji)}
              previewConfig={{showPreview: false}}
              autoFocusSearch={false}
              searchPlaceHolder=''
              customEmojis={[
                {id: 'E1', names: ['Pepe 1'], imgUrl:'/img/emojis/emoji-E1.png'},
                {id: 'E2', names: ['Pepe 2'], imgUrl:'/img/emojis/emoji-E2.png'},
                {id: 'E3', names: ['Pepe 3'], imgUrl:'/img/emojis/emoji-E3.png'},
                {id: 'E4', names: ['Pepe 4'], imgUrl:'/img/emojis/emoji-E4.png'},
                {id: 'E5', names: ['Pepe 5'], imgUrl:'/img/emojis/emoji-E5.png'},
                {id: 'E6', names: ['Pepe 6'], imgUrl:'/img/emojis/emoji-E6.png'},
                {id: 'E7', names: ['Pepe 7'], imgUrl:'/img/emojis/emoji-E7.png'},
              ]}
            />
            )}
            <div className="p-2 text-gray-200">
              <span className="italic">Sticky Emoji 2 </span>{stickyEmoji2.length != 0 && (
                <div className="p-2 m-2 bg-gray-700 cursor-pointer rounded-lg hover:bg-red-500"
                    onClick={() => delStickyEmoji(2)}
                  ><p>{stickyEmoji2.toString().toUpperCase().startsWith('E') ? (
                  <img
                    src={`/img/emojis/emoji-${stickyEmoji2.toString().toUpperCase()}.png`}
                    style={{
                      width: '24px',
                      height: 'auto',
                      border: '0px',
                      display: 'inline',
                    }}
                  />
                ) : (stickyEmoji2)}</p>
                </div>
              )}
            </div>
            {stickyEmoji2.length == 0 && (
            <EmojiPicker
              width={'width:max-content'}
              onEmojiClick={emoji => setStickyEmoji(2, emoji.emoji)}
              previewConfig={{showPreview: false}}
              autoFocusSearch={false}
              searchPlaceHolder=''
              customEmojis={[
                {id: 'E1', names: ['Pepe 1'], imgUrl:'/img/emojis/emoji-E1.png'},
                {id: 'E2', names: ['Pepe 2'], imgUrl:'/img/emojis/emoji-E2.png'},
                {id: 'E3', names: ['Pepe 3'], imgUrl:'/img/emojis/emoji-E3.png'},
                {id: 'E4', names: ['Pepe 4'], imgUrl:'/img/emojis/emoji-E4.png'},
                {id: 'E5', names: ['Pepe 5'], imgUrl:'/img/emojis/emoji-E5.png'},
                {id: 'E6', names: ['Pepe 6'], imgUrl:'/img/emojis/emoji-E6.png'},
                {id: 'E7', names: ['Pepe 7'], imgUrl:'/img/emojis/emoji-E7.png'},
              ]}
            />
            )}
            
          </div>

          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              Sequence of letters or emojis to send when leaving the room
            </div>
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
              type="text"
              placeholder=""
              value={byeEmoji ?? ''}
              onChange={e => {
                setByeEmoji(e.target.value);
              }}
            />
            <div className="p-2 text-gray-200 italic">
              {`Multiple emojis can be specified.  Click the exit door twice when leaving to exit immediately.`}
              <span className="text-gray-300"> (optional)</span>
            </div>
          </div>

          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
              type="checkbox"
              checked={animEnabled == 'true' ? true : false}
              onChange={e => {
                setAnimEnabled(e.target.checked ? 'true' : 'false');
              }}
            />
              Enable Animations
            </div>
            <div className="p-2 text-gray-200 italic">
              Animations may cause flickering on some devices.  Uncheck this option to disable them
              <span className="text-gray-300"> (optional)</span>
            </div>
          </div>

          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
              type="checkbox"
              checked={ghostsEnabled == 'true' ? true : false}
              onChange={e => {
                setGhostsEnabled(e.target.checked ? 'true' : 'false');
                sendCSAR("setghostmode");
              }}
            />
              Enable Ghost Users
            </div>
            <div className="p-2 text-gray-200 italic">
              When enabled, users who are at the room entry screen, but not in the room will appear with a low opacity
              <span className="text-gray-300"> (optional)</span>
            </div>
          </div>

          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
              type="checkbox"
              checked={onlyZapsEnabled == 'true' ? true : false}
              onChange={e => {
                setOnlyZapsEnabled(e.target.checked ? 'true' : 'false');
              }}
            />
              Enable Only Zaps Mode
            </div>
            <div className="p-2 text-gray-200 italic">
              When enabled, you'll only send the lightning bolt emoji as reactions from the nav menu, and most of your static stickies will appear as the poo emoji
              <span className="text-gray-300"> (optional)</span>
            </div>
          </div>

          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
                type="checkbox"
                checked={showFullsizeAvatars == 'true' ? true : false}
                onChange={e => {
                  setShowFullsizeAvatars(e.target.checked ? 'true' : 'false');
                }}
              />
              Always show full size avatars.
            </div>
            <div className="p-2 text-gray-200 italic">
              When enabled, large avatars will be shown even when the text chat is open.  If not enabled, then mini avatars will be rendered when the chat is open which may be more suitable for mobile.
              <span className="text-gray-300"> (optional)</span>
            </div>
          </div>

        </div>
      </div>

      <div>
        <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpandedNotes(!expandedNotes)}>
          {expandedNotes ? '🔽' : '▶️'} Notes
        </p>
        <div className={expandedNotes ? 'p-4 py-2 bg-gray-700 rounded-lg my-3' : 'hidden'}>
          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              Post Count to Display in Profiles
            </div>
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-48"
              type="number"
              placeholder=""
              min="1"
              max="100"
              value={maxPostsToDisplay}
              onChange={e => {
                setMaxPostsToDisplay(Math.floor(e.target.value.replace(/[^0-9]/g,'')));
              }}
            />
            <div className="p-2 text-gray-200 italic">
              Indicate the maximum number of recent posts to render for a nostr user
              <span className="text-gray-300"> (default: 3)</span>
            </div>
          </div>         
        </div>
      </div>

      <div>
        <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpandedPetnames(!expandedPetnames)}>
          {expandedPetnames ? '🔽' : '▶️'} Petnames
        </p>
        <div className={expandedPetnames ? 'p-4 py-2 bg-gray-700 rounded-lg my-3' : 'hidden'}>
          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
                type="checkbox"
                checked={petnameDecrypt == 'true' ? true : false}
                onChange={e => {
                  setPetnameDecrypt(e.target.checked ? 'true' : 'false');
                }}
              />
              Decrypt petnames without prompting
            </div>
            <div className="p-2 text-gray-200 italic">
              You can set petnames by viewing the profile of a user and clicking on their name.  
              If you are using a nostr extension, these are stored as nostr events with the values encrypted if your extension supports it.
              Periodically, these petname events are retrieved, decrypted, and stored in local browser storage.
              <span className="text-gray-300"> (optional)</span>
            </div>

            {petnames.length > 0 && (
            <>
            <div className="p-2 text-gray-200 bold">Petnames stored locally</div>
            <table className="w-full"><tbody>
            {petnames.map((petnameInfo, index) => {
              let petnamekey = `petnamekey_${index}`;
              let n = petnameInfo.npub;
              let shortNpub = n.substring(0,8) + "..." + n.substring(n.length-8);
              return <tr key={petnamekey} className="p-2 text-gray-200">
                  <td>{shortNpub}</td>
                  <td>{petnameInfo.petname}</td>
                </tr>
            })}
            </tbody></table>
            </>
            )}
          </div>         
        </div>
      </div>

      <div>
        <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpandedSound(!expandedSound)}>
          {expandedSound ? '🔽' : '▶️'} Sounds
        </p>
        <div className={expandedSound ? 'p-4 py-2 bg-gray-700 rounded-lg my-3' : 'hidden'}>
          <p className="text-sm font-medium text-gray-300">
            Doorbell Sound
          </p>
          <select
              name="doorbellEnabled"
              defaultValue={doorbellEnabled}
              onChange={e => {
                setDoorbellEnabled(e.target.value);
                sendCSAR("setdoorbell");
              }}
              className={'border mt-3 ml-2 p-2 bg-gray-300 text-black rounded'}
            >
            <option key="0" value="0">None</option>
            {doorbellsounds?.map((doorbellinfo, index) => {
              let doorbellkey = `doorbellkey_${index}`;
              return <option key={doorbellkey} value={(index+1)}>{doorbellinfo[1]}</option>
            })}
          </select>
          <button
            onClick={previewDoorbell}
            className="flex-grow mt-5 h-10 mx-2 px-2 text-lg rounded-lg"
            style={{
              color: isDark(roomColor.buttons.primary)
                ? roomColor.text.light
                : roomColor.text.dark,
              backgroundColor: roomColor.buttons.primary,
            }}
          >
            Preview
          </button>          
          <p className="p-2 text-gray-200 italic">
            When enabled, a sound will play for you when another user enters the room
          </p>
        </div>
      </div>

      <div>
        <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpandedStatus(!expandedStatus)}>
          {expandedStatus ? '🔽' : '▶️'} Status Publication
        </p>
        <div className={expandedStatus ? 'p-4 py-2 bg-gray-700 rounded-lg my-3' : 'hidden'}>
          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
                type="checkbox"
                checked={publishStatus == 'true' ? true : false}
                onChange={e => {
                  setPublishStatus(e.target.checked ? 'true' : 'false');
                }}
              />
              Periodically publish status update to nostr. You may be prompted to sign kind 30315 events.
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpandedFiles(!expandedFiles)}>
          {expandedFiles ? '🔽' : '▶️'} File Settings
        </p>
        <div className={expandedFiles ? 'p-4 py-2 bg-gray-700 rounded-lg my-3' : 'hidden'}>
          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
                type="checkbox"
                checked={fileUploadAuth == 'true' ? true : false}
                onChange={e => {
                  setFileUploadAuth(e.target.checked ? 'true' : 'false');
                }}
              />
              Authenticate to File Server for uploading images. Authenticating may grant larger file upload permissions depending on your subscription status and you can later manage the file in your account. You may be prompted to sign kind 27235 events.
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpandedTextChat(!expandedTextChat)}>
          {expandedTextChat ? '🔽' : '▶️'} Text Chat
        </p>
        <div className={expandedTextChat ? 'p-4 py-2 bg-gray-700 rounded-lg my-3' : 'hidden'}>
          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              Layout
              <select
                  name="textchatLayout"
                  defaultValue={textchatLayout}
                  onChange={e => {
                    setTextchatLayout(e.target.value);
                  }}
                  className={'border mt-3 ml-2 p-2 bg-gray-300 text-black rounded'}
                >
                <option key="left" value="left">All left aligned</option>
                <option key="versus" value="versus">Versus alignment</option>
              </select>
            </div>
            <div className="p-2 text-gray-200 italic">
              Choose versus for messaging style left/right alignment. Or All left for traditional chat.
            </div>
          </div>
          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
                type="checkbox"
                checked={textchatShowDates == 'true' ? true : false}
                onChange={e => {
                  setTextchatShowDates(e.target.checked ? 'true' : 'false');
                }}
              />
              Group messages by Date Headers
              {textchatShowDates == 'true' && (
              <>
                &nbsp;Adjust the duration for each date/time header block
                <select
                  name="textchatShowDatesDuration"
                  defaultValue={textchatShowDatesDuration}
                  onChange={e => {
                    setTextchatShowDatesDuration(e.target.value);
                  }}
                  className={'border mt-3 ml-2 p-2 text-black rounded'}
                >
                <option key="textchatShowDatesDuration5" value="300">5 minutes</option>
                <option key="textchatShowDatesDuration10" value="600">10 minutes</option>
                <option key="textchatShowDatesDuration15" value="900">15 minutes</option>
                <option key="textchatShowDatesDuration30" value="1800">30 minutes</option>
                <option key="textchatShowDatesDuration60" value="3600">1 hour</option>
                <option key="textchatShowDatesDuration120" value="7200">2 hours</option>
                </select>
              </>
              )}
            </div>
          </div>
          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
                type="checkbox"
                checked={textchatShowTimestamps == 'true' ? true : false}
                onChange={e => {
                  setTextchatShowTimestamps(e.target.checked ? 'true' : 'false');
                }}
              />
              Show Timestamps in Text Chat
            </div>
          </div>          
          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
                type="checkbox"
                checked={textchatShowAvatars == 'true' ? true : false}
                onChange={e => {
                  setTextchatShowAvatars(e.target.checked ? 'true' : 'false');
                }}
              />
              Show User Avatars in Text Chat
            </div>
          </div>
          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
                type="checkbox"
                checked={textchatShowNames == 'true' ? true : false}
                onChange={e => {
                  setTextchatShowNames(e.target.checked ? 'true' : 'false');
                }}
              />
              Show User Names in Text Chat
            </div>
          </div>
          <div className="p-4 py-2 bg-gray-700  rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              Buffer Size
            </div>
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-48"
              type="number"
              placeholder="50"
              min="10"
              max="1000"
              value={textchatBufferSize ?? ''}
              onChange={e => {
                setTextchatBufferSize(Math.floor(e.target.value.replace(/[^0-9]/g,'')));
                sendCSAR("settextsize");
              }}
            />
            <div className="p-2 text-gray-200 italic">
              Indicate the number of text chat lines to retain
              <span className="text-gray-300"> (default: 50)</span>
            </div>
          </div>
          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
                type="checkbox"
                checked={textchatEncryptPM == 'true' ? true : false}
                onChange={e => {
                  setTextchatEncryptPM(e.target.checked ? 'true' : 'false');
                }}
              />
              Encrypt Private Messages
            </div>
          </div>
          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
                type="checkbox"
                checked={textchatToNostr == 'true' ? true : false}
                onChange={e => {
                  setTextchatToNostr(e.target.checked ? 'true' : 'false');
                }}
              />
              Publish my text chat to nostr when the room is a live activity. You may be prompted to sign kind 1311 events.
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpandedZaps(!expandedZaps)}>
          {expandedZaps ? '🔽' : '▶️'} Zap Settings
        </p>
        <div className={expandedZaps ? 'p-4 py-2 bg-gray-700 rounded-lg my-3' : 'hidden'}>
          <div className="p-4 py-2 bg-gray-700  rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              Default Zap Amount
            </div>
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-48"
              type="number"
              placeholder=""
              value={defaultZapAmount ?? ''}
              min="0"
              max="100000"
              onChange={e => {
                setDefaultZapAmount(Math.floor(e.target.value.replace(/[^0-9]/g,'')));
              }}
            />
            <div className="p-2 text-gray-200 italic">
              Configure your default zap amount for sending value to others
              <span className="text-gray-300"> (optional)</span>
            </div>
          </div>
          <div className="p-4 py-2 bg-gray-700  rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              Default Zap Comment
            </div>
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
              type="string"
              placeholder=""
              value={defaultZapComment ?? ''}
              onChange={e => {
                setDefaultZapComment(e.target.value);
              }}
            />
            <div className="p-2 text-gray-200 italic">
              Configure your default zap comment when sending value to others
              <span className="text-gray-300"> (optional)</span>
            </div>
          </div>

          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              Nostr Wallet Connect Settings
            </div>
            <div className="p-2 text-gray-200 italic">
              These are optional settings to facilitate integrated zapping
            </div>
            <div className="p-2 text-gray-200 bold">
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
              type="checkbox"
              checked={nwcEnabled == 'true' ? true : false}
              onChange={e => {
                setNWCEnabled(e.target.checked ? 'true' : 'false');
              }}
            />
              Enable Nostr Wallet Connect
            </div>
            {nwcEnabled == 'true' && (
              <>
            <div className="p-2 text-gray-200">
              Full Connection String
            </div>
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
              type="password"
              autoComplete="off"
              placeholder=""
              value={nwcConnectURL ?? ''}
              onChange={e => {
                const nwc = e.target.value;
                if (nwc.length > 0) {
                  let a = nwc.replace('nostr+walletconnect://','').replace('http://', '');
                  let relay = undefined;
                  let secret = undefined;
                  let pubkey = a.split("?")[0]; // pubkey
                  let b = (a.split("?")[1]).split("&");
                  for (let c of b) {
                    let d = c.split("=")[0];
                    let f = c.split("=")[1];
                    if (d == 'relay') relay = f;
                    if (d == 'secret') secret = f;
                  }
                  if (relay != undefined && secret != undefined && pubkey != undefined) {
                    setNWCWSPubkey(pubkey);
                    setNWCRelay(relay);
                    setNWCSecret(secret);
                    sendCSAR("setnwc");
                  }
                } else {
                  setNWCWSPubkey('');
                  setNWCRelay('');
                  setNWCSecret('');
                }
                setNWCConnectURL(nwc);
              }}
            />

            <div className="hidden p-2 text-gray-200">
              Wallet Service Pubkey
            </div>
            <input
              className="hidden rounded placeholder-gray-500 bg-gray-300 text-black w-full"
              type="string"
              placeholder=""
              value={nwcWSPubkey ?? ''}
              onChange={e => {
                setNWCWSPubkey(e.target.value);
              }}
            />
            <div className="hidden p-2 text-gray-200">
              Wallet Relay
            </div>
            <input
              className="hidden rounded placeholder-gray-500 bg-gray-300 text-black w-full"
              type="string"
              placeholder=""
              value={nwcRelay ?? ''}
              onChange={e => {
                setNWCRelay(e.target.value);
              }}
            />
            <div className="hidden p-2 text-gray-200">
              Secret
            </div>
            <input
              className="hidden rounded placeholder-gray-500 bg-gray-300 text-black w-full"
              type="password"
              autoComplete="off"
              placeholder=""
              value={nwcSecret ?? ''}
              onChange={e => {
                setNWCSecret(e.target.value);
              }}
            />

            <div className="p-2 text-gray-200 bold">
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
              type="checkbox"
              checked={v4vSkipAdEnabled == 'true' ? true : false}
              onChange={e => {
                setV4vSkipAdEnabled(e.target.checked ? 'true' : 'false');
              }}
            />
              Value 4 Value for Corny Chat developer.  
              {v4vSkipAdEnabled == 'true' && (
              <>
                &nbsp;Adjust the amount to send developer every 
                <select
                  name="v4vSkipAdFrequency"
                  defaultValue={v4vSkipAdFrequency}
                  onChange={e => {
                    setV4vSkipAdFrequency(e.target.value);
                  }}
                  className={'border mt-3 ml-2 p-2 bg-gray-300 text-black rounded'}
                >
                <option key="v4vSkipAdFrequency5" value="5">5</option>
                <option key="v4vSkipAdFrequency10" value="10">10</option>
                <option key="v4vSkipAdFrequency15" value="15">15</option>
                <option key="v4vSkipAdFrequency20" value="20">20</option>
                <option key="v4vSkipAdFrequency30" value="30">30</option>
                <option key="v4vSkipAdFrequency60" value="60">60</option>
                </select>
                minutes.
              </>
              )}
            </div>
            <div className="p-2 text-gray-200 italic">
              Text chat ads are not displayed to users that use this option to support the service.
              <span className="text-gray-300"> (optional)</span>
            </div>

            {v4vSkipAdEnabled == 'true' && (
            <>
            <div className="p-2 text-gray-200 bold">
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-20"
              type="number"
              min="5"
              max="1000"
              value={v4vSkipAdAmount}
              onInput={e => {
                let s = Math.floor(e.target.value.replace(/[^0-9]/g,''));
                let f = (60 / v4vSkipAdFrequency)
                let h = s * f;
                document.getElementById('v4vSkipAdLabel').innerText = `(${h} sats / hour)`;
              }}
              onChange={e => {
                setV4vSkipAdAmount(Math.floor(e.target.value.replace(/[^0-9]/g,'')));
              }}
            />
            <span
              style={{padding: '10px', fontWeight: 700}}
              id="v4vSkipAdLabel">({v4vSkipAdAmount * (60 / v4vSkipAdFrequency)} sats / hour)
            </span>
            </div>
            </>
            )}

            <div className="p-2 text-gray-200 bold">
              <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
                type="checkbox"
                checked={v4vTipRoomEnabled == 'true' ? true : false}
                onChange={e => {
                  setV4vTipRoomEnabled(e.target.checked ? 'true' : 'false');
                }}
              />
              Value 4 Value for Rooms.  You can opt-in to sending value periodically to rooms that have tips enabled.
              {v4vTipRoomEnabled == 'true' && (
              <>
                &nbsp;Adjust the amount to tip a room every 
                <select
                  name="v4vTipRoomFrequency"
                  defaultValue={v4vTipRoomFrequency}
                  onChange={e => {
                    setV4vTipRoomFrequency(e.target.value);
                  }}
                  className={'border mt-3 ml-2 p-2 bg-gray-300 text-black rounded'}
                >
                <option key="v4vTipRoomFrequency5" value="5">5</option>
                <option key="v4vTipRoomFrequency10" value="10">10</option>
                <option key="v4vTipRoomFrequency15" value="15">15</option>
                <option key="v4vTipRoomFrequency20" value="20">20</option>
                <option key="v4vTipRoomFrequency30" value="30">30</option>
                <option key="v4vTipRoomFrequency60" value="60">60</option>
                </select>                
                minutes.  When in a room, toggle autotipping with the option in the upper left corner.
              </>
              )}
            </div>
            {v4vTipRoomEnabled == 'true' && (
            <>
            <div className="p-2 text-gray-200 bold">
              <input
                className="rounded placeholder-gray-500 bg-gray-300 text-black w-20"
                type="number"
                min="5"
                max="1000"
                value={v4vTipRoomAmount}
                onInput={e => {
                  let s = Math.floor(e.target.value.replace(/[^0-9]/g,''));
                  let f = (60 / v4vTipRoomFrequency);
                  let h = s * f;
                  document.getElementById('v4vTipRoomLabel').innerText = `(${h} sats / hour)`;
                }}
                onChange={e => {
                  setV4vTipRoomAmount(Math.floor(e.target.value.replace(/[^0-9]/g,'')));
                }}
              />
              <span
                style={{padding: '10px', fontWeight: 700}}
                id="v4vTipRoomLabel">({v4vTipRoomAmount * (60 / v4vTipRoomFrequency)} sats / hour)</span>              
            </div>
            </>
            )}
            </>
          )}
          </div>

        </div>
      </div>

      {showErrorMsg ? <p className="text-red-500">{showErrorMsg}</p> : null}
      <div className="flex">
        <button
          onClick={submit}
          className="flex-grow mt-5 h-12 px-6 text-lg rounded-lg"
          style={{
            color: isDark(roomColor.buttons.primary)
              ? roomColor.text.light
              : roomColor.text.dark,
            backgroundColor: roomColor.buttons.primary,
          }}
        >
          {isSaving ? <LoadingIcon /> : 'Save'}
        </button>
        <button
          onClick={cancel}
          className="flex-none mt-5 h-12 px-6 text-lg text-black bg-gray-100 rounded-lg focus:shadow-outline active:bg-gray-300"
        >
          Cancel
        </button>
      </div>
      </form>
    </Modal>
  );
}
