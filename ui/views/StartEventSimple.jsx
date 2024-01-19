import React from 'react';

export default function StartEventSimple({
    eventInfo,
  }) {
    const roomId = eventInfo?.roomId ?? 'unknown-room';
    const humanName = eventInfo?.humanName ?? roomId;
    const humanTime = eventInfo?.humanTime ?? 'soon';

    var coloringStyle = {
        backgroundColor: '#CCCC0080',
        color: '#ffffcc',
        maxWidth: '350px',
        cursor: 'pointer',
        display: 'inline-block',
        marginLeft: '2px',
        marginRight: '2px',
    };

    return (
        <div className="flex justify-center">
        <a href={`./${roomId}`}>
        <div className="select-none px-0 text-lg rounded-lg mt-3"
             style={coloringStyle}
        >
            <table cellpadding="0" cellspacing="0" border="0" style={{maxWidth:'350px',width:'350px'}}>
            <tr><td align="left">{humanName}</td></tr>
            <tr><td align="right">{humanTime}</td></tr>
            </table>
        </div>
        </a>
        </div>
    );
}
