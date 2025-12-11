import React, {useState, useEffect} from 'react';
import {useJam, useJamState} from '../jam-core-react';
import {colors, isDark} from '../lib/theme';
import {handleFileUpload} from '../lib/fileupload.js';
import {useMqParser} from '../lib/tailwind-mqp.js';
import {LoadingIcon} from '../views/Svg.jsx';
import {
  addTagToList,
  getPublicKey,
  loadAllSoundEffectSets,
  loadFavoriteSoundEffectSets,
  removeTagFromList,
  requestDeletionById,
  signAndSendEvent,
} from '../nostr/nostr';

export default function SFX() {
  let mqp = useMqParser();
  const [myFavoritedSoundEffectSets, setMyFavoritedSoundEffectSets] = useState(
    []
  );
  const [allSoundEffectSets, setAllSoundEffectSets] = useState([]);
  const [viewMode, setViewMode] = useState('allsets'); // favorites, allsets, newset
  const colorGroupFavorite = `rgba(210, 137, 1, 1)`;
  const colorGroupAllSets = `rgba(84, 4, 116, 1)`;
  const colorGroupNew = `rgba(3, 94, 48, 1)`;
  const [borderActiveGroup, setBorderActiveGroup] = useState(
    colorGroupFavorite
  );
  const [backgroundColorActive, setBackgroundColorActive] = useState(
    colorGroupFavorite.replace(')', ',.25)')
  );
  const [{room}] = useJam();
  const colorTheme = room?.color ?? 'default';
  const roomColor = colors(colorTheme, room.customColor);
  const textColor = isDark(roomColor.avatarBg)
    ? roomColor.text.light
    : roomColor.text.dark;
  let showUploadFile =
    (localStorage.getItem(`fileUpload.auth`) ?? 'false') == 'true' &&
    window.nostr;
  let uploadNewSetImageFile = async e => {
    e.preventDefault();
    let buttonObject = document.getElementById('buttonUploadNewSetImage');
    let fileObject = document.getElementById('fileUploadNewSetImage');
    let textObject = document.getElementById('fileUploadingNewSetImage');
    buttonObject.style.display = 'none';
    fileObject.style.display = 'none';
    textObject.style.display = 'inline';
    let urls = await handleFileUpload(fileUploadNewSetImage);
    if (urls.length > 0) {
      setNewSetImage(urls[0]);
    }
    textObject.style.display = 'none';
    fileObject.style.display = 'inline';
    buttonObject.style.display = 'inline';
  };
  let uploadNewSoundFile = async e => {
    e.preventDefault();
    let buttonObject = document.getElementById('buttonUploadNewSoundFile');
    let fileObject = document.getElementById('fileUploadNewSoundFile');
    let textObject = document.getElementById('fileUploadingNewSoundFile');
    buttonObject.style.display = 'none';
    fileObject.style.display = 'none';
    textObject.style.display = 'inline';
    let urls = await handleFileUpload(fileUploadNewSoundFile);
    if (urls.length > 0) {
      setNewSoundFile(urls[0]);
    }
    textObject.style.display = 'none';
    fileObject.style.display = 'inline';
    buttonObject.style.display = 'inline';
  };
  let uploadNewSoundImageFile = async e => {
    e.preventDefault();
    let buttonObject = document.getElementById('buttonUploadNewSoundImage');
    let fileObject = document.getElementById('fileUploadNewSoundImage');
    let textObject = document.getElementById('fileUploadingNewSoundImage');
    buttonObject.style.display = 'none';
    fileObject.style.display = 'none';
    textObject.style.display = 'inline';
    let urls = await handleFileUpload(fileUploadNewSoundImage);
    if (urls.length > 0) {
      setNewSoundImage(urls[0]);
    }
    textObject.style.display = 'none';
    fileObject.style.display = 'inline';
    buttonObject.style.display = 'inline';
  };
  let uploadEditSoundFile = async e => {
    e.preventDefault();
    let buttonObject = document.getElementById('buttonUploadEditSoundFile');
    let fileObject = document.getElementById('fileUploadEditSoundFile');
    let textObject = document.getElementById('fileUploadingEditSoundFile');
    buttonObject.style.display = 'none';
    fileObject.style.display = 'none';
    textObject.style.display = 'inline';
    let urls = await handleFileUpload(fileUploadEditSoundFile);
    if (urls.length > 0) {
      setEditSoundFile(urls[0]);
    }
    textObject.style.display = 'none';
    fileObject.style.display = 'inline';
    buttonObject.style.display = 'inline';
  };
  let uploadEditSoundImageFile = async e => {
    e.preventDefault();
    let buttonObject = document.getElementById('buttonUploadEditSoundImage');
    let fileObject = document.getElementById('fileUploadEditSoundImage');
    let textObject = document.getElementById('fileUploadingEditSoundImage');
    buttonObject.style.display = 'none';
    fileObject.style.display = 'none';
    textObject.style.display = 'inline';
    let urls = await handleFileUpload(fileUploadEditSoundImage);
    if (urls.length > 0) {
      setEditSoundImage(urls[0]);
    }
    textObject.style.display = 'none';
    fileObject.style.display = 'inline';
    buttonObject.style.display = 'inline';
  };
  let emptySet = {title: '', summary: '', image: '', sounds: []};
  let newEmptySet = {...emptySet};
  let useSampleSet = false;
  if (useSampleSet) {
    let sTitle = 'Train Sounds';
    let sSummary = 'A small set of sounds associated with locomotives';
    let sImage = 'https://cornychat.com/img/sounds/train-on-tracks.png';
    let ss1 = [
      'steam crossing',
      'https://cornychat.com/mp3/steam-train-at-crossing-62158.mp3',
      'https://cornychat.com/img/sounds/steam-crossing.png',
    ];
    let ss2 = [
      'train horn',
      'https://cornychat.com/mp3/train-horn-306424.mp3',
      'https://cornychat.com/img/sounds/train-horn.png',
    ];
    let ss3 = [
      'train on tracks',
      'https://cornychat.com/mp3/train-on-tracks-232447.mp3',
      'https://cornychat.com/img/sounds/train-on-tracks.png',
    ];
    let ss4 = [
      'whistle',
      'https://cornychat.com/mp3/old-train-steam-whistle-reverb-256873.mp3',
      'https://cornychat.com/img/sounds/train-whistle.png',
    ];
    let ss5 = [
      'steam engine',
      'https://cornychat.com/mp3/steam-engine-37399.mp3',
      'https://cornychat.com/img/sounds/steam-engine.png',
    ];
    let sampleSounds = [ss1, ss2, ss3, ss4, ss5];
    let sampleSet = {
      title: sTitle,
      summary: sSummary,
      image: sImage,
      sounds: sampleSounds,
    };
    newEmptySet = {...sampleSet};
  }
  const [newSetInfo, setNewSetInfo] = useState(newEmptySet);
  const [newSetTitle, setNewSetTitle] = useState(newSetInfo?.title ?? '');
  const [newSetSummary, setNewSetSummary] = useState(newSetInfo?.summary ?? '');
  const [newSetImage, setNewSetImage] = useState(newSetInfo?.image ?? '');
  const [newSoundCaption, setNewSoundCaption] = useState('');
  const [newSoundFile, setNewSoundFile] = useState('');
  const [newSoundImage, setNewSoundImage] = useState('');
  const [editSoundIndex, setEditSoundIndex] = useState('');
  const [editSoundCaption, setEditSoundCaption] = useState('');
  const [editSoundFile, setEditSoundFile] = useState('');
  const [editSoundImage, setEditSoundImage] = useState('');
  const [editingSet, setEditingSet] = useState(false);
  const [editingDTag, setEditingDTag] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [myPubkey, setMyPubkey] = useState('');

  let submitNewSet = async e => {
    e.preventDefault();
    // create, sign, publish event to user relays
    let myPubkey = await getPublicKey();
    let created_at = Math.floor(Date.now() / 1000);
    let tags = [];
    let content = '';
    let kind = 34388;
    let dTag = `sfxset-${created_at}`;
    if (editingDTag.length > 0 && editingSet) dTag = editingDTag;
    tags.push(['d', dTag]);
    tags.push(['L', 'com.cornychat']);
    tags.push(['l', 'cornychat.com', 'com.cornychat']);
    tags.push(['l', 'audiospace', 'com.cornychat']);
    tags.push(['alt', 'Sound Effect Set']);
    tags.push(['title', newSetTitle]);
    tags.push(['summary', newSetSummary]);
    tags.push(['image', newSetImage]);
    if (newSetInfo.sounds) {
      for (let soundEntry of newSetInfo.sounds) {
        tags.push(['sound', ...soundEntry]);
      }
    }
    let event = {
      created_at: created_at,
      content: content,
      kind: kind,
      pubkey: myPubkey,
      tags: tags,
    };
    console.log(JSON.stringify(event));
    let rEvent = await signAndSendEvent(event);

    // add to favorites
    console.log('adding to favorites');
    let aTagValue = `${kind}:${myPubkey}:${dTag}`;
    let rFavorites = await addTagToList(
      'a',
      aTagValue,
      14388,
      'User Sound Effects List'
    );
    // invalidate respective session retrieve time
    // todo: alternative set the value to current time?
    sessionStorage.setItem(`${myPubkey}.kind14388events.retrieveTime`, 0);

    // add to session storage cache
    console.log('adding to session storage cache');
    let sessionSFX = localStorage.getItem('soundBoards');
    if (sessionSFX == undefined) sessionSFX = '[]';
    sessionSFX = JSON.parse(sessionSFX);
    let newSessionSFX = [];
    for (let sfx of sessionSFX) {
      let f = false;
      if (sfx.tags) {
        for (let t of sfx.tags) {
          if (t.length < 2) continue;
          if (t[0] == 'd' && t[1] == dTag) {
            f = true;
            break;
          }
        }
      }
      if (!f) newSessionSFX.push(sfx);
    }
    newSessionSFX.push(event);
    localStorage.setItem('soundBoards', JSON.stringify(newSessionSFX));
    let fav = await loadFavoriteSoundEffectSets();
    if (fav) setMyFavoritedSoundEffectSets(fav);

    // add to all sound boards
    console.log('adding to all sound boards');
    let asessionSFX = localStorage.getItem('allSoundBoards');
    if (asessionSFX == undefined) asessionSFX = '[]';
    asessionSFX = JSON.parse(asessionSFX);
    let newASessionSFX = [];
    for (let sfx of asessionSFX) {
      let f = false;
      if (sfx.tags) {
        for (let t of sfx.tags) {
          if (t.length < 2) continue;
          if (t[0] == 'd' && t[1] == dTag) {
            f = true;
            break;
          }
        }
      }
      if (!f) newASessionSFX.push(sfx);
    }
    newASessionSFX.push(event);
    localStorage.setItem('allSoundBoards', JSON.stringify(newASessionSFX));
    let com = await loadAllSoundEffectSets();
    if (com) setAllSoundEffectSets(com);

    // reset form values
    console.log('reseting form values');
    setNewSetTitle('');
    setNewSetImage('');
    setNewSetSummary('');
    let newEmptySet = {...emptySet};
    setNewSetInfo(newEmptySet);
    setNewSoundCaption('');
    setNewSoundFile('');
    setNewSoundImage('');
    setEditingSet(false);
    setEditingDTag('');

    // bounce views to favorites
    setViewMode('favorites');
  };
  let submitNewSound = async e => {
    e.preventDefault();
    let valid = true;
    let errors = [];
    if (newSoundCaption.length == 0) {
      errors.push('A caption is required for the new sound');
      valid = false;
    }
    if (newSoundFile.length == 0) {
      errors.push('An audio file is required for the new sound');
      valid = false;
    }
    if (newSoundImage.length > 0 && newSoundImage == newSoundFile) {
      errors.push(
        'An image for the sound file cannot be the same as the url of the sound file'
      );
      valid = false;
    }
    if (valid) {
      newSetInfo.sounds.push([newSoundCaption, newSoundFile, newSoundImage]);
      setNewSetInfo({...newSetInfo});
      setNewSoundCaption('');
      setNewSoundFile('');
      setNewSoundImage('');
    } else {
      if (errors.length > 0) {
        let msg = errors.join('\n');
        alert(msg);
      }
    }
  };
  let startEditSound = async (e, index) => {
    e.preventDefault();
    setEditSoundIndex(String(index));
    let al = newSetInfo.sounds[index].length;
    setEditSoundCaption(al > 0 ? newSetInfo.sounds[index][0] : '');
    setEditSoundFile(al > 1 ? newSetInfo.sounds[index][1] : '');
    setEditSoundImage(al > 2 ? newSetInfo.sounds[index][2] : '');
  };
  let submitEditSound = async e => {
    e.preventDefault();
    let valid = true;
    let errors = [];
    if (editSoundCaption.length == 0) {
      errors.push('A caption is required for each sound');
      valid = false;
    }
    if (editSoundFile.length == 0) {
      errors.push('An audio file is required for each sound');
      valid = false;
    }
    if (editSoundImage.length > 0 && editSoundImage == editSoundFile) {
      errors.push(
        'An image for the sound file cannot be the same as the url for the sound file'
      );
      valid = false;
    }
    if (valid) {
      newSetInfo.sounds[editSoundIndex][0] = editSoundCaption;
      newSetInfo.sounds[editSoundIndex][1] = editSoundFile;
      newSetInfo.sounds[editSoundIndex][2] = editSoundImage;
      setNewSetInfo({...newSetInfo});
      setEditSoundIndex('');
      setEditSoundCaption('');
      setEditSoundFile('');
      setEditSoundImage('');
    } else {
      if (errors.length > 0) {
        let msg = errors.join('\n');
        alert(msg);
      }
    }
  };
  let cancelEditSound = async e => {
    setEditSoundIndex('');
  };
  let unfavoriteSoundset = async (e, index, t) => {
    e.preventDefault();
    let ss = undefined;
    if (t) {
      ss = myFavoritedSoundEffectSets[index];
    } else {
      ss = allSoundEffectSets[index];
    }
    let kind = ss.kind;
    let pubkey = ss.pubkey;
    let dTag = '';
    if (ss.tags) {
      for (let t of ss.tags) {
        if (t.length < 2) continue;
        if (t[0] != 'd') continue;
        dTag = t[1];
        break;
      }
    }
    if (dTag.length == 0) return;
    let aTagValue = `${kind}:${pubkey}:${dTag}`;
    let rFavorites = await removeTagFromList(
      'a',
      aTagValue,
      14388,
      'User Sound Effects List'
    );

    // remove from session storage cache
    let sessionSFX = localStorage.getItem('soundBoards');
    if (sessionSFX == undefined) sessionSFX = '[]';
    sessionSFX = JSON.parse(sessionSFX);
    let newSessionSFX = [];
    for (let sfx of sessionSFX) {
      let f = false;
      if (sfx.kind == kind && sfx.pubkey == pubkey) {
        if (sfx.tags) {
          for (let t of sfx.tags) {
            if (t.length < 2) continue;
            if (t[0] == 'd' && t[1] == dTag) {
              f = true;
              break;
            }
          }
        }
      }
      if (!f) newSessionSFX.push(sfx);
    }
    localStorage.setItem('soundBoards', JSON.stringify(newSessionSFX));
    let fav = await loadFavoriteSoundEffectSets();
    if (fav) setMyFavoritedSoundEffectSets(fav);
  };
  let favoriteSoundset = async (e, index, t) => {
    e.preventDefault();
    let ss = undefined;
    if (t) {
      console.log(`favoriting from myFavoritedSoundEffectSets[${index}]`);
      ss = myFavoritedSoundEffectSets[index];
    } else {
      console.log(`favoriting from allSoundEffectSets[${index}]`);
      ss = allSoundEffectSets[index];
    }
    if (!ss) return;
    let kind = ss.kind;
    let pubkey = ss.pubkey;
    let dTag = '';
    if (ss.tags) {
      for (let t of ss.tags) {
        if (t.length < 2) continue;
        if (t[0] != 'd') continue;
        dTag = t[1];
        break;
      }
    }
    if (dTag.length == 0) return;
    let aTagValue = `${kind}:${pubkey}:${dTag}`;
    let rFavorites = await addTagToList(
      'a',
      aTagValue,
      14388,
      'User Sound Effects List'
    );

    // add to session storage cache
    let sessionSFX = localStorage.getItem('soundBoards');
    if (sessionSFX == undefined) sessionSFX = '[]';
    sessionSFX = JSON.parse(sessionSFX);
    let newSessionSFX = [];
    for (let sfx of sessionSFX) {
      let f = false;
      if (sfx.tags) {
        for (let t of sfx.tags) {
          if (t.length < 2) continue;
          if (t[0] == 'd' && t[1] == dTag) {
            f = true;
            break;
          }
        }
      }
      if (!f) newSessionSFX.push(sfx);
    }
    newSessionSFX.push(ss);
    localStorage.setItem('soundBoards', JSON.stringify(newSessionSFX));
    let fav = await loadFavoriteSoundEffectSets();
    if (fav) setMyFavoritedSoundEffectSets(fav);
  };
  let setupSES = async (ss, copy2new) => {
    let editSet = {...emptySet};
    if (ss.tags) {
      for (let t of ss.tags) {
        if (t.length < 2) continue;
        if (t[0] == 'title') {
          editSet.title = t[1];
          setNewSetTitle(editSet.title);
        }
        if (t[0] == 'summary') {
          editSet.summary = t[1];
          setNewSetSummary(editSet.summary);
        }
        if (t[0] == 'image') {
          editSet.image = t[1];
          setNewSetImage(editSet.image);
        }
        if (t[0] == 'sound') {
          editSet.sounds.push(t.slice(1));
        }
      }
    }
    setNewSetInfo(editSet);
    setNewSoundCaption('');
    setNewSoundFile('');
    setNewSoundImage('');
    setEditSoundIndex('');
    setEditSoundCaption('');
    setEditSoundFile('');
    setEditSoundImage('');
    setIsCopying(copy2new);
    setViewMode('newset');
  };
  let copyFSoundset = async (e, index, t) => {
    e.preventDefault();
    let ss = undefined;
    if (t) {
      console.log(`copying from myFavoritedSoundEffectSets[${index}]`);
      ss = myFavoritedSoundEffectSets[index];
    } else {
      console.log(`copying from allSoundEffectSets[${index}]`);
      ss = allSoundEffectSets[index];
    }
    setupSES(ss, true);
  };
  let editFSoundset = async (e, index, t) => {
    e.preventDefault();
    let ss = undefined;
    if (t) {
      console.log(`editing myFavoritedSoundEffectSets[${index}]`);
      ss = myFavoritedSoundEffectSets[index];
    } else {
      console.log(`editing allSoundEffectSets[${index}]`);
      ss = allSoundEffectSets[index];
    }
    if (ss.tags) {
      for (let t of ss.tags) {
        if (t.length < 2) continue;
        if (t[0] == 'd') {
          setEditingDTag(t[1]);
          setEditingSet(true);
          break;
        }
      }
    }
    setupSES(ss, false);
  };
  let deleteFSoundset = async (e, index, t) => {
    e.preventDefault();
    // remove from favorites
    let ss = undefined;
    if (t) {
      ss = myFavoritedSoundEffectSets[index];
    } else {
      ss = allSoundEffectSets[index];
    }
    if (!ss) return;
    let kind = ss.kind;
    let pubkey = ss.pubkey;
    let dTag = '';
    if (ss.tags) {
      for (let t of ss.tags) {
        if (t.length < 2) continue;
        if (t[0] != 'd') continue;
        dTag = t[1];
        break;
      }
    }
    if (dTag.length == 0) return;
    let aTagValue = `${kind}:${pubkey}:${dTag}`;
    let rT = await removeTagFromList(
      'a',
      aTagValue,
      14388,
      'User Sound Effects List'
    );
    // if its ours, delete it
    if (pubkey == myPubkey) {
      // issue nostr delete request
      let rD = await requestDeletionById(ss.id);
    }
    let fav = await loadFavoriteSoundEffectSets();
    if (fav) setMyFavoritedSoundEffectSets(fav);
    let com = await loadAllSoundEffectSets();
    if (com) setAllSoundEffectSets(com);
  };

  useEffect(() => {
    const loadMyPubkey = async () => {
      if (window.nostr) {
        let pk = await getPublicKey();
        setMyPubkey(pk);
      }
    };
    loadMyPubkey();
    // 14388
    const loadMyFavoritedSoundEffectSets = async () => {
      let v = await loadFavoriteSoundEffectSets();
      if (v) {
        setMyFavoritedSoundEffectSets(v);
      }
    };
    loadMyFavoritedSoundEffectSets();
    // 34388
    const loadSoundEffectSets = async () => {
      let v = await loadAllSoundEffectSets();
      if (v) {
        // sort alphabetically, grouped by mine at the top
        let v1 = [];
        let v2 = [];
        for (let vi of v) {
          if (vi.pubkey == myPubkey) {
            v1.push(vi);
          } else {
            v2.push(vi);
          }
        }
        v1.sort((a, b) => {
          let atitle = '';
          let btitle = '';
          if (a.tags) {
            for (let t of a.tags) {
              if (t.length == 2 && t[0] == 'title') atitle = t[1];
            }
          }
          if (b.tags) {
            for (let t of b.tags) {
              if (t.length == 2 && t[0] == 'title') btitle = t[1];
            }
          }
          return atitle > btitle ? 1 : btitle > atitle ? -1 : 0;
        });
        v2.sort((a, b) => {
          let atitle = '';
          let btitle = '';
          if (a.tags) {
            for (let t of a.tags) {
              if (t.length == 2 && t[0] == 'title') atitle = t[1];
            }
          }
          if (b.tags) {
            for (let t of b.tags) {
              if (t.length == 2 && t[0] == 'title') btitle = t[1];
            }
          }
          return atitle > btitle ? 1 : btitle > atitle ? -1 : 0;
        });
        v = [...v1, ...v2];
        setAllSoundEffectSets(v);
      }
    };
    loadSoundEffectSets();
    // This function is called when component unmounts
    return () => {};
  }, []);

  return (
    <div className="p-6 md:p-10 bg-slate-500" style={{color: 'white'}}>
      <div align="center">
        <blockquote>
          <pre>
            <small>
              .----------------. .----------------. .----------------. <br />
              | .--------------. || .--------------. || .--------------. |<br />
              | | _______ | || | _________ | || | ____ ____ | |<br />
              | | / ___ | | || | |_ ___ | | || | |_ _||_ _| | |<br />
              | | | (__ \_| | || | | |_ \_| | || | \ \ / / | |<br />
              | | '.___`-. | || | | _| | || | &gt; `' &lt; | |<br />
              | | |`\____) | | || | _| |_ | || | _/ /'`\ \_ | |<br />
              | | |_______.' | || | |_____| | || | |____||____| | |<br />
              | | | || | | || | | |<br />
              | '--------------' || '--------------' || '--------------' |<br />
              '----------------' '----------------' '----------------' <br />
              Sound Effect Sets. for nostr
            </small>
            <br />
          </pre>
        </blockquote>
      </div>
      <p className="text-lg">
        Your saved sound effect lists will be supported in applications that
        support nostr sound effects.
      </p>
      <p className="text-lg">
        This is a sample application for managing your sound effect lists and
        favoriting those created by the community at large. The two kinds used
        are kind 14388, a single replaceable collection of sound effect lists,
        and kind 34888, a sound effect set containing one or more URLs to sound
        files.
      </p>
      <div className="flex flex-wrap justify-center">
        <div
          className="cursor-pointer text-white p-2 mt-2 mr-1 rounded-t-md"
          style={{
            border: `1px solid ${colorGroupFavorite}`,
            width: '100px',
            backgroundColor:
              viewMode == 'favorites'
                ? colorGroupFavorite
                : roomColor.background,
          }}
          onClick={async e => {
            e.stopPropagation();
            setViewMode('favorites');
            setBorderActiveGroup(colorGroupFavorite);
            setBackgroundColorActive(
              colorGroupFavorite.replace(',1)', ',.25)')
            );
          }}
        >
          Favorite Sound Sets
        </div>
        <div
          className="cursor-pointer text-white p-2 mt-2 mr-1 ml-1 rounded-t-md"
          style={{
            border: `1px solid ${colorGroupAllSets}`,
            width: '100px',
            backgroundColor:
              viewMode == 'allsets' ? colorGroupAllSets : roomColor.background,
          }}
          onClick={async e => {
            e.stopPropagation();
            setViewMode('allsets');
            setBorderActiveGroup(colorGroupAllSets);
            setBackgroundColorActive(colorGroupAllSets.replace(',1)', ',.25)'));
          }}
        >
          Community Sound Sets
        </div>
        <div
          className="cursor-pointer text-white p-2 mt-2 ml-1 rounded-t-md"
          style={{
            border: `1px solid ${colorGroupNew}`,
            width: '100px',
            backgroundColor:
              viewMode == 'newset' ? colorGroupNew : roomColor.background,
          }}
          onClick={async e => {
            e.stopPropagation();
            setViewMode('newset');
            setBorderActiveGroup(colorGroupNew);
            setBackgroundColorActive(colorGroupNew.replace(',1)', ',.25)'));
          }}
        >
          Create a Sound Set
        </div>
      </div>
      <div style={{align: 'center'}}>
        <div
          className="rounded-md w-full"
          style={{
            display: 'inline-block',
            color: `rgb(244,244,244)`,
            border: `3px solid ${borderActiveGroup}`,
            backgroundColor: backgroundColorActive,
            align: 'center',
          }}
        >
          {viewMode == 'favorites' && (
            <>
              <div align="center">
                <table class="w-full">
                  {myFavoritedSoundEffectSets.map((sfxset, index) => {
                    let isMine = sfxset.pubkey == myPubkey;
                    let sfxsetTitle = '';
                    let sfxsetImage = '';
                    let sfxsetCount = 0;
                    if (sfxset.tags) {
                      for (let st of sfxset.tags) {
                        if (st.length < 2) continue;
                        if (st[0] == 'title') sfxsetTitle = st[1];
                        if (st[0] == 'image') sfxsetImage = st[1];
                        if (st[0] == 'sound') sfxsetCount += 1;
                      }
                    }
                    return (
                      <tr>
                        <td>
                          <img
                            className="w-16 h-16"
                            src={sfxsetImage}
                            style={{display: 'none'}}
                            onLoad={e => (e.target.style.display = '')}
                          />
                        </td>
                        <td>{sfxsetTitle}</td>
                        <td>{sfxsetCount} sounds</td>
                        <td class="w-24">
                          <button
                            id="buttonUnfavoriteSoundset"
                            className="px-5 text-md rounded-md"
                            style={{
                              color: textColor,
                              backgroundColor: roomColor.buttons.primary,
                            }}
                            onClick={async e => {
                              unfavoriteSoundset(e, index, true);
                            }}
                          >
                            Unfavorite
                          </button>
                        </td>
                        <td class="w-24">
                          <button
                            id="buttonCopySoundset"
                            className="px-5 text-md rounded-md"
                            style={{
                              color: textColor,
                              backgroundColor: roomColor.buttons.primary,
                            }}
                            onClick={async e => {
                              copyFSoundset(e, index, true);
                            }}
                          >
                            Copy
                          </button>
                        </td>
                        <td class="w-24">
                          {isMine ? (
                            <button
                              id="buttonEditSoundset"
                              className="px-5 text-md rounded-md"
                              style={{
                                color: textColor,
                                backgroundColor: roomColor.buttons.primary,
                              }}
                              onClick={async e => {
                                editFSoundset(e, index, true);
                              }}
                            >
                              Edit
                            </button>
                          ) : (
                            <></>
                          )}
                        </td>
                        <td class="w-24">
                          {isMine ? (
                            <button
                              id="buttonDeleteSoundset"
                              className="px-5 text-md rounded-md"
                              style={{
                                color: textColor,
                                backgroundColor: roomColor.buttons.primary,
                              }}
                              onClick={async e => {
                                deleteFSoundset(e, index, true);
                              }}
                            >
                              Delete
                            </button>
                          ) : (
                            <></>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </table>
              </div>
            </>
          )}
          {viewMode == 'allsets' && (
            <>
              <div align="center">
                <table class="w-full">
                  {allSoundEffectSets.map((sfxset, index) => {
                    let isMine = sfxset.pubkey == myPubkey;
                    let sfxsetTitle = '';
                    let sfxsetImage = '';
                    let sfxsetCount = 0;
                    let sfxsetDTag = '';
                    let isFavorite = false;
                    if (sfxset.tags) {
                      for (let st of sfxset.tags) {
                        if (st.length < 2) continue;
                        if (st[0] == 'title') sfxsetTitle = st[1];
                        if (st[0] == 'image') sfxsetImage = st[1];
                        if (st[0] == 'sound') sfxsetCount += 1;
                        if (st[0] == 'd') sfxsetDTag = st[1];
                      }
                    }
                    let sfxsetATag = `${sfxset.kind}:${sfxset.pubkey}:${sfxsetDTag}`;
                    for (let mf of myFavoritedSoundEffectSets) {
                      if (mf.tags) {
                        for (let mft of mf.tags) {
                          if (mft.length < 2) continue;
                          if (mft[0] != 'd') continue;
                          if (
                            `${mf.kind}:${mf.pubkey}:${mft[1]}` == sfxsetATag
                          ) {
                            isFavorite = true;
                            break;
                          }
                          if (isFavorite) break;
                        }
                        if (isFavorite) break;
                      }
                    }
                    return (
                      <tr>
                        <td>
                          <img
                            className="w-16 h-16"
                            src={sfxsetImage}
                            style={{display: 'none'}}
                            onLoad={e => (e.target.style.display = '')}
                          />
                        </td>
                        <td>{sfxsetTitle}</td>
                        <td>{sfxsetCount} sounds</td>
                        <td class="w-24">
                          {isFavorite ? (
                            <button
                              id="buttonUnfavoriteSoundset"
                              className="px-5 text-md rounded-md"
                              style={{
                                color: textColor,
                                backgroundColor: roomColor.buttons.primary,
                              }}
                              onClick={async e => {
                                unfavoriteSoundset(e, index, false);
                              }}
                            >
                              Unfavorite
                            </button>
                          ) : (
                            <button
                              id="buttonFavoriteSoundset"
                              className="px-5 text-md rounded-md"
                              style={{
                                color: textColor,
                                backgroundColor: roomColor.buttons.primary,
                              }}
                              onClick={async e => {
                                favoriteSoundset(e, index, false);
                              }}
                            >
                              Favorite
                            </button>
                          )}
                        </td>
                        <td class="w-24">
                          <button
                            id="buttonCopySoundset"
                            className="px-5 text-md rounded-md"
                            style={{
                              color: textColor,
                              backgroundColor: roomColor.buttons.primary,
                            }}
                            onClick={async e => {
                              copyFSoundset(e, index, false);
                            }}
                          >
                            Copy
                          </button>
                        </td>
                        <td class="w-24">
                          {isMine ? (
                            <button
                              id="buttonEditSoundset"
                              className="px-5 text-md rounded-md"
                              style={{
                                color: textColor,
                                backgroundColor: roomColor.buttons.primary,
                              }}
                              onClick={async e => {
                                editFSoundset(e, index, false);
                              }}
                            >
                              Edit
                            </button>
                          ) : (
                            <></>
                          )}
                        </td>
                        <td class="w-24">
                          {isMine ? (
                            <button
                              id="buttonDeleteSoundset"
                              className="px-5 text-md rounded-md"
                              style={{
                                color: textColor,
                                backgroundColor: roomColor.buttons.primary,
                              }}
                              onClick={async e => {
                                deleteFSoundset(e, index, false);
                              }}
                            >
                              Delete
                            </button>
                          ) : (
                            <></>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </table>
              </div>
            </>
          )}
          {viewMode == 'newset' && (
            <>
              <div>
                <form onSubmit={submitNewSet}>
                  {isCopying && (
                    <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
                      <div className="p-2 text-gray-200 bold">
                        This is a copy of an existing sound set. All parameters
                        of the soundset have been initialized from the soundset
                        being copied. If you meant to edit a soundset that you
                        previously created, go back to the prior view and choose
                        the appropriate action. This copy mechanism allows for
                        rapidly creating a new soundset based on another
                        soundset.
                      </div>
                    </div>
                  )}

                  <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
                    <div className="p-2 text-gray-200 bold">Title</div>
                    <input
                      className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                      type="text"
                      placeholder=""
                      value={newSetTitle ?? ''}
                      onChange={e => {
                        setNewSetTitle(e.target.value);
                      }}
                    />
                    <div className="p-2 text-gray-200 italic">
                      {`A brief title for the sound set that will likely be rendered in drop down select boxes.`}
                      <span className="text-gray-300"> (required)</span>
                    </div>
                  </div>

                  <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
                    <div className="p-2 text-gray-200 bold">Summary</div>
                    <div className="flex justify-between">
                      <textarea
                        className={mqp(
                          'rounded-lg placeholder-gray-500 bg-gray-300 text-black border-4 pb-2 rounded-lg w-full md:w-96 h-24'
                        )}
                        value={newSetSummary}
                        name="newSetSummary"
                        autoComplete="off"
                        style={{
                          fontSize: '15px',
                        }}
                        onBlur={async e => {
                          setNewSetSummary(e.target.value);
                        }}
                        onChange={e => {
                          setNewSetSummary(e.target.value);
                        }}
                      ></textarea>
                    </div>
                    <div className="p-2 text-gray-200 italic">
                      {`A description or abstract of the sound effects contained within this sound effect set.`}
                      <span className="text-gray-300"> (optional)</span>
                    </div>
                  </div>

                  <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
                    <div className="p-2 text-gray-200 bold">Image</div>
                    <div className="flex justify-between">
                      <img
                        className="w-full h-full"
                        src={newSetImage}
                        style={{display: 'none'}}
                        onLoad={e => (e.target.style.display = '')}
                      />
                    </div>
                    <div className="flex justify-between">
                      <input
                        className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                        type="text"
                        placeholder=""
                        value={newSetImage ?? ''}
                        name="newSetImage"
                        onChange={e => {
                          setNewSetImage(e.target.value);
                        }}
                      />
                    </div>
                    <div className="p-2 text-gray-200 italic">
                      {`URL for an image to visually represent this sound set.`}
                      <span className="text-gray-300"> (optional)</span>
                    </div>
                    {showUploadFile && (
                      <>
                        <div className="flex justify-between">
                          <input
                            type="file"
                            name="uploadnewSetImage"
                            id="fileUploadNewSetImage"
                            accept="image/*"
                            className="w-full"
                            style={{
                              fontSize: '10pt',
                              margin: '0px',
                              marginLeft: '4px',
                              padding: '2px',
                            }}
                          />
                        </div>
                        <div>
                          <button
                            id="buttonUploadNewSetImage"
                            className="px-5 text-md rounded-md"
                            style={{
                              color: textColor,
                              backgroundColor: roomColor.buttons.primary,
                            }}
                            onClick={async e => {
                              uploadNewSetImageFile(e);
                            }}
                          >
                            Upload
                          </button>
                        </div>
                        <div
                          id="fileUploadingNewSetImage"
                          style={{display: 'none', fontSize: '10pt'}}
                        >
                          <LoadingIcon /> uploading file
                        </div>
                      </>
                    )}
                  </div>

                  {/* existing sound records for this new sound set */}
                  {newSetInfo.sounds.map((soundInfo, index) => {
                    return (
                      <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
                        <p>Sound File #{index + 1}</p>
                        {editSoundIndex != String(index) ? (
                          <>
                            {soundInfo.length > 0 && (
                              <p className="p-2 text-gray-200 bold">
                                Caption: {soundInfo[0]}
                              </p>
                            )}
                            {soundInfo.length > 1 && (
                              <>
                                <p className="p-2 text-gray-200 bold">
                                  URL: {soundInfo[1]}
                                </p>
                                <audio
                                  controls
                                  onLoad={e =>
                                    (e.target.style.display = isNaN(
                                      e.target.duration
                                    )
                                      ? 'none'
                                      : '')
                                  }
                                >
                                  <source src={soundInfo[1]} />
                                </audio>
                              </>
                            )}
                            {soundInfo.length > 2 && (
                              <p className="p-2 text-gray-200 bold">
                                Image: {soundInfo[2]}
                              </p>
                            )}
                            {editSoundIndex.length == 0 && (
                              <button
                                className="mx-2 px-2 py-2 text-sm rounded-md"
                                style={{
                                  color: textColor,
                                  backgroundColor: roomColor.buttons.primary,
                                }}
                                onClick={async e => {
                                  startEditSound(e, index);
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="p-2 text-gray-200 bold">
                              Caption
                            </div>
                            <input
                              className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                              type="text"
                              placeholder=""
                              value={editSoundCaption ?? ''}
                              onChange={e => {
                                setEditSoundCaption(e.target.value);
                              }}
                            />
                            <div className="p-2 text-gray-200 italic">
                              {`A label for the sound file`}
                              <span className="text-gray-300"> (required)</span>
                            </div>

                            <div className="p-2 text-gray-200 bold">
                              Sound File
                            </div>
                            <div className="flex justify-between">
                              <audio
                                controls
                                onLoad={e =>
                                  (e.target.style.display = isNaN(
                                    e.target.duration
                                  )
                                    ? 'none'
                                    : '')
                                }
                              >
                                <source src={editSoundFile} />
                              </audio>
                            </div>
                            <div className="flex justify-between">
                              <input
                                className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                                type="text"
                                placeholder=""
                                value={editSoundFile ?? ''}
                                name="editSoundFile"
                                onChange={e => {
                                  setEditSoundFile(e.target.value);
                                }}
                              />
                            </div>
                            <div className="p-2 text-gray-200 italic">
                              {`URL of the sound file.`}
                              <span className="text-gray-300"> (required)</span>
                            </div>
                            {showUploadFile && (
                              <>
                                <div className="flex justify-between">
                                  <input
                                    type="file"
                                    name="uploadeditSoundFile"
                                    id="fileUploadEditSoundFile"
                                    accept="audio/*"
                                    className="w-full"
                                    style={{
                                      fontSize: '10pt',
                                      margin: '0px',
                                      marginLeft: '4px',
                                      padding: '2px',
                                    }}
                                  />
                                </div>
                                <div>
                                  <button
                                    id="buttonUploadEditSoundFile"
                                    className="px-5 text-md rounded-md"
                                    style={{
                                      color: textColor,
                                      backgroundColor:
                                        roomColor.buttons.primary,
                                    }}
                                    onClick={async e => {
                                      uploadEditSoundFile(e);
                                    }}
                                  >
                                    Upload
                                  </button>
                                </div>
                                <div
                                  id="fileUploadingEditSoundFile"
                                  style={{display: 'none', fontSize: '10pt'}}
                                >
                                  <LoadingIcon /> uploading file
                                </div>
                              </>
                            )}

                            <div className="p-2 text-gray-200 bold">Image</div>
                            <div className="flex justify-between">
                              <img
                                className="w-full h-full"
                                src={editSoundImage}
                                style={{display: 'none'}}
                                onLoad={e => (e.target.style.display = '')}
                              />
                            </div>
                            <div className="flex justify-between">
                              <input
                                className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                                type="text"
                                placeholder=""
                                value={editSoundImage ?? ''}
                                name="editSoundImage"
                                onChange={e => {
                                  setEditSoundImage(e.target.value);
                                }}
                              />
                            </div>
                            <div className="p-2 text-gray-200 italic">
                              {`URL for an image to visually represent this sound file.`}
                              <span className="text-gray-300"> (optional)</span>
                            </div>
                            {showUploadFile && (
                              <>
                                <div className="flex justify-between">
                                  <input
                                    type="file"
                                    name="uploadeditSoundImage"
                                    id="fileUploadEditSoundImage"
                                    accept="image/*"
                                    className="w-full"
                                    style={{
                                      fontSize: '10pt',
                                      margin: '0px',
                                      marginLeft: '4px',
                                      padding: '2px',
                                    }}
                                  />
                                </div>
                                <div>
                                  <button
                                    id="buttonUploadEditSoundImage"
                                    className="px-5 text-md rounded-md"
                                    style={{
                                      color: textColor,
                                      backgroundColor:
                                        roomColor.buttons.primary,
                                    }}
                                    onClick={async e => {
                                      uploadEditSoundImageFile(e);
                                    }}
                                  >
                                    Upload
                                  </button>
                                </div>
                                <div
                                  id="fileUploadingEditSoundImage"
                                  style={{display: 'none', fontSize: '10pt'}}
                                >
                                  <LoadingIcon /> uploading file
                                </div>
                              </>
                            )}

                            <button
                              className="mx-2 px-2 py-2 text-sm rounded-md"
                              style={{
                                color: textColor,
                                backgroundColor: roomColor.buttons.primary,
                              }}
                              onClick={async e => {
                                submitEditSound(e);
                              }}
                            >
                              Save Changes to Sound Effect
                            </button>

                            <button
                              className="mx-2 px-2 py-2 text-sm rounded-md"
                              style={{
                                color: textColor,
                                backgroundColor: roomColor.buttons.primary,
                              }}
                              onClick={async e => {
                                cancelEditSound(e);
                              }}
                            >
                              Cancel Editing
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                  <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
                    <p>Add Sound File #{newSetInfo.sounds.length + 1}</p>

                    <div className="p-2 text-gray-200 bold">Caption</div>
                    <input
                      className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                      type="text"
                      placeholder=""
                      value={newSoundCaption ?? ''}
                      onChange={e => {
                        setNewSoundCaption(e.target.value);
                      }}
                    />
                    <div className="p-2 text-gray-200 italic">
                      {`A label for the sound file`}
                      <span className="text-gray-300"> (required)</span>
                    </div>

                    <div className="p-2 text-gray-200 bold">Sound File</div>
                    <div className="flex justify-between">
                      <audio
                        controls
                        onLoad={e =>
                          (e.target.style.display = isNaN(e.target.duration)
                            ? 'none'
                            : '')
                        }
                      >
                        <source src={newSoundFile} />
                      </audio>
                    </div>
                    <div className="flex justify-between">
                      <input
                        className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                        type="text"
                        placeholder=""
                        value={newSoundFile ?? ''}
                        name="newSoundFile"
                        onChange={e => {
                          setNewSoundFile(e.target.value);
                        }}
                      />
                    </div>
                    <div className="p-2 text-gray-200 italic">
                      {`URL of the sound file.`}
                      <span className="text-gray-300"> (required)</span>
                    </div>
                    {showUploadFile && (
                      <>
                        <div className="flex justify-between">
                          <input
                            type="file"
                            name="uploadnewSoundFile"
                            id="fileUploadNewSoundFile"
                            accept="audio/*"
                            className="w-full"
                            style={{
                              fontSize: '10pt',
                              margin: '0px',
                              marginLeft: '4px',
                              padding: '2px',
                            }}
                          />
                        </div>
                        <div>
                          <button
                            id="buttonUploadNewSoundFile"
                            className="px-5 text-md rounded-md"
                            style={{
                              color: textColor,
                              backgroundColor: roomColor.buttons.primary,
                            }}
                            onClick={async e => {
                              uploadNewSoundFile(e);
                            }}
                          >
                            Upload
                          </button>
                        </div>
                        <div
                          id="fileUploadingNewSoundFile"
                          style={{display: 'none', fontSize: '10pt'}}
                        >
                          <LoadingIcon /> uploading file
                        </div>
                      </>
                    )}

                    <div className="p-2 text-gray-200 bold">Image</div>
                    <div className="flex justify-between">
                      <img
                        className="w-full h-full"
                        src={newSoundImage}
                        style={{display: 'none'}}
                        onLoad={e => (e.target.style.display = '')}
                      />
                    </div>
                    <div className="flex justify-between">
                      <input
                        className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                        type="text"
                        placeholder=""
                        value={newSoundImage ?? ''}
                        name="newSoundImage"
                        onChange={e => {
                          setNewSoundImage(e.target.value);
                        }}
                      />
                    </div>
                    <div className="p-2 text-gray-200 italic">
                      {`URL for an image to visually represent this sound file.`}
                      <span className="text-gray-300"> (optional)</span>
                    </div>
                    {showUploadFile && (
                      <>
                        <div className="flex justify-between">
                          <input
                            type="file"
                            name="uploadnewSoundImage"
                            id="fileUploadNewSoundImage"
                            accept="image/*"
                            className="w-full"
                            style={{
                              fontSize: '10pt',
                              margin: '0px',
                              marginLeft: '4px',
                              padding: '2px',
                            }}
                          />
                        </div>
                        <div>
                          <button
                            id="buttonUploadNewSoundImage"
                            className="px-5 text-md rounded-md"
                            style={{
                              color: textColor,
                              backgroundColor: roomColor.buttons.primary,
                            }}
                            onClick={async e => {
                              uploadNewSoundImageFile(e);
                            }}
                          >
                            Upload
                          </button>
                        </div>
                        <div
                          id="fileUploadingNewSoundImage"
                          style={{display: 'none', fontSize: '10pt'}}
                        >
                          <LoadingIcon /> uploading file
                        </div>
                      </>
                    )}

                    <button
                      className="mx-2 px-2 py-2 text-sm rounded-md"
                      style={{
                        color: textColor,
                        backgroundColor: roomColor.buttons.primary,
                      }}
                      onClick={async e => {
                        submitNewSound(e);
                      }}
                    >
                      Add Sound to Sound Effect Set
                    </button>
                  </div>
                </form>

                <button
                  className="mx-2 px-2 py-2 text-sm rounded-md"
                  style={{
                    color: textColor,
                    backgroundColor: roomColor.buttons.primary,
                  }}
                  onClick={async e => {
                    submitNewSet(e);
                  }}
                >
                  Save Sound Set
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
