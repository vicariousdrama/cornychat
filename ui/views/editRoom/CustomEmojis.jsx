import React, {useState} from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';
import EmojiPicker from 'emoji-picker-react';
import reactionEmojis from '../../emojis';

export function CustomEmojis({
  iOwn,
  customEmojis,
  setCustomEmojis,
  textColor,
  roomColor,
}) {
  let mqp = useMqParser();
  let [expanded, setExpanded] = useState(false);
  function removeEmoji(emojiIndex) {
    const newEmojis = customEmojis.filter(
      (emoji, index) => index !== emojiIndex
    );
    setCustomEmojis(newEmojis);
  }

  function addEmoji(emoji) {
    let theemoji = emoji.toString().toUpperCase().startsWith('E') ? emoji.toString().toUpperCase() : emoji;
    if (customEmojis.includes(theemoji)) return;
    setCustomEmojis(prevArray => [...prevArray, theemoji]);
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
      <p className="text-lg font-medium text-gray-500 cursor-pointer" onClick={() => setExpanded(!expanded)}>
      {expanded ? '🔽' : '▶️'} Custom Emojis
      </p>
      <div className={expanded ? '' : 'hidden'}>
      {iOwn && (
      <div className="my-5">
        <p className="text-sm font-medium text-gray-500 p-2">
          Add your custom emoji reactions:
        </p>
        <EmojiPicker
          width={'width:max-content'}
          onEmojiClick={emoji => addEmoji(emoji.emoji)}
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
                  <p>{emoji.toString().toUpperCase().startsWith('E') ? (
                <img
                  src={`/img/emoji-${emoji.toString().toUpperCase()}.png`}
                  style={{
                    width: '24px',
                    height: 'auto',
                    border: '0px',
                    display: 'inline',
                  }}
                />
              ) : (emoji)}</p>
                </div>
              );
            })}
          </div>

          <button
            className="px-5 h-12 text-sm rounded-md"
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
      )}

      {!iOwn && (
      <div className="flex flex-wrap">
        {customEmojis?.map((emoji, index) => {
          return (
            <div className="p-2 m-2 bg-gray-200 rounded-lg">
              <p>{emoji.toString().toUpperCase().startsWith('E') ? (
                <img
                  src={`/img/emoji-${emoji.toString().toUpperCase()}.png`}
                  style={{
                    width: '24px',
                    height: 'auto',
                    border: '0px',
                    display: 'inline',
                  }}
                />
              ) : (emoji)}</p>
            </div>
          );
        })}
      </div>
      )}
      </div>
    </div>
  );
}
