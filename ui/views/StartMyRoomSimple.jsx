import React from 'react';
import {useJam} from '../jam-core-react';

export default function StartMyRoomSimple({
    roomInfo,
    index,
    myId,
  }) {

    const [state, api] = useJam();
    const {removeSelfFromRoom} = api;
    const roomId = roomInfo?.roomId ?? 'unknown-room';
    const roomNameValue = roomInfo?.name ?? roomId;
    const roomName = roomNameValue.length > 0 ? roomNameValue : roomId;
    const roomLogoValue = roomInfo?.logoURI ?? '';
    const roomLogo = roomLogoValue.length > 0 ? roomLogoValue : `${window.jamConfig.urls.jam}/img/cornychat-defaultroomlogo.png`;
    const userCount = roomInfo?.userCount ?? -1;
    const isOwner = roomInfo?.isOwner ?? false;
    const isModerator = roomInfo?.isModerator ?? false;
    const isSpeaker = roomInfo?.isSpeaker ?? false;
    const isPrivate = roomInfo?.isPrivate ?? true;
    const isProtected = roomInfo?.isProtected ?? false;

    var coloringStyle = {
        backgroundColor: 'rgb(210,111,210)',
        backgroundImage: 'linear-gradient(rgb(110, 47, 218), rgb(0, 0, 0))',
        cursor: 'pointer',
        color: 'rgb(255,255,255)',
    };

    if (roomInfo.hidden) {
        return (
            <span key={`myroom_${index}`}></span>
        );
    }

    return (
        <div className="text-md rounded-lg p-2 m-2"
            key={`myroom_${index}`}
             style={coloringStyle}
             id={`myrooms-${roomId}`}
        >
            <table cellPadding="0" cellSpacing="0" width="300px"><tbody>
                <tr>
                    <td>
                        <a href={`./${roomId}`}>
                            <img src={roomLogo} style={{width:'32px', height:'32px', objectFit: 'cover'}} align="left" />
                            {(roomId != roomName) && (
                                <>
                                {roomId}
                                <br />
                                </>
                            )}
                            {roomName}
                            {userCount > 0 && (
                                <>
                                <br />
                                ({userCount} users chatting)
                                </>
                            )}
                        </a>
                    </td>
                    <td width="80" style={{width: '80px'}} className="text-sm">
                        {isOwner && ('👑')}
                        {isModerator && ('🛡️')}
                        {isSpeaker && ('🎤')}
                        {isPrivate && ('🕵️')}
                        {isProtected && ('🔤')}
                    </td>
                    <td width="20" style={{width: '20px'}} >
                        <button className="mr-2 h-6 text-sm rounded-md"
                        title="Remove yourself from this room"
                        onClick={async (e) => {
                            e.stopPropagation();
                            let result = confirm('Are you sure you want to remove yourself from this room?');
                            if (result != true) {
                              return;
                            }
                            removeSelfFromRoom(roomId, myId);
                            let f = document.getElementById(`myrooms-${roomId}`);
                            if (f) {
                                f.style.display = 'none';
                                roomInfo.hidden = true;
                            }
                        }}
                        >
                        ❌
                        </button>
                    </td>
                </tr>
            </tbody></table>
        </div>
    );
}
