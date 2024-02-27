import React, {useState} from 'react';
import {use} from 'use-minimal-state';
import {colors, isDark} from '../lib/theme';
import {useJamState} from '../jam-core-react/JamContext';
import {useJam, useApiQuery} from '../jam-core-react';
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import { Alert, CCarousel, CCarouselItem, CCarouselCaption, CImage } from '@coreui/react';
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

  const [
    state,
    {
      updateRoom,
    },
  ] = useJam();
  let [iModerate, room, myId, roomId] = use(state, ['iAmModerator', 'room','myId','roomId']);
  let submitUpdate = async partialRoom => {
    updateRoom(roomId, {...room, ...partialRoom});
  };

  const rsl = roomSlides?.length ?? 0;

  const textColor = isDark(colors.avatarBg)
    ? colors.text.light
    : colors.text.dark;

  const iconColor = isDark(colors.avatarBg)
    ? colors.icons.light
    : colors.icons.dark;

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
          <img src={slideUrl} style={{maxHeight: '320px', maxWidth: '800px', margin: 'auto'}} />
          )}
          {(isVideo || isIFrame) && (
          <p>
          This slide cannot be shown at this time. Resource: {slideUrl}
          </p>
          )}
          <div className="flex justify-center items-center" style={{color: textColor, backgroundColor: colors.avatarBg}}>
            {iModerate && (
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
            )}
            <div className="text-sm" style={{width: '360px', color: textColor, backgroundColor: colors.avatarBg}}>
            {slideText}
            </div>
            {iModerate && (
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

  function DoAsSlides() {
    return (
      <>
        <Slide indicators={true} autoplay={false}>
        {roomSlides && roomSlides.length > 0 ? (
          roomSlides.map((slide,index) => {
            let slideNumber = 1 + index;
            let slideUrl = slide[0];
            let slideText = slide[1];
            return (
              <div style={{ ...divStyle, 'backgroundImage': `url(${slideUrl})` }}>
                <span style={spanStyle}>{slideText}</span>
              </div>
            );
          })
        ) : null}
        </Slide>
      </>
    );
  }

  function DoAsCarousel() {
    return (
      <>
        <CCarousel controls indicators>
        {roomSlides && roomSlides.length > 0 ? (
          roomSlides.map((slide,index) => {
            let slideNumber = 1 + index;
            let slideUrl = slide[0];
            let slideText = slide[1];
            return (
              <CCarouselItem>
                <CImage className="d-block w-100" src={slideUrl} alt={slideText} height="320" />
              </CCarouselItem>
            );
          })
        ) : null}
        </CCarousel>
      </>
    );
  }

  if (rsl > 0 && (parseInt(currentSlide, 10) > 0)) {
    return (
      <div className="flex justify-center my-2 mx-4">
        <RoomSlide />
      </div>
    );
  } else {
    return (
      <div className="flex justify-center my-2 mx-4 hidden"></div>
    );
  }
}
