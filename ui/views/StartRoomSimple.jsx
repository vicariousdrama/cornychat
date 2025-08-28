import React from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';

export default function StartRoomSimple({roomInfo, index, myFavoritedRooms}) {
  const roomId = roomInfo?.roomId ?? 'unknown-room';
  const roomName = roomInfo?.name ?? roomId;
  const roomDescription = roomInfo?.description ?? '';
  const roomLogoValue = roomInfo?.logoURI ?? '';
  const roomLogo =
    roomLogoValue.length > 0
      ? roomLogoValue
      : '/img/cornychat-defaultroomlogo.png';
  const userCount = roomInfo?.userCount ?? -1;
  const isProtected = roomInfo?.isProtected ?? false;
  const isStageOnly = roomInfo?.isStageOnly ?? false;
  const isLiveActivity = roomInfo?.isLiveActivity ?? false;
  const isTalkingStick = roomInfo?.isTS ?? false;
  const isMembersOnly = roomInfo?.isMembersOnly ?? false;
  const isNoAnon = roomInfo?.isNoAnon ?? false;
  const memberATag = roomInfo?.memberATag ?? '';

  var coloringStyle = {
    backgroundColor: 'rgb(1,111,210)',
    backgroundImage: 'linear-gradient(rgb(1, 111, 210), rgb(0, 0, 0))',
    color: 'rgb(255,255,255)',
    width: '300px',
    cursor: 'pointer',
    display: 'inline-block',
  };

  return (
    <div
      className="px-0 text-md rounded-lg m-2"
      style={coloringStyle}
      key={`room_${index}`}
    >
      <a href={`./${roomId}`}>
        <table style={{width: '300px', margin: '0px', padding: '0px'}}>
          <tbody>
            <tr>
              <td rowSpan="2" style={{width: '140px', position: 'relative'}}>
                <img
                  src={roomLogo}
                  style={{width: '128px', height: '128px', objectFit: 'cover'}}
                />
                <div
                  className="text-xs"
                  style={{
                    position: 'absolute',
                    bottom: '0px',
                    left: '0px',
                    backgroundColor: 'rgba(0,0,0,.63)',
                  }}
                >
                  {isProtected && (
                    <div
                      className="text-xs"
                      title="Passphrase required for access"
                      style={{
                        margin: '3px',
                        display: 'inline-block',
                        backgroundColor: 'rgba(0,0,0,.63)',
                      }}
                    >
                      {' '}
                      🔒{' '}
                    </div>
                  )}
                  {isNoAnon && (
                    <div
                      className="text-xs text-red-500"
                      title="Anonymous users are not allowed to participate"
                      style={{
                        margin: '3px',
                        display: 'inline-block',
                        backgroundColor: 'rgba(0,0,0,.63)',
                      }}
                    >
                      {' '}
                      🪪{' '}
                    </div>
                  )}
                  {isLiveActivity && (
                    <div
                      className="text-xs text-red-500"
                      title="A NOSTR Live Activity is being created for this event"
                      style={{
                        margin: '3px',
                        display: 'inline-block',
                        backgroundColor: 'rgba(0,0,0,.63)',
                      }}
                    >
                      NOSTRLIVE!
                    </div>
                  )}
                  {!isStageOnly && !isTalkingStick && (
                    <div
                      className="text-xs text-blue-500"
                      title="Must be invited to stage to speak"
                      style={{
                        margin: '3px',
                        display: 'inline-block',
                        backgroundColor: 'rgba(0,0,0,.63)',
                      }}
                    >
                      AUDIENCE
                    </div>
                  )}
                  {!isStageOnly && isTalkingStick && (
                    <div
                      className="text-xs text-blue-500"
                      title="Must have talking stick to speak"
                      style={{
                        margin: '3px',
                        display: 'inline-block',
                        backgroundColor: 'rgba(0,0,0,.63)',
                      }}
                    >
                      TALKING STICK
                    </div>
                  )}
                  {isMembersOnly && (
                    <div
                      className="text-xs text-gray-300"
                      title="Must be a member to join"
                      style={{
                        margin: '3px',
                        display: 'inline-block',
                        backgroundColor: 'rgba(0,0,0,.63)',
                      }}
                    >
                      MEMBERS ONLY
                    </div>
                  )}
                </div>
              </td>
              <td
                className="text-xl"
                style={{width: '160px'}}
                title={`${roomDescription}`}
              >
                <div
                  style={{
                    width: '160px',
                    height: '96px',
                    overflowY: 'clip',
                    wordBreak: 'break-all',
                  }}
                >
                  {roomName || roomId}
                </div>
              </td>
            </tr>
            <tr>
              <td className="text-md">
                {userCount > 0 ? `${userCount} users` : `Nobody Present`}
              </td>
            </tr>
          </tbody>
        </table>
      </a>
    </div>
  );
}
