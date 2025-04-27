import React, {useState, useEffect} from 'react';
import {Modal} from '../Modal.jsx';
import {use} from 'use-minimal-state';
import {useJam} from '../../jam-core-react.js';
import {isDark, colors} from '../../lib/theme.js';
import {useMqParser} from '../../lib/tailwind-mqp.js';
import {LoadingIcon, Trash} from '../Svg.jsx';
import {
  getPublicKey,
  loadList,
  publishEvent,
  sortByTag,
} from '../../nostr/nostr.js';
import {nip19} from 'nostr-tools';

export default function EditNostrLists({close}) {
  let mqp = useMqParser();
  const [showErrorMsg, setErrorMsg] = useState(false);
  const [state, {updateInfo}] = useJam();
  const colorTheme = state.room?.color ?? 'default';
  const roomColor = colors(colorTheme, state.room.customColor);
  const textColor = isDark(roomColor.avatarBg)
    ? roomColor.text.light
    : roomColor.text.dark;

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  let pubkey = sessionStorage.getItem('pubkey');
  let listtime = sessionStorage.getItem(`${pubkey}.kind30000timestamp`);
  if (!listtime) listtime = 0;
  let lists = sessionStorage.getItem(`${pubkey}.kind30000events`);
  let listDTags = sessionStorage.getItem(`${pubkey}.kind30000dtags`);
  if (lists) {
    lists = JSON.parse(lists);
    listDTags = JSON.parse(listDTags);
    sortByTag(lists, 'title');
  } else {
    lists = [];
    listDTags = [];
  }
  let [newListExpanded, setNewListExpanded] = useState(false);
  let [editListExpanded, setEditListExpanded] = useState(false);
  const [dTag, setDTag] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedListDTag, setSelectedListDTag] = useState('');
  const [selectedListTitle, setSelectedListTitle] = useState('');
  const [selectedListDescription, setSelectedListDescription] = useState('');
  const [selectedListPTags, setSelectedListPTags] = useState([]);
  const [selectedListOtherTags, setSelectedListOtherTags] = useState([]);
  const [selectedListUserPubkey, setSelectedListUserPubkey] = useState('');

  useEffect(() => {
    if (listtime < Date.now() - 5 * 60 * 1000 && !loading) {
      setLoading(true);
      const loadLists = async () => {
        let pubkey = await getPublicKey();
        lists = await loadList(30000, pubkey);
        sessionStorage.setItem(
          `${pubkey}.kind30000events`,
          JSON.stringify(lists)
        );
        listDTags = [];
        for (let ev of lists) {
          for (let t of ev.tags) {
            if (t.length < 2) continue;
            if (t[0] == 'd') {
              if (t[1].length > 0) listDTags.push(t[1]);
              break;
            }
          }
        }
        sessionStorage.setItem(
          `${pubkey}.kind30000dtags`,
          JSON.stringify(listDTags)
        );
        sessionStorage.setItem(`${pubkey}.kind30000timestamp`, Date.now());
      };
      loadLists();
      setLoading(false);
    }
    // This function is called when component unmounts
    return () => {};
  }, []);

  let submit = async e => {
    e.preventDefault();
  };

  let addList = async e => {
    e.preventDefault();

    // verify dtag is not empty
    if (dTag.length == 0) {
      alert('A value for DTag is required to create a list');
      return;
    }

    // verify dtag is not already in use
    let dTagInUse = false;
    let dTagFoundTitle = '';
    for (let ev of lists) {
      for (let t of ev.tags) {
        if (t.length < 2) continue;
        if (t[0] == 'd') {
          if (t[1] == dTag) {
            dTagInUse = true;
          }
          continue;
        }
        if (t[0] == 'title') {
          dTagFoundTitle = t[1];
        }
      }
      if (dTagInUse) break;
    }
    if (dTagInUse) {
      alert(`A list named ${dTagFoundTitle} already exists using this DTag.`);
      return;
    }

    // make new list without any members
    let listevent = {
      id: null,
      pubkey: pubkey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 30000,
      tags: [['d', dTag]],
      content: '',
      sig: null,
    };
    if (title.length != 0) {
      listevent.tags.push(['title', title]);
    }
    if (description.length != 0) {
      listevent.tags.push(['description', description]);
    }
    if (window.nostr) {
      const listEventSigned = await window.nostr.signEvent(listevent);
      // publish
      let r = await publishEvent(listEventSigned);
      if (r[0]) {
        // add to lists
        lists.push(listEventSigned);
        sessionStorage.setItem(
          `${pubkey}.kind30000events`,
          JSON.stringify(lists)
        );
        // add dtag to lists
        listDTags.push(dTag);
        sessionStorage.setItem(
          `${pubkey}.kind30000dtags`,
          JSON.stringify(listDTags)
        );
        // set timestamp
        sessionStorage.setItem(`${pubkey}.kind30000timestamp`, Date.now());
      } else {
        alert(r[1]);
        return;
      }
    }

    // reset
    setDTag('');
    setDescription('');
    setTitle('');
  };

  let setSelectedList = async e => {
    setSelectedListDTag(e);
    setSelectedListDescription('');
    setSelectedListTitle('');
    setSelectedListPTags([]);
    setSelectedListOtherTags([]);
    if (e.length == 0) {
      return;
    }
    let found = false;
    let pTags = [];
    let otherTags = [];

    for (let ev of lists) {
      for (let t of ev.tags) {
        if (t.length < 2) continue;
        if (t[0] == 'd' && t[1] == e) {
          found = true;
          break;
        }
      }
      if (found) {
        for (let t of ev.tags) {
          if (t.length < 2) continue;
          let k = t[0];
          let v = t[1];
          if (k == 'd') setSelectedListDTag(v);
          else if (k == 'title') setSelectedListTitle(v);
          else if (k == 'description') setSelectedListDescription(v);
          else if (k == 'p') pTags.push(t);
          else otherTags.push(t);
        }
        setSelectedListPTags(pTags);
        setSelectedListOtherTags(otherTags);
        break;
      }
    }
  };

  let addUserToSelectedList = async e => {
    let ptagPubkeyToAdd = '';
    const pubkeyRegex = /^([A-Fa-f0-9]{64})$/gi;
    // begin with npub and length 63
    if (
      selectedListUserPubkey.length == 63 &&
      selectedListUserPubkey.startsWith('npub1')
    ) {
      try {
        ptagPubkeyToAdd = nip19.decode(selectedListUserPubkey).data;
      } catch (err1) {
        alert('The npub provided is not valid');
        return;
      }
    } else if (
      selectedListUserPubkey.length == 64 &&
      pubkeyRegex.test(selectedListUserPubkey)
    ) {
      ptagPubkeyToAdd = selectedListUserPubkey;
    } else {
      alert('User value must be an npub or hexadecimal pubkey');
      return;
    }

    // add resulting value as a p tag to selectListPTags
    let found = false;
    for (let ptag of selectedListPTags) {
      if (ptag.length < 2) continue;
      if (ptag[1] == ptagPubkeyToAdd) {
        found = true;
        break;
      }
    }
    if (!found) {
      let newPTags = selectedListPTags;
      newPTags.push(['p', ptagPubkeyToAdd]);
      setSelectedListPTags(newPTags);
    }

    // clear input field
    setSelectedListUserPubkey('');
  };

  function removeUserFromSelectedList(ptagDeleting) {
    let newPTags = [];
    let ptagPubkeyToRemove = ptagDeleting[1];
    for (let ptag of selectedListPTags) {
      if (ptag.length < 2) continue;
      if (ptag[1] == ptagPubkeyToRemove) continue;
      newPTags.push(ptag);
    }
    setSelectedListPTags(newPTags);
  }

  let saveList = async e => {
    e.preventDefault();

    // prep list
    let listevent = {
      id: null,
      pubkey: pubkey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 30000,
      tags: [
        ['d', selectedListDTag],
        ['title', selectedListTitle],
        ['description', selectedListDescription],
      ],
      content: '',
      sig: null,
    };
    // p tags
    for (let ptag of selectedListPTags) {
      listevent.tags.push(ptag);
    }
    // other tags
    for (let othertag of selectedListOtherTags) {
      listevent.tags.push(othertag);
    }

    if (window.nostr) {
      const listEventSigned = await window.nostr.signEvent(listevent);
      // publish
      let r = await publishEvent(listEventSigned);
      if (r[0]) {
        // rebuild lists
        let newlists = [];
        for (let ev of lists) {
          let dTagFound = false;
          for (let t of ev.tags) {
            if (t.length < 2) continue;
            if (t[0] == 'd') {
              if (t[1] == selectedListDTag) {
                dTagFound = true;
                break;
              }
              continue;
            }
          }
          if (!dTagFound) newlists.push(ev);
        }
        lists = newlists;
        // add to lists
        lists.push(listEventSigned);
        sessionStorage.setItem(
          `${pubkey}.kind30000events`,
          JSON.stringify(lists)
        );
        // set timestamp
        sessionStorage.setItem(`${pubkey}.kind30000timestamp`, Date.now());
        alert('Changes to the list have been saved and published');
      } else {
        alert(r[1]);
        return;
      }
    }
  };

  return (
    <Modal close={close}>
      <h1 className="text-gray-200">Edit Lists</h1>
      <p>
        You can create a new list, view list members and other tags, and delete
        lists you own using this feature.
      </p>
      <form onSubmit={submit}>
        {showErrorMsg ? <p className="text-red-500">{showErrorMsg}</p> : null}
        <p
          className="text-lg font-medium text-gray-200 cursor-pointer"
          onClick={() => setNewListExpanded(!newListExpanded)}
        >
          {newListExpanded ? '🔽' : '▶️'} Create New List
        </p>
        <div className={newListExpanded ? '' : 'hidden'}>
          <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
            <div className="p-2 text-gray-200 bold">
              DTag -{' '}
              <i>A programatic identifier for the list and must be unique.</i>
            </div>
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
              type="text"
              placeholder="unique list identifier"
              value={dTag ?? ''}
              name="dtag"
              onChange={e => {
                setDTag(e.target.value);
              }}
            />
            <div className="p-2 text-gray-200 bold">
              Title -{' '}
              <i>
                A brief name or caption for the list that some applications show
                in place of the d tag. Multiple lists can have the same name or
                title.
              </i>
            </div>
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
              type="text"
              placeholder="brief caption for the list"
              value={title ?? ''}
              name="title"
              onChange={e => {
                setTitle(e.target.value);
              }}
            />
            <div className="p-2 text-gray-200 bold">
              Description -{' '}
              <i>
                An optional abstract of the purpose of the list can provide you
                greater context in the future.
              </i>
            </div>
            <textarea
              className={mqp(
                'rounded-lg placeholder-gray-500 bg-gray-300 text-black border-4 pb-2 rounded-lg w-full md:w-96'
              )}
              placeholder="list description"
              value={description}
              name="description"
              autoComplete="off"
              rows="4"
              style={{
                fontSize: '15px',
              }}
              onChange={e => {
                setDescription(e.target.value);
              }}
            ></textarea>
            <button
              onClick={addList}
              className="flex-grow mt-5 h-12 px-6 text-md rounded-lg"
              style={{
                color: isDark(roomColor.buttons.primary)
                  ? roomColor.text.light
                  : roomColor.text.dark,
                backgroundColor: roomColor.buttons.primary,
              }}
            >
              {isSaving ? <LoadingIcon /> : 'Add List'}
            </button>
          </div>
        </div>

        {lists.length > 0 && (
          <>
            <p
              className="text-lg font-medium text-gray-200 cursor-pointer"
              onClick={() => setEditListExpanded(!editListExpanded)}
            >
              {editListExpanded ? '🔽' : '▶️'} View / Edit Lists
            </p>
            <div className={editListExpanded ? '' : 'hidden'}>
              <div className="p-4 py-2 bg-gray-700 rounded-lg my-3">
                <div className="p-2 text-gray-200 bold">List to Modify</div>
                <select
                  name="listEntries"
                  defaultValue={selectedListDTag}
                  onChange={e => {
                    setSelectedList(e.target.value);
                    setSelectedListDTag(e.target.value);
                  }}
                  className={
                    'border mt-3 ml-2 p-2 bg-gray-300 text-black rounded w-full'
                  }
                >
                  <option value="">Select a list to view its details</option>
                  {lists.map((listitem, i) => {
                    let itemD = '';
                    let itemTitle = '';
                    if (!listitem.hasOwnProperty('tags')) {
                      return <></>;
                    }
                    for (let t of listitem.tags) {
                      if (t.length < 2) continue;
                      if (t[0] == 'd') itemD = t[1];
                      if (t[0] == 'title') itemTitle = t[1];
                    }
                    let itemKey = itemD;
                    let itemText = itemTitle;
                    if (itemText.length == 0) itemText = itemKey;
                    return (
                      <option key={itemKey} value={itemKey}>
                        {itemText}
                      </option>
                    );
                  })}
                </select>
                {selectedListDTag.length > 0 && (
                  <>
                    <div className="p-2 text-gray-200 bold">
                      Title -{' '}
                      <i>
                        A brief name or caption for the list that some
                        applications show in place of the d tag. Multiple lists
                        can have the same name or title.
                      </i>
                    </div>
                    <input
                      className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                      type="text"
                      placeholder="brief caption for the list"
                      value={selectedListTitle ?? ''}
                      name="selectedListTitle"
                      onChange={e => {
                        setSelectedListTitle(e.target.value);
                      }}
                    />
                    <div className="p-2 text-gray-200 bold">
                      Description -{' '}
                      <i>
                        An optional abstract of the purpose of the list can
                        provide you greater context in the future.
                      </i>
                    </div>
                    <textarea
                      className={mqp(
                        'rounded-lg placeholder-gray-500 bg-gray-300 text-black border-4 pb-2 rounded-lg w-full md:w-96'
                      )}
                      placeholder="list description"
                      value={selectedListDescription}
                      name="selectedListDescription"
                      autoComplete="off"
                      rows="4"
                      style={{
                        fontSize: '15px',
                      }}
                      onChange={e => {
                        setSelectedListDescription(e.target.value);
                      }}
                    ></textarea>
                    <div className="p-2 text-gray-200 bold">
                      Add a nostr user to this list -{' '}
                      <i>Specify npub or hexadecimal pubkey</i>
                    </div>
                    <div classname="flex">
                      <input
                        className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
                        type="text"
                        placeholder="npub or pubkey"
                        value={selectedListUserPubkey ?? ''}
                        name="selectedListUserPubkey"
                        onChange={e => {
                          setSelectedListUserPubkey(e.target.value);
                        }}
                      />
                      <button
                        className="px-5 text-sm rounded-md"
                        style={{
                          color: textColor,
                          backgroundColor: roomColor.buttons.primary,
                        }}
                        onClick={e => addUserToSelectedList(e)}
                      >
                        Add user
                      </button>
                    </div>

                    {selectedListPTags.length === 0 && (
                      <div>
                        <p className="text-sm text-gray-500 p-2">
                          There are currently no users in the list
                        </p>
                      </div>
                    )}
                    {selectedListPTags.length > 0 && (
                      <div style={{overflowY: 'scroll', height: '240px'}}>
                        {selectedListPTags.map((ptag, index) => {
                          let ptagKey = `ptagkey_${index}`;
                          if (ptag.length < 2) {
                            return <></>;
                          }
                          const ptagPubkey = ptag[1];
                          const ptagNpub = nip19.npubEncode(ptagPubkey);
                          return (
                            <div
                              key={ptagKey}
                              className="flex w-full justify-between my-3"
                            >
                              <div className="flex-grow">
                                {' '}
                                <p
                                  className="text-sm text-black"
                                  style={{overflowWrap: 'break-all'}}
                                >
                                  {ptagNpub}
                                </p>
                              </div>
                              <div
                                className="flex-none cursor-pointer rounded-lg px-2 py-2 hover:bg-red-500 hover:border-red"
                                onClick={() => removeUserFromSelectedList(ptag)}
                              >
                                <Trash />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <button
                      onClick={saveList}
                      className="flex-grow mt-5 h-12 px-6 text-md rounded-lg"
                      style={{
                        color: isDark(roomColor.buttons.primary)
                          ? roomColor.text.light
                          : roomColor.text.dark,
                        backgroundColor: roomColor.buttons.primary,
                      }}
                    >
                      {isSaving ? <LoadingIcon /> : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
