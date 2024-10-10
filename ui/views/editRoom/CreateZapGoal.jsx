import React, {useState, useEffect} from 'react';
import {Modal} from '../Modal';
import {getPublicKey, publishZapGoal} from '../../nostr/nostr';
import {useMqParser} from '../../lib/tailwind-mqp';
import {nip19} from 'nostr-tools';

export const CreateZapGoalModal = ({
    close,
    textColor,
    roomColor,
    zapGoal,
    setZapGoal,
}) => {
  let mqp = useMqParser();
  const [zgContent, setZGcontent] = useState(zapGoal?.content || '');
  const [zgAmount, setZGamount] = useState(zapGoal?.amount || '0');

  let submit = async e => {
    e.preventDefault();
    const myPubkey = await getPublicKey();
    const myNpub = nip19.npubEncode(myPubkey);
    setZGcontent(decodeHTMLEncoded(zgContent));
    let [ok, ret2] = await publishZapGoal(zgContent, zgAmount);
    if (ok) {
        setZapGoal({content:zgContent,amount:zgAmount,id:ret2,npub:myNpub});
        close();
    } else {
        alert(`An error occurred while creating and publishing the zap goal.\n${ret2}`);
    }
  };

  function decodeHTMLEncoded(v) {
    let o = v || '';
    let goagain = false;
    while (o.indexOf("&amp;") > -1) {
      o = o.replaceAll("&amp;", "&");
      goagain = true;
    }
    while (o.indexOf("&#38;") > -1) {
      o = o.replaceAll("&#38;", "&");
      goagain = true;
    }
    while (o.indexOf("&lt;") > -1) {
      o = o.replaceAll("&lt;", "<");
      goagain = true;
    }
    while (o.indexOf("&#60;") > -1) {
      o = o.replaceAll("&#60;", "<");
      goagain = true;
    }
    while (o.indexOf("&gt;") > -1) {
      o = o.replaceAll("&gt;", ">");
      goagain = true;
    }
    while (o.indexOf("&#62;") > -1) {
      o = o.replaceAll("&#62;", ">");
      goagain = true;
    }
    while (o.indexOf("&apos;") > -1) {
      o = o.replaceAll("&apos;", "'");
      goagain = true;
    }
    while (o.indexOf("&#39;") > -1) {
      o = o.replaceAll("&#39;", "'");
      goagain = true;
    }
    while (o.indexOf("&quot;") > -1) {
      o = o.replaceAll("&quot;", "\"");
      goagain = true;
    }
    while (o.indexOf("&#38;") > -1) {
      o = o.replaceAll("&#38;", "\"");
      goagain = true;
    }
    if (goagain) {
      return decodeHTMLEncoded(o);
    }
    return o;
  }

  return (
    <Modal close={close}>
      <div className="bg-gray-700 text-gray-200 p-2 rounded-lg">
        <h2 className="text-2xl font-bold">Create Zap Goal</h2>
        <>
        <p>
            Description
        </p>
        <input
            className={mqp(
                'rounded-lg placeholder-gray-500 bg-gray-300 text-black border-4 pb-2 rounded-lg w-full md:w-96'
            )}
            type="text"
            placeholder="Short Zap Goal"
            value={zgContent}
            name="zapgoal-description"
            autoComplete="off"
            style={{
                fontSize: '15px',
            }}
            onChange={e => {
                setZGcontent(e.target.value);
            }}
        ></input>
        <p>
            Target Amount
        </p>
        <input
            className={mqp(
                'rounded-lg placeholder-gray-500 bg-gray-300 text-black border-4 pb-2 rounded-lg w-full md:w-96'
            )}
            type="text"
            placeholder="21000"
            value={zgAmount}
            name="zapgoal-amount"
            autoComplete="off"
            style={{
                fontSize: '15px',
            }}
            onChange={e => {
                setZGamount(Math.floor(e.target.value.replace(/[^0-9]/g,'')));
            }}
        ></input>

        <div className="flex p-4">
            <div className="flex flex-grow">
                <button
                    onClick={submit}
                    className="flex-grow h-12 px-4 text-md rounded-lg mr-2"
                    style={{
                        color: textColor,
                        backgroundColor: roomColor.buttons.primary,
                    }}
                >
                Save
                </button>
            </div>
            <div className="flex">
                <button
                    onClick={close}
                    className="h-12 px-4 text-md text-black bg-gray-100 rounded-lg focus:shadow-outline active:bg-gray-300"
                >
                Cancel
                </button>
            </div>
        </div>
        </>
      </div>  
    </Modal>
  );
};
