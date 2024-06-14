import React, {useState} from 'react';
import {Modal} from './Modal';
import {isDark} from '../lib/theme';
import {useJam} from '../jam-core-react';

export const KickBanModal = ({
    close,
    peerId,
    peerDisplayName,
    actorId,
    room,
    roomId,
    roomColor,
    iOwn,
    iModerate,
    iAmAdmin,
}) => {

    const [state, api] = useJam();
    const {updateRoom} = api;
    let [reason, setReason] = useState('');
    let [duration, setDuration] = useState('600');
    const textColor = isDark(roomColor.buttons.primary) ? roomColor.text.light : roomColor.text.dark;

    // Close if no permissions
    if (!(iOwn || iModerate || iAmAdmin)) {
        close();
    }
    let submitUpdate = async partialRoom => {
        return updateRoom(roomId, {...room, ...partialRoom});
    };
    let submit = async e => {
        e.preventDefault();
        const until = Date.now() + (Math.floor(duration) * 1000);
        const kickRecord = {"id":peerId,"kickedBy":actorId,"reason":reason,"until":until};
        let kickRecords = room.kickRecords ?? [];
        kickRecords.push(kickRecord);
        let ok = await submitUpdate({kicked:kickRecords,kickRecords:null});
        if (!ok) {
          alert('An error occurred. Your changes were not saved. Exit and reattempt');
        } else {
          close();
        }
    };

    return (
    <Modal close={close}>
      <div className="bg-gray-700 text-gray-200 p-6 rounded-lg">
        <h2 className="text-2xl font-bold">Kick User</h2>
        <>
        <p>
            You may kick This room is protected by a passphrase. Enter the passphrase to remain in the room.
        </p>
        <div className="p-2 text-gray-200 bold">
            User Being Kicked: {peerDisplayName}
        </div>
        <div className="p-2 text-gray-200 bold">
            Reason for kicking out this user.  Providing details here provides context to owners and moderators.
        </div>
        <input
            className="rounded placeholder-black bg-gray-500 w-full"
            type="text"
            placeholder=""
            value={reason}
            onChange={e => {setReason(e.target.value);}}
        />
        <p className="text-sm font-medium text-gray-300">
            Duration
        </p>
        <select
            name="kickDuration"
            defaultValue={duration}
            onChange={e => {
            setDuration(e.target.value);
            }}
            className={'border mt-3 ml-2 p-2 text-black rounded'}
        >
            <option key="0" value="300">5 Minutes</option>
            <option key="1" value="600">10 Minutes</option>
            <option key="2" value="900">15 Minutes</option>
            <option key="3" value="1800">30 Minutes</option>
            <option key="4" value="3600">1 Hour</option>
            <option key="5" value="10800">3 Hours</option>
            <option key="6" value="86400">1 Day</option>
            <option key="7" value="5000000000">Indefinite</option>
        </select>


        <div className="h-12"></div>

        <div className="flex justify-between">
        <button
            onClick={submit}
            className="flex-grow h-12 px-4 text-md rounded-lg mr-2"
            style={{
                backgroundColor: roomColor.buttons.primary,
                color: textColor,
            }}
            >
            Kick User
        </button>
        </div>
        </>
      </div>  
    </Modal>
    );
};
