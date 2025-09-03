import React from 'react';
import {Modal} from './Modal';
import {LabeledInput, useUrlInput, useFileInput} from './Input';
import {set} from 'use-minimal-state';
import {useJam} from '../jam-core-react';
import {isDark, colors} from '../lib/theme';

export default function StreamingModal({close}) {
  // let [urlValue, urlInput] = useInput();
  const [state] = useJam();
  let [getFile, fileInput] = useFileInput();
  let [getUrl, urlInput] = useUrlInput();
  let submit = async e => {
    e.preventDefault();
    let file = getFile();
    let url = getUrl();
    if (file && file.name && file.name.length > 0) {
      console.log('setting audioFile to file ', file.name);
      set(state, 'audioFile', {file, name: file.name});
    } else if (url && url.value && url.value.length > 0) {
      let urlblob = await createBlobFromUrl(url.value);
      if (urlblob) {
        console.log('setting audioFile to url ', url.value);
        set(state, 'audioFile', {file: urlblob, name: url.value});
      }
    }
    close();
  };

  async function createBlobFromUrl(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error creating Blob from URL:', error);
      return null;
    }
  }

  const colorTheme = state.room?.color ?? 'default';
  const roomColor = colors(colorTheme, state.room.customColor);
  return (
    <Modal close={close}>
      <h1 className="text-gray-200">Stream audio</h1>
      <p class="text-gray-200">
        While streaming audio your voice will not be sent. Stopping the audio
        will let you speak again.
      </p>
      <br />
      <form onSubmit={submit} className="text-gray-500">
        {/* <p>You can have several options to add an audio source</p>
        <br /> */}
        <LabeledInput
          accept="audio/*,.mp3,.wav,.m4a,.oga,.3gp,.3g2,.aiff,.mp4"
          {...fileInput}
          label="Stream audio from file"
          optional
        />
        <br />
        <LabeledInput
          placeholder="Audio source URL"
          {...urlInput}
          label="Stream audio from URL"
          optional
        />
        <br />
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
