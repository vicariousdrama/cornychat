import React, {useState} from 'react';
import {Modal} from './Modal';
import {useMqParser} from '../lib/tailwind-mqp';
import {use} from 'use-minimal-state';
import {useJam} from '../jam-core-react';
import {getUserMetadata, getUserEvent, setDefaultZapsAmount} from '../nostr/nostr';
import {nip19} from 'nostr-tools';
import {isDark, colors} from '../lib/theme';
import {avatarUrl, displayName} from '../lib/avatar';
import EmojiPicker from 'emoji-picker-react';
import reactionEmojis from '../emojis';

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

export default function EditIdentity({close}) {
  const [state, {updateInfo}] = useJam();
  const [id, myIdentity] = use(state, ['myId', 'myIdentity']);
  const info = myIdentity?.info;
  const nostrIdentity = info?.identities?.find(i => i.type === 'nostr');
  const mqp = useMqParser();
  const colorTheme = state.room?.color ?? 'default';
  const roomColor = colors(colorTheme, state.room.customColor);
  let nostrNote = nostrIdentity?.verificationInfo;

  let [name, setName] = useState(info?.name); // ?? info?.displayName);
  let [avatar, setAvatar] = useState(info?.avatar);
  let [verifyingNpub, setVerifyingNpub] = useState(false);
  let [nostrNpub, setNostrNpub] = useState(nostrIdentity?.id);
  let [nostrNoteId, setNostrNoteId] = useState(nostrIdentity?.verificationInfo);
  let [nostrNoteVerified, setNostrNoteVerified] = useState(false);
  let room = use(state, 'room');

  if (name == undefined) {
    let userDisplayName = displayName(myIdentity.info, room);
    name = userDisplayName;
  }

  if (avatar == undefined) {
    let userAvatar = avatarUrl(myIdentity.info, room);
    avatar = userAvatar;
  }

  const [showErrorMsg, setErrorMsg] = useState(false);
  const [showNostrVerify, setShowNostrVerify] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  let [defaultZap, setDefaultZap] = useState(
    localStorage.getItem('defaultZap') ?? ''
  );
  let [byeEmoji, setByeEmoji] = useState(
    localStorage.getItem('byeEmoji') ?? 'Goodbye'
  );
  let [animEnabled, setAnimEnabled] = useState(
    localStorage.getItem('animationsEnabled') ?? 'false'
  );

  let userType = (nostrIdentity == undefined ? 'anon' : 'nostr');
  if (userType == 'nostr') {
    userType = (nostrNoteId == undefined ? 'nostrExtension' : 'nostrManual');
  }
  console.log('userType: ', userType);

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
    let avatarChoices = [
      '/img/avatar-corn-0.png',
      '/img/avatar-corn-1.png',
      '/img/avatar-corn-2.png',
      '/img/avatar-corn-3.png',
      '/img/avatar-corn-4.png',
      '/img/avatar-corn-5.png',
      '/img/avatar-corn-6.png',
      '/img/avatar-corn-7.png',
      '/img/avatar-corn-8.png',
    ];
    let avatarFound = false;
    return (
      <>
      {avatarChoices.map((avatarChoice, index) => {
        let avatarChoiceUrl = avatarChoice;
        if (avatarChoiceUrl == avatar) {
        avatarFound = true;
        return (
          <div
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


  const LoadingIcon = () => {
    return (
      <div className="flex justify-center">
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 6.627 5.373 12 12 12v-4c-3.313 0-6-2.687-6-6z"
          ></path>
        </svg>
      </div>
    );
  };

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
    setIsLoading(false);
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
            const metadata = await getUserMetadata(pubkey, [], null);
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
            console.log('setting name for anonymous user and clearing identity verification');
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
    sessionStorage.clear();
    setIsLoading(true);
    // for now, disallow uploading file, so we set as undefined to alter flow
    const selectedFile = undefined; // document.querySelector('.edit-profile-file-input').files[0];
    setDefaultZapsAmount(defaultZap);
    localStorage.setItem('byeEmoji',byeEmoji);
    console.log('animEnabled',animEnabled);
    localStorage.setItem('animationsEnabled',animEnabled);

    if (verifyingNpub) {
      console.log('verifying npub');
      let identities = [];
      const pubkey = nip19.decode(nostrNpub).data;
      const nip19Decoded = nip19.decode(nostrNoteId);
      const nip19Type = nip19Decoded.type;
      let noteid = '';
      if (nip19Type === 'nevent') { noteid = nip19Decoded.data.id; }
      if (nip19Type === 'note') { noteid = nip19Decoded.data; }
      if (noteid.length == 0) {
        setErrorMsg(nip19Type + ' type of note or event id not handled');
        setIsLoading(false);
      } else {
        const verEvent = await getUserEvent(pubkey, [], noteid);
        if (!verEvent) {
          setErrorMsg('Nostr verification event was not found');
          setIsLoading(false);
        } else {
          console.log('Found nostr verification event',verEvent);
          addNostr(identities, nostrNpub, nostrNoteId, verEvent);
          await updateValues(selectedFile, identities);
        }
      }
    } else {
      await updateValues(selectedFile);
    }
    setIsLoading(false);
  };

  let cancel = e => {
    e.preventDefault();
    close();
  };

  return (
    <Modal close={close}>
      <h1>Edit Personal Settings</h1>
      <br />
      <form onSubmit={submit}>

      {userType == 'anon' && (
      <div className="p-4 py-2 bg-gray-100 rounded-lg my-3">
        <div className="p-2 text-gray-500 bold">
          Change Display Name
        </div>
        <input
          className="rounded placeholder-gray-400 bg-gray-50 w-full"
          type="text"
          placeholder="Display name"
          value={name ?? ''}
          name="display-name"
          onChange={e => {
            setName(e.target.value);
          }}
        />
        <br />
        <div className="p-2 text-gray-500 bold">
          Choose Avatar Image
        </div>
        <div className="flex flex-wrap justify-between">
          <AvatarChoices />
        </div>
        <div className="p-2 text-gray-500 bold">
          or specify a url for your avatar
        </div>
        <input
          className="rounded placeholder-gray-400 bg-gray-50 w-full"
          type="text"
          placeholder="Avatar Url"
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
          className="edit-profile-file-input rounded placeholder-gray-400 bg-gray-50 w-72"
        />
        <div className="p-2 text-gray-500 italic">
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
      )}

      {userType != 'nostrExtension' && (
      <div className="p-4 py-2 bg-gray-100 rounded-lg my-3">
        <div className="p-2 text-gray-500 bold">
          Nostr Account Verification <span className="text-gray-300"> (optional)</span>
        </div>

        <div className="p-2 text-gray-500 italic">
          {`1. Specify your nostr npub`}
        </div>
        <input
          className="rounded placeholder-gray-400 bg-gray-50 w-full"
          type="text"
          placeholder="npub1234"
          value={nostrNpub ?? ''}
          name="NostrNpub"
          style={{fontSize: '.75em'}}
          onChange={e => {
            setVerifyingNpub(true);
            setNostrNpub(e.target.value);
          }}
        />

        <div className="p-2 text-gray-500 italic">
        2. Create a nostr post that includes only the following (click to copy)
        </div>
        <input
          className="mt-2 rounded placeholder-gray-400 bg-gray-100 w-full"
          type="text"
          style={{fontSize: '.75em'}}
          placeholder="ID"
          name="CornyChatJAMID"
          value={id ?? ''}
          onClick={async () => copyIdToClipboard()}
        />

        <div className="p-2 text-gray-500 italic">
        3. Copy and paste the nostr note or event id to the following field
        </div>
        <input
          className="mt-2 rounded placeholder-gray-400 bg-gray-50 w-full"
          type="text"
          style={{fontSize: '.75em'}}
          placeholder="Nostr note ID"
          name="NostrNoteID"
          value={nostrNoteId ?? ''}
          onChange={e => {
            setVerifyingNpub(true);
            setNostrNoteId(e.target.value.replace(/nostr:/,''));
          }}
        />
      </div>
      )}

      <div className="p-4 py-2 bg-gray-100 rounded-lg my-3">
        <div className="p-2 text-gray-500 bold">
          Default Zap Amount
        </div>
        <input
          className="rounded placeholder-gray-400 bg-gray-50 w-48"
          type="number"
          placeholder="21"
          value={defaultZap ?? ''}
          onChange={e => {
            setDefaultZap(e.target.value);
          }}
        />
        <div className="p-2 text-gray-500 italic">
          {`Configure your default zap amount for sending value to others`}
          <span className="text-gray-300"> (optional)</span>
        </div>
      </div>

      <div className="p-4 py-2 bg-gray-100 rounded-lg my-3">
        <div className="p-2 text-gray-500 bold">
          Sticky Emojis
        </div>
        <div className="p-2 text-gray-500 italic">
          Sticky Emoji 1
        </div>
        {stickyEmoji1.length == 0 ? (
        <EmojiPicker
          width={'width:max-content'}
          onEmojiClick={emoji => setStickyEmoji(1, emoji.emoji)}
          previewConfig={{showPreview: false}}
          autoFocusSearch={false}
          searchPlaceHolder=''
          customEmojis={[
            {id: 'E1', names: ['Pepe 1'], imgUrl:'/img/emoji-E1.png'},
            {id: 'E2', names: ['Pepe 2'], imgUrl:'/img/emoji-E2.png'},
            {id: 'E3', names: ['Pepe 3'], imgUrl:'/img/emoji-E3.png'},
            {id: 'E4', names: ['Pepe 4'], imgUrl:'/img/emoji-E4.png'},
            {id: 'E5', names: ['Pepe 5'], imgUrl:'/img/emoji-E5.png'},
            {id: 'E6', names: ['Pepe 6'], imgUrl:'/img/emoji-E6.png'},
            {id: 'E7', names: ['Pepe 7'], imgUrl:'/img/emoji-E7.png'},
          ]}
        />
        ) : (
        <div className="p-2 m-2 bg-gray-200 rounded-lg hover:bg-red-500"
          onClick={() => delStickyEmoji(1)}
        ><p>{stickyEmoji1.toString().toUpperCase().startsWith('E') ? (
          <img
            src={`/img/emoji-${stickyEmoji1.toString().toUpperCase()}.png`}
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
        <div className="p-2 text-gray-500 italic">
          Sticky Emoji 2
        </div>
        {stickyEmoji2.length == 0 ? (
        <EmojiPicker
          width={'width:max-content'}
          onEmojiClick={emoji => setStickyEmoji(2, emoji.emoji)}
          previewConfig={{showPreview: false}}
          autoFocusSearch={false}
          searchPlaceHolder=''
          customEmojis={[
            {id: 'E1', names: ['Pepe 1'], imgUrl:'/img/emoji-E1.png'},
            {id: 'E2', names: ['Pepe 2'], imgUrl:'/img/emoji-E2.png'},
            {id: 'E3', names: ['Pepe 3'], imgUrl:'/img/emoji-E3.png'},
            {id: 'E4', names: ['Pepe 4'], imgUrl:'/img/emoji-E4.png'},
            {id: 'E5', names: ['Pepe 5'], imgUrl:'/img/emoji-E5.png'},
            {id: 'E6', names: ['Pepe 6'], imgUrl:'/img/emoji-E6.png'},
            {id: 'E7', names: ['Pepe 7'], imgUrl:'/img/emoji-E7.png'},
          ]}
        />
        ) : (
        <div className="p-2 m-2 bg-gray-200 rounded-lg hover:bg-red-500"
          onClick={() => delStickyEmoji(2)}
        ><p>{stickyEmoji2.toString().toUpperCase().startsWith('E') ? (
          <img
            src={`/img/emoji-${stickyEmoji2.toString().toUpperCase()}.png`}
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

      <div className="p-4 py-2 bg-gray-100 rounded-lg my-3">
        <div className="p-2 text-gray-500 bold">
          Sequence of letters or emojis to send when leaving the room
        </div>
        <input
          className="rounded placeholder-gray-400 bg-gray-50 w-full"
          type="text"
          placeholder="Goodbye"
          value={byeEmoji ?? ''}
          onChange={e => {
            setByeEmoji(e.target.value);
          }}
        />
        <div className="p-2 text-gray-500 italic">
          {`Multiple emojis can be specified.  Click the exit door twice when leaving to exit immediately.`}
          <span className="text-gray-300"> (optional)</span>
        </div>
      </div>

      <div className="p-4 py-2 bg-gray-100 rounded-lg my-3">
        <div className="p-2 text-gray-500 bold">
        <input
          className="rounded placeholder-gray-400 bg-gray-50 w-8"
          type="checkbox"
          checked={animEnabled == 'true' ? true : false}
          onChange={e => {
            console.log('changing animEnabled',e.target.checked);
            setAnimEnabled(e.target.checked ? 'true' : 'false');
          }}
        />
          Enable Animations
        </div>
        <div className="p-2 text-gray-500 italic">
          {`Animations may cause flickering on some devices.  Uncheck this option to disable them`}
          <span className="text-gray-300"> (optional)</span>
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
          {isLoading ? <LoadingIcon /> : 'Done'}
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
