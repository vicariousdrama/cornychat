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
        display: 'inline-block',
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
            onClick={async (e) => {
                location.href = `./${roomId}`;
            }}
        >
            <table cellPadding="0" cellSpacing="0" width="300px"><tbody>
                <tr>
                    <td width="48"><img src={roomLogo} style={{width:'48px', height:'48px', objectFit: 'cover'}} /></td>
                    <td width="232" className="text-sm" align="left">
                        room id: {roomId}<br />
                        {roomId != roomName && (<>{roomName}</>)}
                    </td>
                </tr>
                <tr>
                    <td colspan="2">
                        <table cellPadding="0" cellSpacing="0" width="300px">
                            <tr>
                                <td className="text-sm" align="left">
                                    {isOwner && (<span title="Room Owner"> 👑 </span> )}
                                    {isModerator && (<span title="Room Moderator"> 🛡️ </span> )}
                                    {isSpeaker && (<span title="Speaker"> 🎤 </span> )}
                                    {isPrivate && (<span title="Private (unlisted) Room"> 🕵️ </span> )}
                                    {isProtected && (<span title="Passphrase Protected Room"> 🔤 </span> )}
                                    {userCount > 0 && (<span> {userCount} users chatting </span>)}
                                </td>
                                <td className="text-sm" align="right">
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
                        </table>
                    </td>
                </tr>
            </tbody></table>
        </div>
    );
}
