import React from 'react';

/* NOT USED */

export default function StartRoomCard({
    roomInfo,
  }) {
    const roomId = roomInfo?.roomId ?? 'unknown-room';
    //const topic = roomInfo?.topic ?? '';
    const userCount = roomInfo?.userCount ?? -1;
    // todo: display list of users, or first few of them as names or avatars?
    const userInfo = roomInfo?.userInfo ?? [];

    var coloringStyle = {
        backgroundColor: '#444488',
        color: '#ffffcc',
        width: '300px',
        cursor: 'pointer',
        display: 'inline-block',
        marginLeft: '2px',
        marginRight: '2px',
        backgroundImage: `url(/img/roombutton/${roomId}.png)`,
        backgroundSize: '300px',
    };

    return (
        <div className="flex justify-center">
        <a href={`./${roomId}`} alt={`Join ${userCount} chatting in ${roomId}`}>
        <div className="select-none px-6 text-lg rounded-lg mt-3"
             style={coloringStyle}
        >
            <div
                className="human-radius p-1 relative flex justify-center"
                style={{
                    height: '133px',
                }}
            >
            </div>
        </div>
        <div className="justify-center" style={{maxWidth: '320px'}}>{
            userInfo.map((userData) => { return <StartRoomCardAvatar userData={userData} key={userData.id} />
        })}</div>

        </a>
        </div>
    );
}

/* NOT USED */

export function StartRoomCardAvatar({
    userData,
}) {
    const userName = userData?.name ?? 'Anon';
    const userAvatar = userData?.avatar ?? '/img/avatars/avatar-corn-4.png';

    return (
        <div className="m-2" style={{
            width: '48px',
            height: '48px',
            backgroundImage: `url(${userAvatar})`,
            backgroundSize: '48px 48px',
            float: 'left',
        }} title={userName}>&nbsp;</div>
    );
}
