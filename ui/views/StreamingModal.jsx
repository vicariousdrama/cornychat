import React from 'react';
import {Modal} from './Modal';
import {LabeledInput, useFileInput} from './Input';
import {set} from 'use-minimal-state';
import {useJam} from '../jam-core-react';
import {isDark, colors} from '../lib/theme';

export default function StreamingModal({close}) {
  // let [urlValue, urlInput] = useInput();
  const [state] = useJam();
  let [getFile, fileInput] = useFileInput();
  let submit = async e => {
    e.preventDefault();
    let file = getFile();
    set(state, 'audioFile', {file, name: file.name});
    close();
  };

  const colorTheme = state.room?.color ?? 'default';
  const roomColor = colors(colorTheme, state.room.customColor);
  return (
    <Modal close={close}>
      <h1 className="text-gray-200">Stream audio</h1>
      <p class="text-gray-200">While streaming audio your voice will not be sent. Stopping the audio will let you speak again.</p>
      <br />
      <form onSubmit={submit} className="text-gray-500">
        {/* <p>You can have several options to add an audio source</p>
        <br /> */}
        <LabeledInput
          accept="audio/*,.mp3,.wav,.m4a,.oga,.3gp,.3g2,.aiff,.mp4"
          {...fileInput}
          label="Stream audio from file"
        />
        <br />
        {/* <LabeledInput
          placeholder="Audio source URL"
          {...urlInput}
          label="Stream audio from URL"
          optional
        />
        <br /> */}
        <div className="spaced-w-2 flex">
          <button
            onClick={submit}
            className="flex-grow mt-5 h-12 px-6 text-lg rounded-lg mr-2"
            style={{
              color: isDark(roomColor.buttons.primary)
                ? roomColor.text.light
                : roomColor.text.dark,
              backgroundColor: roomColor.buttons.primary,
            }}
          >
            Stream
          </button>
          <button
            onClick={close}
            className="mt-5 h-12 px-6 text-lg text-black bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
