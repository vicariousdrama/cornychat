import React from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';
import {Trash} from '../Svg';
import EmojiPicker from 'emoji-picker-react';
import reactionEmojis from '../../emojis';

export function ExtraRoomInfo({
  roomLinks,
  setRoomLinks,
  buttonText,
  setButtonText,
  buttonURI,
  setButtonURI,
  textColor,
  roomColor,
  customEmojis,
  setCustomEmojis,
  closed,
  setClosed,
}) {
  let mqp = useMqParser();

  function RoomLinks() {
    if (roomLinks.length === 0) {
      return (
        <div>
          <p className="text-sm text-gray-500 p-2">
            There are not links set up.
          </p>
        </div>
      );
    }

    function removeLink(indexLink) {
      let newRoomLinks = roomLinks.filter((link, index) =>
        index !== indexLink ? link : null
      );
      setRoomLinks(newRoomLinks);
    }

    return (
      <>
        {roomLinks.map((link, index) => {
          let linkText = link[1];
          let linkDescription = link[0];
          if (linkText.length > 25) linkText = linkText.substring(0, 40);

          return (
            <div className="flex w-full justify-between my-3">
              <div>
                {' '}
                <p className="text-sm text-black">{linkDescription}</p>
                <p className="text-xs text-gray-500">{linkText}</p>
              </div>
              <div onClick={() => removeLink(index)} className="cursor-pointer">
                <Trash />
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
      <div className="mb-10">
        <p className="text-sm font-medium text-gray-500 p-2">
          Add your custom links:
        </p>
        <div className="flex">
          <input
            className={mqp(
              'rounded placeholder-gray-400 bg-gray-50 w-full mx-1 md:w-full'
            )}
            type="text"
            placeholder="Visit my website"
            name="jam-room-button-uri"
            value={buttonText}
            autoComplete="off"
            style={{
              borderWidth: '0px',
              fontSize: '15px',
            }}
            onChange={e => {
              setButtonText(e.target.value);
            }}
          ></input>
          <input
            className={mqp(
              'rounded placeholder-gray-400 bg-gray-50 w-full mx-1 md:w-full'
            )}
            type="text"
            placeholder="http://google.com"
            name="jam-room-button-uri"
            value={buttonURI}
            autoComplete="off"
            style={{
              borderWidth: '0px',
              fontSize: '15px',
            }}
            onChange={e => {
              setButtonURI(e.target.value);
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
              setButtonURI('');
              setButtonText('');
            }}
          >
            Add link
          </button>
        </div>
        <div className="bg-gray-200 py-2 px-4 my-5 rounded-lg">
          <RoomLinks />
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
            {customEmojis.map((emoji, index) => {
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

      <div className="mt-10">
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
            Closed rooms can only be joined by moderators.
            <br />
            Everyone else sees the description and the&nbsp;
            {`'call to action'`} button.
          </div>
        </label>
      </div>
    </div>
  );
}
