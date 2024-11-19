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

  function addEmoji(emojiobject) {
    let emoji = emojiobject.emoji;
    let theemoji = emoji.toString().toUpperCase().startsWith('E') ? emoji.toString().toUpperCase() : emoji;
    if (emoji.startsWith('https://')) theemoji = emojiobject.imageUrl;
    //console.log(JSON.stringify(emojiobject));
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

  function hideSearchIcon() {
    try {
      let o = document.getElementsByClassName('epr-icn-search');
      if (o && o.length > 0) o[0].style.display = 'none';
    } catch(e) {
      // ignore
    }
  }
  let hsit = setTimeout(() => {hideSearchIcon();}, 500);
 
  let roomCustomEmojis = sessionStorage.getItem('customEmojis') ? JSON.parse(sessionStorage.getItem('customEmojis')) : [];

  return (
    <div>
      <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpanded(!expanded)}>
      {expanded ? '🔽' : '▶️'} Custom Emojis
      </p>
      <div className={expanded ? '' : 'hidden'}>
      {iOwn && (
      <div className="my-5">
        <p className="text-sm font-medium text-gray-300 p-2">
          Select the custom emoji reactions for this room.  You can also include emojis that you've favorited at 
          <a style={{display:'inline'}} href="https://emojito.meme/browse" target="_blank"><img style={{display:'inline',width:'20px',height:'20px',border:'0px'}} src="https://i.nostr.build/p7ORJdewBYXIeLmg.png" /> Emojito.Meme</a>.
        </p>
        <EmojiPicker
          lazyLoadEmojis={true}
          width={'width:max-content'}
          onEmojiClick={emojiobject => addEmoji(emojiobject)}
          previewConfig={{showPreview: false}}
          autoFocusSearch={false}
          searchPlaceHolder=''
          customEmojis={roomCustomEmojis}
        />
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-300 p-2">
            Your current emoji reactions (click emoji to remove):
          </p>
          <div className="flex flex-wrap cursor-pointer">
            {customEmojis?.map((emoji, index) => {
              let customemojikey = `customemojikey_${index}`;
              return (
                <div
                  key={customemojikey}
                  className="p-2 m-2 bg-gray-200 rounded-lg hover:bg-red-500"
                  onClick={() => removeEmoji(index)}
                >
                  <p>{emoji.toString().toUpperCase().startsWith('E') ? (
                <img
                  src={`/img/emojis/emoji-${emoji.toString().toUpperCase()}.png`}
                  style={{
                    width: '24px',
                    height: 'auto',
                    border: '0px',
                    display: 'inline',
                  }}
                />
              ) : (emoji.toString().startsWith('https://') ? (
                <img
                  src={emoji.toString()}
                  style={{
                    width: '24px',
                    height: 'auto',
                    border: '0px',
                    display: 'inline',
                  }}
                />
              ) : (emoji))}</p>
                </div>
              );
            })}
          </div>

          <button
            className="px-5 py-2 text-sm rounded-md"
            style={{
              color: textColor,
              backgroundColor: roomColor.buttons.primary,
            }}
            onClick={() => resetEmojis()}
          >
            Reset to default
          </button>
        </div>
      </div>
      )}

      {!iOwn && (
      <div className="flex flex-wrap">
        {customEmojis?.map((emoji, index) => {
          let customemojikey = `customemojikey_${index}`;
          return (
            <div key={customemojikey} className="p-2 m-2 bg-gray-200 rounded-lg">
              <p>{emoji.toString().toUpperCase().startsWith('E') ? (
                <img
                  src={`/img/emojis/emoji-${emoji.toString().toUpperCase()}.png`}
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
