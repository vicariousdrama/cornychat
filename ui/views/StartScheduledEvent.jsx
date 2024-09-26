import React from 'react';
import {makeLocalDate} from '../nostr/nostr';

export default function StartScheduledEvent({
    eventInfo,
    index,
  }) {
    //available fields:  startTime, endTime, image, location, title
    const localHumanDateTime = makeLocalDate(eventInfo.startTime);
    var coloringStyle = {
        backgroundColor: 'rgb(7,74,40)',
        backgroundImage: 'linear-gradient(rgb(7,74,40), rgb(0,0,0))',
        color: 'rgb(254,234,101)',
        maxWidth: '350px',
        cursor: 'pointer',
        display: 'inline-block',
        marginLeft: '2px',
        marginRight: '2px',
    };
    var coloringStyleExternal = {
        backgroundColor: 'rgb(74,74,40)',
        backgroundImage: 'linear-gradient(rgb(74,74,40), rgb(0,0,0))',
        color: 'rgb(254,234,101)',
        maxWidth: '300px',
        cursor: 'pointer',
        display: 'inline-block',
        marginLeft: '2px',
        marginRight: '2px',
    };
    var isExternal = !eventInfo?.location.startsWith(jamConfig.urls.jam);
    var imageUrl = eventInfo?.image ?? 'https://cornychat.com/img/cornychat-app-icon.jpg';

    return (
        <div className="px-0 text-md rounded-lg m-2" key={`scheduled_${index}`}
            style={{width: '300px', display: 'inline-block'}}
        >
        <a href={`${eventInfo.location}`}>
        <div className="select-none px-0 text-md rounded-lg mt-3"
             style={isExternal ? coloringStyleExternal : coloringStyle}
        >
            <table cellPadding="0" cellSpacing="0" border="0" style={{maxWidth:'320px',width:'300px'}}><tbody>
            <tr>
                <td style={{width: '72px'}}>
                    <img src={imageUrl}
                        style={{width: '64px', height: '64px', objectFit: 'cover'}} />
                </td>
                <td>
                    <div style={{width:'221px',height:'48px',overflow:'hidden', textOverflow:'ellipsis',textAlign:'left'}}>
                    {eventInfo?.title ?? eventInfo.location}
                    </div>
                </td></tr>
            <tr><td colspan="2" align="right" className="text-sm">{localHumanDateTime}</td></tr>
            </tbody></table>
        </div>
        </a>
        </div>
    );
}
