import React, {useState, useEffect} from 'react';
import {Modal} from './Modal';
import {dosha256hexrounds} from '../lib/sha256rounds.js';
import {isDark} from '../lib/theme';
import {useMqParser} from '../lib/tailwind-mqp';
import {useJam} from '../jam-core-react';

export const PassphraseModal = ({
    close,
    roomId,
    roomPassphraseHash,
    roomColor,
    checkcount,
}) => {
    const [state, {leaveRoom}] = useJam();    
    let mqp = useMqParser();
    let [passphrasePlain, setPassphrasePlain] = useState('');
    let [passphraseHash, setPassphraseHash] = useState('');
    let [wrongPassphrase, setWrongPassphrase] = useState(false);
    let [progress, setProgress] = useState(60 - ((checkcount-1) * 5));
    const textColor = isDark(roomColor.buttons.primary) ? roomColor.text.light : roomColor.text.dark;

    useEffect(() => {
        // progress meter
        const progressInterval = setInterval(() => {
            progress = progress - 1;
            setProgress(progress);
            document.getElementById('timeRemaining').value = progress;
            document.getElementById('timeRemaining').innerText = `${progress} seconds`;
        }, 1000);
        // if still here after a minute, leave the room
        const leaveRoomTimeout = setTimeout(() => {
            close();
            if (roomPassphraseHash != passphraseHash) {
                leaveRoom();
            }
        }, 60000);
        return () => {
          clearInterval(leaveRoomTimeout);
          clearInterval(progressInterval);
        };
    }, []);  

    let submit = async e => {
        e.preventDefault();
        // Store the new passphrase in local storage
        localStorage.setItem(`${roomId}.passphrase`, passphrasePlain);
        if (roomPassphraseHash != passphraseHash) {
            setWrongPassphrase(true);
        } else {
            // ok to close
            close();
        }
    };

    return (
    <Modal close={close}>
      <div className="bg-gray-700 text-gray-200 p-6 rounded-lg">
        <h2 className="text-2xl font-bold">Room Passphrase</h2>
        <>
        <p>
            This room is protected by a passphrase. Enter the passphrase to remain in the room.
        </p>
        <p>
            <label for="timeRemaining">Time remaining:</label>
            <progress id="timeRemaining" value={progress} max="60">  </progress> {`${progress} seconds`}
        </p>
        <div className="flex justify-between">
        <input
            className={mqp(
                'rounded-lg placeholder-black bg-gray-400 text-black border-4 pb-2 rounded-lg w-full md:w-96'
            )}
            type="password"
            placeholder=""
            value={passphrasePlain}
            name="jam-room-passphrase"
            autoComplete="off"
            style={{
                fontSize: '15px',
            }}
            onChange={async(e) => {
                let plaintext = e.target.value;
                setPassphrasePlain(plaintext);
                setWrongPassphrase(false);
            }}
            onBlur={async(e) => {
                let roomPassphrasePlain = `${roomId}.${passphrasePlain}`;
                let roomPassphraseHash = await dosha256hexrounds(roomPassphrasePlain,21);
                setPassphraseHash(roomPassphraseHash);
            }}
        ></input>
        </div>

        <div className="h-12"></div>

        <div className="flex justify-between">
        <button
            onClick={submit}
            className="flex-grow h-12 px-4 text-md rounded-lg mr-2"
            style={{
                backgroundColor: (wrongPassphrase ? 'rgb(255,0,0)' : roomColor.buttons.primary),
                color: (wrongPassphrase ? 'rgb(244,244,244)' : textColor),
            }}
            >
            {wrongPassphrase ? `Invalid Passphrase` : `Submit Passphrase`}
        </button>
        </div>
        </>
      </div>  
    </Modal>
    );
};
