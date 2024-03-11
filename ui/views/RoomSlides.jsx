import React, {useState} from 'react';
import {use} from 'use-minimal-state';
import {colors, isDark} from '../lib/theme';
import {useJam, useApiQuery} from '../jam-core-react';
import 'react-slideshow-image/dist/styles.css';
import '@coreui/coreui/dist/css/coreui.min.css';
import {
  Previous,
  Next,
} from './Svg';

export default function RoomSlides({
  colors,
  roomSlides,
  currentSlide,
}) {

  const [state, {updateRoom}] = useJam();
  let [iOwn, iModerate, room, roomId] = use(state, ['iAmOwner','iAmModerator', 'room','roomId']);
  let submitUpdate = async partialRoom => {
    updateRoom(roomId, {...room, ...partialRoom});
  };

  const rsl = roomSlides?.length ?? 0;

  const textColor = isDark(colors.avatarBg) ? colors.text.light : colors.text.dark;
  const iconColor = isDark(colors.avatarBg) ? colors.icons.light : colors.icons.dark;

  function RoomSlide() {
    let sn = parseInt(currentSlide, 10) - 1;
    if (sn < 0) { sn = 0; }
    if (isNaN(sn)) { sn = -2; }
    if (roomSlides && (sn > -1) && (sn < rsl)) {
      let slideUrl = roomSlides[sn][0];
      let slideText = roomSlides[sn][1];
      let isImage = true;
      let isVideo = false;
      let isIFrame = false;
      if (slideUrl.endsWith('.mp4')) {
        isImage = false;
        isVideo = true;
      }
      if (slideUrl.endsWith('.webm')) {
        isImage = false;
        isVideo = true;
      }
      if (slideUrl.endsWith('.html')) {
        isImage = false;
        isIFrame = true;
      }
      return (
        <div className="mb-2" style={{color: textColor, backgroundColor: colors.avatarBg}}>
          {isImage && (
          <img src={slideUrl} style={{height: '320px', width: 'auto', maxWidth: '100%', margin: 'auto', align: 'center'}} />
          )}
          {(isVideo || isIFrame) && (
          <p>
          This slide cannot be shown at this time. Resource: {slideUrl}
          </p>
          )}
          <div className="flex" style={{color: textColor, backgroundColor: colors.avatarBg}}>
            {(iOwn || iModerate) && (
            <div class="flex-none">
            <button className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
            onClick={async () => {
              currentSlide -= 1;
              if (currentSlide < 1) { currentSlide = rsl; }
              await submitUpdate({currentSlide});
            }}
            style={{backgroundColor: colors.buttons.primary}}
            >
              <Previous color={iconColor} />
            </button>
            </div>
            )}
            <div className="text-sm flex-grow" style={{color: textColor, backgroundColor: colors.avatarBg}}>
            {slideText}
            </div>
            {(iOwn || iModerate) && (
            <div class="flex-none">
            <button className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
            onClick={async () => {
              currentSlide += 1;
              if (currentSlide > rsl) { currentSlide = 1; }
              await submitUpdate({currentSlide});
            }}
            style={{backgroundColor: colors.buttons.primary}}
            >
              <Next color={iconColor} />
            </button>
            </div>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className="hidden"></div>
      );
    }
  }

  const spanStyle = {
    padding: '20px',
    background: '#efefef',
    color: '#000000'
  }

  const divStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundSize: 'cover',
    height: '350px'
  }

  if (rsl > 0 && (parseInt(currentSlide, 10) > 0)) {
    return (
      <div className="justify-center">
        <RoomSlide />
      </div>
    );
  } else {
    return (
      <div className="hidden"></div>
    );
  }
}
