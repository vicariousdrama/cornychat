import React, {useState} from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';

export function Links({
  roomLinks,
  setRoomLinks,
  textColor,
  roomColor,
}) {
  let mqp = useMqParser();

  let [linkURI, setLinkURI] = useState('');
  let [linkText, setLinkText] = useState('');

  function RoomLinks() {
    if (roomLinks.length === 0) {
      return (
        <div>
          <p className="text-sm text-gray-500 p-2">
            There are no links set up.
          </p>
        </div>
      );
    }

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

    return (
      <>
        {roomLinks.map((link, index) => {
          let linkText = link[1];
          let linkDescription = link[0];

          return (
            <div className="flex w-full justify-between my-3">
              <div style={{width: '400px'}}>
                {' '}
                <p className="text-sm text-black" style={{overflowWrap: 'break-word'}}>{linkDescription}</p>
                <p className="text-xs text-gray-500" style={{overflowWrap: 'anywhere'}}>{linkText}</p>
              </div>
              <div className="flex w-full justify-end" style={{width: '100px'}}>
                <div onClick={() => promoteLink(index)} className="cursor-pointer">
                  ⬆️
                </div>
                <div onClick={() => demoteLink(index)} className="cursor-pointer">
                  ⬇️
                </div>
                <div onClick={() => removeLink(index)} className="cursor-pointer">
                  🗑️
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div>
      <p className="text-lg font-medium text-gray-500 px-2">
        Manage Links
      </p>

      <div className="mb-2">
        <p className="text-sm font-medium text-gray-500 p-2">
          Add a link to the top of the list:
        </p>
        <div className="flex">
          <input
            className={mqp(
              'rounded placeholder-gray-400 bg-gray-50 w-full mx-1 md:w-full'
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
          <input
            className={mqp(
              'rounded placeholder-gray-400 bg-gray-50 w-full mx-1 md:w-full'
            )}
            type="text"
            placeholder="http://google.com"
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
          <button
            className="px-5 h-12 text-sm"
            style={{
              color: textColor,
              backgroundColor: roomColor.buttons.primary,
            }}
            onClick={() => {
              setRoomLinks([[linkText, linkURI], ...roomLinks]);
              setLinkURI('');
              setLinkText('');
            }}
          >
            Add link
          </button>
        </div>
        <div className="bg-gray-200 py-2 px-0 my-5 rounded-lg">
          <RoomLinks />
        </div>
      </div>

    </div>
  );
}
