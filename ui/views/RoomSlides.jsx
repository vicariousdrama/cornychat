import React from 'react';
import {use} from 'use-minimal-state';
import {isDark} from '../lib/theme';
import {useJam} from '../jam-core-react';
import 'react-slideshow-image/dist/styles.css';
import '@coreui/coreui/dist/css/coreui.min.css';
import {Previous, Next} from './Svg';

export default function RoomSlides({
  colors,
  roomSlides,
  currentSlide,
  slideTime,
  showCaption,
  iAmAdmin,
}) {
  const [state, {updateRoom}] = useJam();
  let [iOwn, iModerate, room, roomId] = use(state, [
    'iAmOwner',
    'iAmModerator',
    'room',
    'roomId',
  ]);
  let submitUpdate = async partialRoom => {
    updateRoom(roomId, {...room, ...partialRoom});
  };

  const rsl = roomSlides?.length ?? 0;

  const textColor = isDark(colors.avatarBg)
    ? colors.text.light
    : colors.text.dark;
  //const iconColor = isDark(colors.avatarBg) ? colors.icons.dark : colors.icons.light;
  const iconColor = isDark(colors.buttons.primary)
    ? colors.text.light
    : colors.text.dark;

  const videoTypes = ['.mp4', '.webm', '.ogg'];
  const imageTypes = ['.bmp', '.gif', 'jpg', 'jpeg', '.png', '.svg', '.webp'];

  function NewRoomSlide() {
    // just controls
    let sn = parseInt(currentSlide, 10) - 1;
    let controlTop = String(Math.floor(window.innerHeight / 4) * -1) + 'px';
    if (sn < 0) {
      sn = 0;
    }
    if (isNaN(sn)) {
      sn = -2;
    }
    if (
      roomSlides &&
      sn > -1 &&
      sn < rsl &&
      rsl > 1 &&
      Math.floor(slideTime ?? '0') == 0 &&
      (iOwn || iModerate || iAmAdmin)
    ) {
      return (
        <div
          className="mb-2"
          style={{color: textColor, backgroundColor: colors.avatarBg}}
        >
          <div
            className="flex"
            style={{color: textColor, backgroundColor: colors.avatarBg}}
          >
            <div
              id="slidePreviousContainer"
              className="flex-none"
              style={{
                position: 'absolute',
                top: controlTop,
                left: '0px',
                zIndex: '20',
              }}
            >
              <button
                id="slidePrevious"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                onClick={async () => {
                  currentSlide -= 1;
                  if (currentSlide < 1) {
                    currentSlide = rsl;
                  }
                  await submitUpdate({currentSlide});
                }}
                style={{backgroundColor: colors.buttons.primary}}
              >
                <Previous color={iconColor} />
              </button>
            </div>
            <div
              id="slideNextContainer"
              className="flex-none"
              style={{
                position: 'absolute',
                top: controlTop,
                right: '0px',
                zIndex: '20',
              }}
            >
              <button
                id="slideNext"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                onClick={async () => {
                  currentSlide += 1;
                  if (currentSlide > rsl) {
                    currentSlide = 1;
                  }
                  await submitUpdate({currentSlide});
                }}
                style={{backgroundColor: colors.buttons.primary}}
              >
                <Next color={iconColor} />
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      return <div className="hidden"></div>;
    }
  }

  // new render method
  if (rsl > 0 && parseInt(currentSlide, 10) > 0) {
    let sn = parseInt(currentSlide, 10) - 1;
    if (sn < 0) {
      sn = 0;
    }
    if (isNaN(sn)) {
      sn = -2;
    }
    if (roomSlides && sn > -1 && sn < rsl) {
      let slideUrl = roomSlides[sn][0];
      let slideText = roomSlides[sn][1];
      setSlide(slideUrl, slideText, sn, rsl, showCaption);
      if (window.intervalForSlidesTime != undefined) {
        if (Math.floor(slideTime ?? '0') != window.intervalForSlidesTime) {
          window.intervalForSlidesTime = undefined;
          if (window.intervalForSlides != undefined) {
            clearInterval(window.intervalForSlides);
          }
        }
      }
      if (Math.floor(slideTime ?? '0') > 0) {
        window.intervalForSlidesTime = slideTime;
        if (window.intervalForSlides != undefined) {
          clearInterval(window.intervalForSlides);
        }
        window.intervalForSlides = setInterval(() => {
          sn = sn + 1;
          if (sn >= rsl) sn = 0;
          let slideUrl = roomSlides[sn][0];
          let slideText = roomSlides[sn][1];
          setSlide(slideUrl, slideText, sn, rsl, showCaption);
        }, Math.floor(slideTime ?? '0') * 1000);
      }
      return (
        <div key={currentSlide} className="justify-center">
          <NewRoomSlide />
        </div>
      );
    }
  } else {
    setSlide('', '', 0, 0);
  }
  return null;
}
