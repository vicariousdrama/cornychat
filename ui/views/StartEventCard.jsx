import React from 'react';

export default function StartEventCard({
    eventInfo,
  }) {
    const eventId = eventInfo?.eventId ?? 'unknown-event';
    const roomId = eventInfo?.roomId ?? 'unknown-room';
    const buttonUrl = eventInfo?.buttonUrl ?? '';

    var coloringStyle = {
        backgroundColor: '#444488',
        color: '#ffffcc',
        width: '225px',
        cursor: 'pointer',
        display: 'inline-block',
        marginLeft: '2px',
        marginRight: '2px',
        backgroundImage: `url(${buttonUrl})`,
        backgroundSize: '225px',
    };

    return (
        <a href={`./${roomId}`} >
        <div className="select-none px-6 text-lg rounded-lg mt-3"
             style={coloringStyle}
        >
            <div
                className="human-radius p-1 relative flex justify-center"
                style={{
                    height: '100px',
                }}
            >
            </div>
        </div>
        </a>
    );
}
