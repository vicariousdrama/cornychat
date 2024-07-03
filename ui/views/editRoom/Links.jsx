import React, {useState} from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';
import {ExportLinksModal} from './ExportLinks';
import {ImportLinksModal} from './ImportLinks';
import {openModal} from '../Modal';
import {Trash} from '../Svg';

export function Links({
  iOwn,
  roomId,
  roomLinks,
  setRoomLinks,
  textColor,
  roomColor,
}) {
  let mqp = useMqParser();
  let [expanded, setExpanded] = useState(false);
  let [linkURI, setLinkURI] = useState('');
  let [linkText, setLinkText] = useState('');
  let [editingLinkIndex, setEditingLinkIndex] = useState(-1);
  let [editingLinkURI, setEditingLinkURI] = useState('');
  let [editingLinkText, setEditingLinkText] = useState('');
  let [linkInsertionStyle, setLinkInsertionStyle] = useState('top');

  function removeLink(indexLink) {
    let result = confirm('Are you sure you want to remove this link?');
    if (result != true) {
      return;
    }
    let newRoomLinks = roomLinks.filter((link, index) =>
      index !== indexLink ? link : null
    );
    setRoomLinks(newRoomLinks);
  }
  function swapLinks(indexLink, indexLink2) {
    let newRoomLinks = roomLinks;
    let swapLink = newRoomLinks[indexLink];
    newRoomLinks[indexLink] = newRoomLinks[indexLink2];
    newRoomLinks[indexLink2] = swapLink;
    setRoomLinks([...newRoomLinks]);
  }
  function promoteLink(indexLink) {
    let indexLink2 = indexLink - 1;
    if (indexLink2 >= 0) {
      swapLinks(indexLink, indexLink2);
    }
  }
  function demoteLink(indexLink) {
    let indexLink2 = indexLink + 1;
    if (indexLink2 < roomLinks.length) {
      swapLinks(indexLink, indexLink2);
    }
  }
  function editLink(indexLink) {
    editingLinkIndex = indexLink
    editingLinkText = roomLinks[indexLink][0];
    editingLinkURI = roomLinks[indexLink][1];
    setEditingLinkIndex(editingLinkIndex);
    setEditingLinkText(editingLinkText);
    setEditingLinkURI(editingLinkURI);
  }
  function saveLink(indexLink) {
    roomLinks[indexLink] = [editingLinkText, editingLinkURI];
    setRoomLinks(roomLinks);
    editingLinkIndex = -1;
    setEditingLinkIndex(editingLinkIndex);
  }
  function cancelLink() {
    editingLinkIndex = -1;
    setEditingLinkIndex(editingLinkIndex);
    setRoomLinks(roomLinks);
  }

  let linkNumber = 0;
  return (
    <div>
      <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpanded(!expanded)}>
      {expanded ? '🔽' : '▶️'} Manage Links
      </p>
      <div className={expanded ? '' : 'hidden'}>
      <div className="mb-2">
        <div className="flex justify-between">
          <button
            className="px-5 text-sm rounded-md"
            style={{
              color: (roomLinks.length > 0) ? textColor : `rgba(244,244,244,1)`,
              backgroundColor: (roomLinks.length > 0) ? roomColor.buttons.primary : `rgba(192,192,192,1)`,
            }}
            onClick={() => {
              if (roomLinks.length == 0) return;
              let result = confirm('Are you sure you want to clear all links?');
              if (result != true) return;
              setRoomLinks([]);
            }}
          >
            Clear all links
          </button>
          {window.nostr ? (
          <>
          <button
            className="px-5 text-sm rounded-md"
            style={{
              color: textColor,
              backgroundColor: roomColor.buttons.primary,
            }}
            onClick={() => {
              openModal(ImportLinksModal, {textColor: textColor, roomColor: roomColor, roomLinks: roomLinks, setRoomLinks: setRoomLinks});
              return;
            }}
          >
            Import Links
          </button>
          <button
            className="px-5 text-sm rounded-md"
            style={{
              color: (roomLinks.length > 0) ? textColor : `rgba(244,244,244,1)`,
              backgroundColor: (roomLinks.length > 0) ? roomColor.buttons.primary : `rgba(192,192,192,1)`,
            }}
            onClick={() => {
              if (roomLinks.length > 0) {
                close();
                openModal(ExportLinksModal, {roomId: roomId, textColor: textColor, roomColor: roomColor, roomLinks: roomLinks});
              }
              return;
            }}
          >
            Export Links
          </button>
          </>
          ) : (
          <div className="mx-2 text-sm rounded-md border-2 border-gray-300 w-full text-center text-gray-200">
            Use a nostr extension for import/export capability
          </div>
          )}
        </div>
        {(editingLinkIndex == -1) && (
          <>
        <p className="text-sm font-medium text-gray-300 p-2">
          Add a link to the <select
            name="linkInsertionStyle"
            defaultValue={linkInsertionStyle}
            onChange={e => {
              setLinkInsertionStyle(e.target.value);
            }}
            className={'border mt-3 ml-2 p-2 text-black rounded'}
          >
            <option key="lis_top" value="top">top</option>
            <option key="lis_end" value="end">end</option>
          </select> of the list:
        </p>
        <div className="flex">
          <input
            className={mqp(
              'rounded placeholder-black bg-gray-400 text-black w-full mx-1 md:w-full'
            )}
            type="text"
            placeholder="Visit my website"
            value={linkText}
            autoComplete="off"
            style={{
              borderWidth: '0px',
              fontSize: '15px',
            }}
            onChange={e => {
              setLinkText(e.target.value);
            }}
          ></input>
        </div>
        <div className="flex">
          <input
            className={mqp(
              'rounded placeholder-black bg-gray-400 text-black w-full mx-1 md:w-full'
            )}
            type="text"
            placeholder={jamConfig.urls.jam}
            value={linkURI}
            autoComplete="off"
            style={{
              borderWidth: '0px',
              fontSize: '15px',
            }}
            onChange={e => {
              setLinkURI(e.target.value);
            }}
          ></input>
        </div>
        <div className="flex">
          <button
            className="px-5 text-sm rounded-md"
            style={{
              color: textColor,
              backgroundColor: roomColor.buttons.primary,
            }}
            onClick={() => {
              if (linkInsertionStyle == 'top') {
                setRoomLinks([[linkText, linkURI], ...roomLinks]);
              } else {
                setRoomLinks([...roomLinks, [linkText, linkURI]]);
              }
              setLinkURI('');
              setLinkText('');
            }}
          >
            Add link
          </button>
        </div>
        </>
        )}
        <div className="bg-gray-200 text-gray-300 py-2 px-0 my-5 rounded-lg">
          {(roomLinks.length == 0) ? (
          <div>
            <p className="text-sm text-gray-300 p-2">
              There are no links set up.
            </p>
          </div>
          ) : (
          <>
            {roomLinks.map((link, index) => {
              let roomlinkskey = `roomlinkskey_${index}`;
              let renderURI = link[1];
              let renderText = link[0];
              linkNumber += 1;
              return (
                <div key={roomlinkskey} className="flex w-full justify-between my-3" style={{borderBottom: '1px solid rgb(55,65,81)'}}>
                  <div style={{width: '400px'}}>
                    {(editingLinkIndex != index) && (
                    <>
                    <p className="text-sm text-black" style={{overflowWrap: 'break-word'}}>{renderText}</p>
                    <p className="text-xs text-gray-600" style={{overflowWrap: 'anywhere'}}>{renderURI}</p>
                    </>
                    )}
                    {(editingLinkIndex == index) && (
                    <>
                    <input
                      key="inputEditingLinkText"
                      className={mqp(
                        'rounded placeholder-black bg-gray-400 text-black w-full m-4 md:w-full'
                      )}
                      type="text"
                      placeholder="Visit my website"
                      value={editingLinkText}
                      autoComplete="off"
                      style={{
                        borderWidth: '0px',
                        fontSize: '15px',
                      }}
                      onChange={e => {
                        setEditingLinkText(e.target.value);
                      }}
                    ></input>
                    <input
                      key="inputEditingLinkURI"
                      className={mqp(
                        'rounded placeholder-black bg-gray-400 text-black w-full m-4 md:w-full'
                      )}
                      type="text"
                      placeholder={jamConfig.urls.jam}
                      value={editingLinkURI}
                      autoComplete="off"
                      style={{
                        borderWidth: '0px',
                        fontSize: '15px',
                      }}
                      onChange={e => {
                        setEditingLinkURI(e.target.value);
                      }}
                    ></input>                
                    </>
                    )}
                  </div>
                  <div className="flex w-full justify-end" style={{width: '100px',position: 'relative'}}>
                  <table><tbody><tr><td>
                    {(editingLinkIndex == -1) && (
                    <>
                    <div onClick={() => editLink(index)} className="cursor-pointer text-xl m-2">
                      📝
                    </div>
                    <div onClick={() => promoteLink(index)} className="cursor-pointer text-xl m-2">
                      ⬆️
                    </div>
                    <div onClick={() => demoteLink(index)} className="cursor-pointer text-xl m-2">
                      ⬇️
                    </div>
                    <div onClick={() => removeLink(index)} className="cursor-pointer text-xl m-2">
                      <Trash />
                    </div>
                    </>
                    )}
                    {(editingLinkIndex == index) && (
                    <>
                    <div onClick={() => saveLink(index)} className="cursor-pointer text-xl m-2">
                      💾
                    </div>
                    <div onClick={() => cancelLink()} className="cursor-pointer text-xl m-2">
                      ❌
                    </div>
                    </>
                    )}
                    </td></tr><tr><td>
                    <div className="text-gray-700" style={{marginTop: '32px'}}>link {linkNumber}</div>
                    </td></tr></tbody></table>                    
                  </div>
                </div>
              );
            })}
          </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
