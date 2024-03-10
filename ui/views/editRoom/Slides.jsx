import React, {useState} from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';

export function Slides({
  iOwn,
  roomSlides,
  setRoomSlides,
  textColor,
  roomColor,
}) {
  let mqp = useMqParser();
  let [expanded, setExpanded] = useState(false);
  let [slideURI, setSlideURI] = useState('');
  let [slideText, setSlideText] = useState('');

  function RoomSlides() {
    let activeSlide = -1;
    if (roomSlides.length === 0) {
      return (
        <div>
          <p className="text-sm text-gray-500 p-2">
            There are no slides set up.
          </p>
        </div>
      );
    }
    function removeSlide(indexSlide) {
      let result = confirm('Are you sure you want to remove this slide?');
      if (result != true) {
        return;
      }
      let newRoomSlides = roomSlides.filter((slide, index) =>
        index != indexSlide ? slide : null
      );
      setRoomSlides(newRoomSlides);
    }
    function swapSlides(indexSlide, indexSlide2) {
      let newRoomSlides = roomSlides;
      let swapSlide = newRoomSlides[indexSlide];
      newRoomSlides[indexSlide] = newRoomSlides[indexSlide2];
      newRoomSlides[indexSlide2] = swapSlide;
      setRoomSlides([...newRoomSlides]);
    }
    function promoteSlide(indexSlide) {
      let indexSlide2 = indexSlide - 1;
      if (indexSlide2 >= 0) {
        swapSlides(indexSlide, indexSlide2);
      }
    }
    function demoteSlide(indexSlide) {
      let indexSlide2 = indexSlide + 1;
      if (indexSlide2 < roomSlides.length) {
        swapSlides(indexSlide, indexSlide2);
      }
    }
    return (
      <>
        {roomSlides.map((slide, index) => {
          let slideURI = slide[0];
          let slideText = slide[1];
          return (
            <div className="flex w-full justify-between my-3">
              <div style={{width: '400px'}}>
                {' '}
                <img
                  className="h-48"
                  alt={slideText}
                  src={slideURI}
                />
                <p className="text-xs text-gray-500" style={{overflowWrap: 'anywhere'}}>{slideText}</p>
              </div>
              <div className="flex w-full justify-end" style={{width: '100px'}}>
                <div onClick={() => promoteSlide(index)} className="cursor-pointer">
                  ⬆️
                </div>
                <div onClick={() => demoteSlide(index)} className="cursor-pointer">
                  ⬇️
                </div>
                <div onClick={() => removeSlide(index)} className="cursor-pointer">
                  🗑️
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div>
      <p className="text-lg font-medium text-gray-500 cursor-pointer" onClick={() => setExpanded(!expanded)}>
      {expanded ? '🔽' : '▶️'} Manage Slides
      </p>
      <div className={expanded ? '' : 'hidden'}>
      <div className="mb-2">
        <p className="text-sm font-medium text-gray-500 p-2">
          Add a slide to the end of the list:
        </p>
        <div className="flex">
          <input
            className={mqp(
              'rounded placeholder-gray-400 bg-gray-50 w-full mx-1 md:w-full'
            )}
            type="text"
            placeholder="Caption for this image"
            value={slideText}
            autoComplete="off"
            style={{
              borderWidth: '0px',
              fontSize: '15px',
            }}
            onChange={e => {
              setSlideText(e.target.value);
            }}
          ></input>
          <input
            className={mqp(
              'rounded placeholder-gray-400 bg-gray-50 w-full mx-1 md:w-full'
            )}
            type="text"
            placeholder="Image URI for this slide"
            value={slideURI}
            autoComplete="off"
            style={{
              borderWidth: '0px',
              fontSize: '15px',
            }}
            onChange={e => {
              setSlideURI(e.target.value);
            }}
          ></input>
          <button
            className="px-5 h-12 text-sm rounded-md"
            style={{
              color: textColor,
              backgroundColor: roomColor.buttons.primary,
            }}
            onClick={() => {
              setRoomSlides([...roomSlides, [slideURI, slideText]]);
              setSlideURI('');
              setSlideText('');
            }}
          >
            Add slide
          </button>
        </div>
        <div className="bg-gray-200 py-2 px-0 my-5 rounded-lg">
          <RoomSlides />
        </div>
      </div>
      </div>
    </div>
  );
}
