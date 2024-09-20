import React, {useState} from 'react';
import {Modal} from '../Modal';
import {saveList} from '../../nostr/nostr';

export const ExportLinksModal = ({
    close,
    roomId,
    textColor,
    roomColor,
    roomLinks,
}) => {
  const dt = new Date();
  const shortdate = dt.toISOString().replaceAll(':','-').replaceAll('T','.').replaceAll('-','').slice(0,13);
  const [dTagValue, setDTagValue] = useState(`cornychat-${roomId}`);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [displayError, setDisplayError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function saveit() {
    let dTag = dTagValue;
    if (dTag.length == 0) {
        dTag = shortdate;
    }
    let imageUrl = jamConfig.urls.jam.replaceAll('/localhost/','/cornychat.com/') + '/img/cornychat-links.png';
    let result = await saveList(dTag, name, about, imageUrl, 31388, roomLinks);
    if (!result[0]) {
        setErrorMsg(result[1]);
        setDisplayError(true);
    } else {
        close();
        alert('Link List published to relays');
        return;
    }
  }

  return (
    <Modal close={close}>
      <div className="bg-gray-700 text-gray-200 p-6 rounded-lg">
        <h2 className="text-2xl font-bold">Export Links</h2>
        <p>
          Unique ID
        </p>
        <div className="p-2 text-gray-500 italic">
          {`Using the same ID of a prior export will overwrite it.`}
        </div>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 mb-4 placeholder-gray-500 bg-gray-300 text-black"
          placeholder="Unique ID (using the same of prior export will overwrite it)"
          value={dTagValue}
          onChange={e => {
            setDTagValue(e.target.value);
          }}
        />
        <p>
          Name
        </p>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 mb-4 placeholder-gray-500 bg-gray-300 text-black"
          placeholder="Name"
          value={name}
          onChange={e => {
            setName(e.target.value);
          }}
        />
        <p>
          About
        </p>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 mb-4 placeholder-gray-500 bg-gray-300 text-black"
          placeholder="About (optional)"
          value={about}
          onChange={e => {
            setAbout(e.target.value);
          }}
        />
        <button
          className="py-2 px-4 rounded text-center w-full"
          style={{
            backgroundColor: roomColor.buttons.primary,
            color: textColor,
          }}
          onClick={async () => {
            await saveit();
          }}
        >
          Save
        </button>
        <div className="mt-5">
          {displayError ? <p className="text-red-500">{errorMsg}</p> : null}
        </div>
      </div>  
    </Modal>
  );
};
