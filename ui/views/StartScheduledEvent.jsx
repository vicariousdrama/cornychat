import React from 'react';
import {rawTimeZones, getTimeZones} from '@vvo/tzdb';

export default function StartScheduledEvent({
    eventInfo,
  }) {
    //available fields:  startTime, endTime, image, location, title

    let timeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone; // Europe/London
    let timeZoneOffset = 0;
    let timeZoneAbbrev = 'UTC';
    for(let r =0; r < rawTimeZones.length; r++) {
        if(rawTimeZones[r].name == timeZoneName) {
            timeZoneOffset = rawTimeZones[r].rawOffsetInMinutes * -60;
            timeZoneAbbrev = rawTimeZones[r].abbreviation;
        }
    }
    const date = new Date(eventInfo.startTime * 1000);
    var dateOptions = { weekday: 'long', month: 'long', day: 'numeric' }; 
    const humanDate = new Intl.DateTimeFormat('en-us',dateOptions).format(date);
    var timeOptions = { timeStyle: 'short'};
    const humanTime = new Intl.DateTimeFormat('en-us',timeOptions).format(date);

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
        maxWidth: '350px',
        cursor: 'pointer',
        display: 'inline-block',
        marginLeft: '2px',
        marginRight: '2px',
    };
    var isExternal = !eventInfo?.location.startsWith(jamConfig.urls.jam);
    var imageUrl = eventInfo?.image ?? 'https://cornychat.com/img/cornychat-app-icon.jpg';

    return (
        <div className="">
        <a href={`${eventInfo.location}`}>
        <div className="select-none px-0 text-lg rounded-lg mt-3"
             style={isExternal ? coloringStyleExternal : coloringStyle}
        >
            <table cellpadding="0" cellspacing="0" border="0" style={{maxWidth:'350px',width:'350px'}}>
            <tr>
                <td rowspan="2" style={{width: '72px'}}>
                    <img src={imageUrl}
                        style={{width: '64px', height: '64px', objectFit: 'cover'}} />
                </td>
                <td align="left">{eventInfo?.title ?? eventInfo.location}</td></tr>
            <tr><td align="right" class="text-sm">{humanDate} at {humanTime} {timeZoneAbbrev}</td></tr>
            </table>
        </div>
        </a>
        </div>
    );
}
