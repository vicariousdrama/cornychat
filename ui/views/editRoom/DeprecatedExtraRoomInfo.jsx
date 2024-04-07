import React, {useState} from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';
import {Trash, Up, Down} from '../Svg';
import EmojiPicker from 'emoji-picker-react';
import reactionEmojis from '../../emojis';

export function DeprecatedExtraRoomInfo({
  roomLinks,
  setRoomLinks,
  roomSlides,
  setRoomSlides,
  textColor,
  roomColor,
  customEmojis,
  setCustomEmojis,
  closed,
  setClosed,
  isPrivate,
  setIsPrivate,
  isRecordingAllowed,
  setIsRecordingAllowed,
  stageOnly,
  setStageOnly,
}) {
  let mqp = useMqParser();

  let [linkURI, setLinkURI] = useState('');
  let [linkText, setLinkText] = useState('');
  let [slideURI, setSlideURI] = useState('');
  let [slideText, setSlideText] = useState('');

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

  function RoomSlides() {
    let activeSlide = -1;
    if (roomSlides.length === 0) {
      return (
        <div>
          <p className="text-sm text-gray-500 p-2">
            There are no slides set up.
          </p>
        </div>
      );
    }
    function removeSlide(indexSlide) {
      let result = confirm('Are you sure you want to remove this slide?');
      if (result != true) {
        return;
      }
      let newRoomSlides = roomSlides.filter((slide, index) =>
        index != indexSlide ? slide : null
      );
      setRoomSlides(newRoomSlides);
    }
    function swapSlides(indexSlide, indexSlide2) {
      let newRoomSlides = roomSlides;
      let swapSlide = newRoomSlides[indexSlide];
      newRoomSlides[indexSlide] = newRoomSlides[indexSlide2];
      newRoomSlides[indexSlide2] = swapSlide;
      setRoomSlides([...newRoomSlides]);
    }
    function promoteSlide(indexSlide) {
      let indexSlide2 = indexSlide - 1;
      if (indexSlide2 >= 0) {
        swapSlides(indexSlide, indexSlide2);
      }
    }
    function demoteSlide(indexSlide) {
      let indexSlide2 = indexSlide + 1;
      if (indexSlide2 < roomSlides.length) {
        swapSlides(indexSlide, indexSlide2);
      }
    }
    return (
      <>
        {roomSlides.map((slide, index) => {
          let slideURI = slide[0];
          let slideText = slide[1];
          return (
            <div className="flex w-full justify-between my-3">
              <div style={{width: '400px'}}>
                {' '}
                <img
                  className="h-48"
                  alt={slideText}
                  src={slideURI}
                />
                <p className="text-xs text-gray-500" style={{overflowWrap: 'anywhere'}}>{slideText}</p>
              </div>
              <div className="flex w-full justify-end" style={{width: '100px'}}>
                <div onClick={() => promoteSlide(index)} className="cursor-pointer">
                  ⬆️
                </div>
                <div onClick={() => demoteSlide(index)} className="cursor-pointer">
                  ⬇️
                </div>
                <div onClick={() => removeSlide(index)} className="cursor-pointer">
                  🗑️
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  function removeEmoji(emojiIndex) {
    const newEmojis = customEmojis.filter(
      (emoji, index) => index !== emojiIndex
    );
    setCustomEmojis(newEmojis);
  }

  function addEmoji(emoji) {
    if (customEmojis.includes(emoji)) return;
    setCustomEmojis(prevArray => [...prevArray, emoji]);
  }

  function resetEmojis() {
    setCustomEmojis(reactionEmojis);
  }

  return (
    <div>
      <p className="text-lg font-medium text-gray-500 px-2">
        Extra Room Info
      </p>

      <div className="mb-2">
        <p className="text-sm font-medium text-gray-500 p-2">
          Add your custom links:
        </p>
        <div className="flex">
          <input
            className={mqp(
              'rounded placeholder-black bg-gray-50 w-full mx-1 md:w-full'
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
              'rounded placeholder-black bg-gray-50 w-full mx-1 md:w-full'
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
          <button
            className="px-5 h-12 text-sm"
            style={{
              color: textColor,
              backgroundColor: roomColor.buttons.primary,
            }}
            onClick={() => {
              setRoomLinks([[buttonText, buttonURI], ...roomLinks]);
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

      <div className="mb-2">
        <p className="text-sm font-medium text-gray-500 p-2">
          Add your custom slides:
        </p>
        <div className="flex">
          <input
            className={mqp(
              'rounded placeholder-black bg-gray-50 w-full mx-1 md:w-full'
            )}
            type="text"
            placeholder="Caption for this image"
            value={slideText}
            autoComplete="off"
            style={{
              borderWidth: '0px',
              fontSize: '15px',
            }}
            onChange={e => {
              setSlideText(e.target.value);
            }}
          ></input>
          <input
            className={mqp(
              'rounded placeholder-black bg-gray-50 w-full mx-1 md:w-full'
            )}
            type="text"
            placeholder="Image URI for this slide"
            value={slideURI}
            autoComplete="off"
            style={{
              borderWidth: '0px',
              fontSize: '15px',
            }}
            onChange={e => {
              setSlideURI(e.target.value);
            }}
          ></input>
          <button
            className="px-5 h-12 text-sm"
            style={{
              color: textColor,
              backgroundColor: roomColor.buttons.primary,
            }}
            onClick={() => {
              setRoomSlides([[slideURI, slideText], ...roomSlides]);
              setSlideURI('');
              setSlideText('');
            }}
          >
            Add slide
          </button>
        </div>
        <div className="bg-gray-200 py-2 px-0 my-5 rounded-lg">
          <RoomSlides />
        </div>
      </div>

      <div className="my-5">
        <p className="text-sm font-medium text-gray-500 p-2">
          Add your custom emoji reactions:
        </p>
        <EmojiPicker
          width={'width:max-content'}
          onEmojiClick={emoji => addEmoji(emoji.emoji)}
          previewConfig={{showPreview: false}}
          autoFocusSearch={false}
        />
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-500 p-2">
            Your current emoji reactions:
          </p>
          <div className="flex flex-wrap cursor-pointer">
            {customEmojis?.map((emoji, index) => {
              return (
                <div
                  className="p-2 m-2 bg-gray-200 rounded-lg hover:bg-red-500"
                  onClick={() => removeEmoji(index)}
                >
                  <p>{emoji}</p>
                </div>
              );
            })}
          </div>

          <button
            className="text-sm font-medium underline text-gray-500 p-2"
            onClick={() => resetEmojis()}
          >
            Reset to default emojis
          </button>
        </div>
      </div>

      <div className="mt-2">
        <input
          className="ml-2"
          type="checkbox"
          name="jam-room-closed"
          id="jam-room-closed"
          onChange={() => {
            setClosed(!closed);
          }}
          defaultChecked={closed}
        />
        <label
          className="pl-3 ml-0.5 text-sm font-medium text-gray-500 p-2"
          htmlFor="jam-room-closed"
        >
          Close the room
          <div className="p-2 pl-9 text-gray-400 text-sm">
            Closed rooms can only be joined by administrators, owners and moderators.
            Everyone else sees the description and the&nbsp;
            {`'call to action'`} button.
          </div>
        </label>
      </div>

      <div className="mt-2">
        <input
          className="ml-2"
          type="checkbox"
          name="jam-room-isprivate"
          id="jam-room-isprivate"
          onChange={() => {
            setIsPrivate(!isPrivate);
          }}
          defaultChecked={isPrivate}
        />
        <label
          className="pl-3 ml-0.5 text-sm font-medium text-gray-500 p-2"
          htmlFor="jam-room-isprivate"
        >
          Make room private
          <div className="p-2 pl-9 text-gray-400 text-sm">
            Private rooms are not displayed on the landing page, nor announced by the Corny Chat bot.
            Anyone can join a private room by navigating to the room url.
          </div>
        </label>
      </div>

      <div className="mt-2">
        <input
          className="ml-2"
          type="checkbox"
          name="jam-room-isrecordingallowed"
          id="jam-room-isrecordingallowed"
          onChange={() => {
            setIsRecordingAllowed(!isRecordingAllowed);
          }}
          defaultChecked={isRecordingAllowed}
        />
        <label
          className="pl-3 ml-0.5 text-sm font-medium text-gray-500 p-2"
          htmlFor="jam-room-isrecordingallowed"
        >
          Allow Recordings
          <div className="p-2 pl-9 text-gray-400 text-sm">
            If recordings are allowed, then any moderator of the room can begin a recording
            in their client. Participants in the room are notified that a recording is in progress.
            If unchecked, the Start Recording option will not be present in the menu choices.
          </div>
        </label>
      </div>

      <div className="mt-2">
        <input
          className="ml-2"
          type="checkbox"
          name="jam-room-stageonly"
          id="jam-room-stageonly"
          onChange={() => {
            setStageOnly(!stageOnly);
          }}
          defaultChecked={stageOnly}
        />
        <label
          className="pl-3 ml-0.5 text-sm font-medium text-gray-500 p-2"
          htmlFor="jam-room-stageonly"
        >
          Stage Only room
          <div className="p-2 pl-9 text-gray-400 text-sm">
            When enabled, users entering the room will be brought on stage by default.
            A moderator can still move a user to the audience.
          </div>
        </label>
      </div>

    </div>
  );
}
