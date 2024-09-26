import React from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';

export default function StartRoomSimple({
    roomInfo,
    index,
  }) {
    const roomId = roomInfo?.roomId ?? 'unknown-room';
    const roomName = roomInfo?.name ?? roomId;
    const roomDescription = roomInfo?.description ?? '';
    const roomLogoValue = roomInfo?.logoURI ?? '';
    const roomLogo = roomLogoValue.length > 0 ? roomLogoValue : '/img/cornychat-defaultroomlogo.png';
    const userCount = roomInfo?.userCount ?? -1;
    const isProtected = roomInfo?.isProtected ?? false;

    var coloringStyle = {
        backgroundColor: 'rgb(1,111,210)',
        backgroundImage: 'linear-gradient(rgb(1, 111, 210), rgb(0, 0, 0))',
        color: 'rgb(255,255,255)',
        width: '300px',
        cursor: 'pointer',
        display: 'inline-block',
    };

    return (
        <div className="px-0 text-md rounded-lg m-2"
             style={coloringStyle}
             key={`room_${index}`}
        >
        <a href={`./${roomId}`}>
          <table style={{width:'300px',margin:'0px',padding:'0px'}}><tbody>
            <tr>
              <td rowSpan="2" style={{width: '140px',position:'relative'}}>
                <img src={roomLogo}
                     style={{width: '128px', height: '128px', objectFit: 'cover'}} />
                {isProtected && (
                  <div className="italic text-xs"
                      style={{position:'absolute',bottom:'0px',left:'0px',backgroundColor:'rgba(208,80,21,.63)'}} 
                      title={'A passphrase is required to enter this room'}>A passphrase is required to enter this room</div>)}                     
              </td>
              <td className="text-xl" style={{width: '160px'}} title={`${roomDescription}`}>
                <div style={{width: '160px', height: '96px', overflowY: 'clip'}} >
                  {roomName || roomId}
                </div>
              </td>
            </tr>
            <tr>
              <td className="text-md">{userCount > 0 ? (`${userCount} users`) : `Nobody Present`}</td>
            </tr>
          </tbody></table>
        </a>
        </div>
    );
}
