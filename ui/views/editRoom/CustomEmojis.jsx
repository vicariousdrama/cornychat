import React, {useState} from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';
import EmojiPicker from 'emoji-picker-react';
import reactionEmojis from '../../emojis';

export function CustomEmojis({
  customEmojis,
  setCustomEmojis,
  textColor,
  roomColor,
}) {
  let mqp = useMqParser();

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
   let result = confirm('Are you sure you want to reset the emoji list to defaults?');
    if (result != true) {
      return;
    }
    setCustomEmojis(reactionEmojis);
  }

  return (
    <div>
      <p className="text-lg font-medium text-gray-500 px-2">
        Custom Emojis
      </p>

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
            className="px-5 h-12 text-sm"
            style={{
              color: textColor,
              backgroundColor: roomColor.buttons.primary,
            }}
            onClick={() => resetEmojis()}
          >
            Reset to default emojis
          </button>
        </div>
      </div>

    </div>
  );
}
