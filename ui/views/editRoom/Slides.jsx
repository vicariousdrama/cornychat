import React, {useState} from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';
import {ExportSlidesModal} from './ExportSlides';
import {ImportSlidesModal} from './ImportSlides';
import {openModal} from '../Modal';

export function Slides({
  iOwn,
  roomId,
  roomSlides,
  setRoomSlides,
  textColor,
  roomColor,
}) {
  let mqp = useMqParser();
  let [expanded, setExpanded] = useState(false);
  let [slideURI, setSlideURI] = useState('');
  let [slideText, setSlideText] = useState('');
  let [editingSlideIndex, setEditingSlideIndex] = useState(-1);
  let [editingSlideURI, setEditingSlideURI] = useState('');
  let [editingSlideText, setEditingSlideText] = useState('');

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
  function editSlide(indexSlide) {
    editingSlideIndex = indexSlide
    editingSlideText = roomSlides[indexSlide][1];
    editingSlideURI = roomSlides[indexSlide][0];
    setEditingSlideIndex(editingSlideIndex);
    setEditingSlideText(editingSlideText);
    setEditingSlideURI(editingSlideURI);
  }
  function saveSlide(indexSlide) {
    roomSlides[indexSlide] = [editingSlideURI, editingSlideText];
    setRoomSlides(roomSlides);
    editingSlideIndex = -1;
    setEditingSlideIndex(editingSlideIndex);
  }
  function cancelSlide() {
    editingSlideIndex = -1;
    setEditingSlideIndex(editingSlideIndex);
    setRoomSlides(roomSlides);
  }

  return (
    <div>
      <p className="text-lg font-medium text-gray-500 cursor-pointer" onClick={() => setExpanded(!expanded)}>
      {expanded ? '🔽' : '▶️'} Manage Slides
      </p>
      <div className={expanded ? '' : 'hidden'}>
      <div className="mb-2">
        <div className="flex justify-between">
          <button
            className="px-5 h-12 text-sm rounded-md"
            style={{
              color: (roomSlides.length > 0) ? textColor : `rgba(244,244,244,1)`,
              backgroundColor: (roomSlides.length > 0) ? roomColor.buttons.primary : `rgba(192,192,192,1)`,
            }}
            onClick={() => {
              if (roomSlides.length == 0) return;
              let result = confirm('Are you sure you want to clear all slides?');
              if (result != true) return;
              setRoomSlides([]);
            }}
          >
            Clear all slides
          </button>
          {window.nostr ? (
          <>
          <button
            className="px-5 h-12 text-sm rounded-md"
            style={{
              color: textColor,
              backgroundColor: roomColor.buttons.primary,
            }}
            onClick={() => {
              openModal(ImportSlidesModal, {textColor: textColor, roomColor: roomColor, roomSlides: roomSlides, setRoomSlides: setRoomSlides});
              return;
            }}
          >
            Import Slides
          </button>
          <button
            className="px-5 h-12 text-sm rounded-md"
            style={{
              color: (roomSlides.length > 0) ? textColor : `rgba(244,244,244,1)`,
              backgroundColor: (roomSlides.length > 0) ? roomColor.buttons.primary : `rgba(192,192,192,1)`,
            }}
            onClick={() => {
              if (roomSlides.length > 0) {
                close();
                openModal(ExportSlidesModal, {roomId: roomId, textColor: textColor, roomColor: roomColor, roomSlides: roomSlides});
              }
              return;
            }}
          >
            Export Slides
          </button>
          </>
          ) : (
          <div className="h-12 mx-2 text-sm rounded-md border-2 border-gray-300 w-full">
            Use a nostr extension for import/export capability
          </div>
          )}
        </div>
        {(editingSlideIndex == -1) && (
          <>
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
        </>
        )}
        <div className="bg-gray-200 py-2 px-0 my-5 rounded-lg">
        {(roomSlides.length == 0) ? (
          <div>
            <p className="text-sm text-gray-500 p-2">
              There are no slides set up.
            </p>
          </div>
          ) : (
            <>
            {roomSlides.map((slide, index) => {
              let slideURI = slide[0];
              let slideText = slide[1];
              return (
                <div className="flex w-full justify-between my-3">
                  <div style={{width: '400px'}}>
                  {(editingSlideIndex != index) && (
                    <>
                    <img
                      className="h-48"
                      alt={slideText}
                      src={slideURI}
                    />
                    <p className="text-xs text-gray-500" style={{overflowWrap: 'anywhere'}}>{slideText}</p>
                    </>
                  )}
                    {(editingSlideIndex == index) && (
                    <>
                    <input
                      key="inputEditingSlideText"
                      className={mqp(
                        'rounded placeholder-gray-400 bg-gray-50 w-full m-4 md:w-full'
                      )}
                      type="text"
                      placeholder="Caption for the image"
                      value={editingSlideText}
                      autoComplete="off"
                      style={{
                        borderWidth: '0px',
                        fontSize: '15px',
                      }}
                      onChange={e => {
                        setEditingSlideText(e.target.value);
                      }}
                    ></input>
                    <input
                      key="inputEditingSlideURI"
                      className={mqp(
                        'rounded placeholder-gray-400 bg-gray-50 w-full m-4 md:w-full'
                      )}
                      type="text"
                      placeholder="http://cornychat.com"
                      value={editingSlideURI}
                      autoComplete="off"
                      style={{
                        borderWidth: '0px',
                        fontSize: '15px',
                      }}
                      onChange={e => {
                        setEditingSlideURI(e.target.value);
                      }}
                    ></input>                
                    </>
                    )}                  
                  </div>
                  <div className="flex w-full justify-end" style={{width: '100px'}}>
                    {(editingSlideIndex == -1) && (
                    <>
                    <div onClick={() => editSlide(index)} className="cursor-pointer text-xl">
                      📝
                    </div>
                    <div onClick={() => promoteSlide(index)} className="cursor-pointer text-xl">
                      ⬆️
                    </div>
                    <div onClick={() => demoteSlide(index)} className="cursor-pointer text-xl">
                      ⬇️
                    </div>
                    <div onClick={() => removeSlide(index)} className="cursor-pointer text-xl">
                      🗑️
                    </div>
                    </>
                    )}
                    {(editingSlideIndex == index) && (
                    <>
                    <div onClick={() => saveSlide(index)} className="cursor-pointer text-xl">
                      💾
                    </div>
                    <div onClick={() => cancelSlide()} className="cursor-pointer text-xl">
                      ❌
                    </div>
                    </>
                    )}
                  </div>
                </div>
              );
            })}
          </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
