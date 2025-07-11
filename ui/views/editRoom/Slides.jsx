import React, {useState} from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';
import {ExportSlidesModal} from './ExportSlides';
import {ImportSlidesModal} from './ImportSlides';
import {openModal} from '../Modal';
import {Trash, LoadingIcon} from '../Svg';
import {handleFileUpload} from '../../lib/fileupload.js';

export function Slides({
  iOwn,
  roomId,
  roomSlides,
  setRoomSlides,
  slideTime,
  setSlideTime,
  currentSlide,
  setCurrentSlide,
  showCaption,
  setShowCaption,
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
  let [slideInsertionStyle, setSlideInsertionStyle] = useState('end');

  const videoTypes = ['.mp4', '.webm', '.ogg'];
  const imageTypes = ['.bmp', '.gif', 'jpg', 'jpeg', '.png', '.svg', '.webp'];

  // Upload images
  let showUploadFile =
    (localStorage.getItem(`fileUpload.auth`) ?? 'false') == 'true' &&
    window.nostr;
  let uploadSlideFile = async e => {
    e.preventDefault();
    let buttonObject = document.getElementById('buttonUploadSlide');
    let fileObject = document.getElementById('fileUploadSlide');
    let textObject = document.getElementById('fileUploadingSlide');
    buttonObject.style.display = 'none';
    fileObject.style.display = 'none';
    textObject.style.display = 'inline';
    let urls = await handleFileUpload(fileUploadSlide);
    if (urls.length > 0) {
      setSlideURI(urls[0]);
    }
    textObject.style.display = 'none';
    fileObject.style.display = 'inline';
    buttonObject.style.display = 'inline';
  };

  function removeSlide(indexSlide) {
    let result = confirm('Are you sure you want to remove this slide?');
    if (result != true) return;
    let newRoomSlides = roomSlides.filter((slide, index) =>
      index != indexSlide ? slide : null
    );
    if (currentSlide > 0 && currentSlide > indexSlide)
      setCurrentSlide(currentSlide - 1);
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
    editingSlideIndex = indexSlide;
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
  let slideNumber = 0;
  return (
    <div>
      <p
        className="text-lg font-medium text-gray-200 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '🔽' : '▶️'} Manage Slides
      </p>
      <div className={expanded ? '' : 'hidden'}>
        <div className="mb-2">
          <div className="p-2 text-gray-200 bold">
            Auto Slide Advancement: <br />
            <select
              name="autoSlideAdvance"
              defaultValue={slideTime}
              onChange={e => {
                setSlideTime(e.target.value);
              }}
              className={'border mt-3 ml-2 p-2 bg-gray-300 text-black rounded'}
            >
              <option key="0" value="0">
                Disabled - Use Manual Slide Navigation
              </option>
              <option key="15" value="15">
                15 Seconds
              </option>
              <option key="30" value="30">
                30 Seconds
              </option>
              <option key="60" value="60">
                1 Minute
              </option>
              <option key="120" value="120">
                2 Minutes
              </option>
              <option key="180" value="180">
                3 Minutes
              </option>
              <option key="300" value="15">
                5 Minutes
              </option>
            </select>
          </div>
          <div className="p-2 text-gray-200 bold">
            <input
              className="rounded placeholder-gray-500 bg-gray-300 text-black w-8"
              type="checkbox"
              checked={showCaption == 'true' ? true : false}
              onChange={e => {
                setShowCaption(e.target.checked ? 'true' : 'false');
              }}
            />
            Show Slide Caption Bar
          </div>
          <div className="flex justify-between">
            <button
              className="px-5 text-sm rounded-md"
              style={{
                color:
                  roomSlides.length > 0 ? textColor : `rgba(244,244,244,1)`,
                backgroundColor:
                  roomSlides.length > 0
                    ? roomColor.buttons.primary
                    : `rgba(192,192,192,1)`,
              }}
              onClick={() => {
                if (roomSlides.length == 0) return;
                let result = confirm(
                  'Are you sure you want to clear all slides?'
                );
                if (result != true) return;
                setRoomSlides([]);
                setCurrentSlide(0);
              }}
            >
              Clear all slides
            </button>
            {window.nostr ? (
              <>
                <button
                  className="px-5 text-sm rounded-md"
                  style={{
                    color: textColor,
                    backgroundColor: roomColor.buttons.primary,
                  }}
                  onClick={() => {
                    openModal(ImportSlidesModal, {
                      textColor: textColor,
                      roomColor: roomColor,
                      roomSlides: roomSlides,
                      setRoomSlides: setRoomSlides,
                    });
                    return;
                  }}
                >
                  Import Slides
                </button>
                <button
                  className="px-5 text-sm rounded-md"
                  style={{
                    color:
                      roomSlides.length > 0 ? textColor : `rgba(244,244,244,1)`,
                    backgroundColor:
                      roomSlides.length > 0
                        ? roomColor.buttons.primary
                        : `rgba(192,192,192,1)`,
                  }}
                  onClick={() => {
                    if (roomSlides.length > 0) {
                      close();
                      openModal(ExportSlidesModal, {
                        roomId: roomId,
                        textColor: textColor,
                        roomColor: roomColor,
                        roomSlides: roomSlides,
                      });
                    }
                    return;
                  }}
                >
                  Export Slides
                </button>
              </>
            ) : (
              <div className="mx-2 text-sm rounded-md border-2 border-gray-300 w-full text-center text-gray-200">
                Use a nostr extension for import/export capability
              </div>
            )}
          </div>
          {editingSlideIndex == -1 && (
            <>
              <p className="text-sm font-medium text-gray-300 p-2">
                Add a slide to the{' '}
                <select
                  name="slideInsertionStyle"
                  defaultValue={slideInsertionStyle}
                  onChange={e => {
                    setSlideInsertionStyle(e.target.value);
                  }}
                  className={'border mt-3 ml-2 p-2 text-black rounded'}
                >
                  <option key="sis_top" value="top">
                    top
                  </option>
                  <option key="sis_end" value="end">
                    end
                  </option>
                </select>{' '}
                of the list:
              </p>
              {showUploadFile && (
                <>
                  <div className="flex justify-between">
                    <input
                      type="file"
                      name="uploadSlide"
                      id="fileUploadSlide"
                      accept="image/*"
                      className="w-full"
                      style={{
                        fontSize: '10pt',
                        margin: '0px',
                        marginLeft: '4px',
                        padding: '2px',
                      }}
                    />
                  </div>
                  <div>
                    <button
                      id="buttonUploadSlide"
                      className="px-5 text-md rounded-md"
                      style={{
                        color: textColor,
                        backgroundColor: roomColor.buttons.primary,
                      }}
                      onClick={async e => {
                        uploadSlideFile(e);
                      }}
                    >
                      Upload
                    </button>
                  </div>
                  <div
                    id="fileUploadingSlide"
                    style={{display: 'none', fontSize: '10pt'}}
                  >
                    <LoadingIcon /> uploading file
                  </div>
                </>
              )}
              <div className="flex">
                <input
                  className={mqp(
                    'rounded placeholder-gray-500 bg-gray-300 text-black w-full mx-1 md:w-full'
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
              </div>
              <div className="flex">
                <input
                  className={mqp(
                    'rounded placeholder-gray-500 bg-gray-300 text-black w-full mx-1 md:w-full'
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
              </div>
              <div className="flex">
                <button
                  className="px-5 text-sm rounded-md"
                  style={{
                    color: textColor,
                    backgroundColor: roomColor.buttons.primary,
                  }}
                  onClick={e => {
                    e.preventDefault();
                    if (slideInsertionStyle == 'end') {
                      setRoomSlides([...roomSlides, [slideURI, slideText]]);
                    } else {
                      setRoomSlides([[slideURI, slideText], ...roomSlides]);
                    }
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
            {roomSlides.length == 0 ? (
              <div>
                <p className="text-sm text-gray-300 p-2">
                  There are no slides set up.
                </p>
              </div>
            ) : (
              <>
                {roomSlides.map((slide, index) => {
                  let roomslideskey = `roomslideskey_${index}`;
                  let slideURI = slide[0];
                  let slideText = slide[1];
                  slideNumber += 1;
                  let isImage = false;
                  let isVideo = false;
                  let isIFrame = false;
                  let videoType = '';
                  for (let vt of videoTypes) {
                    if (slideURI.toLowerCase().endsWith(vt)) {
                      videoType = vt.replace('.', 'video/');
                      isVideo = true;
                    }
                  }
                  for (let imt of imageTypes) {
                    if (slideURI.toLowerCase().endsWith(imt)) isImage = true;
                  }
                  isIFrame = !(isVideo || isImage);

                  return (
                    <div
                      key={roomslideskey}
                      className="flex w-full justify-between my-3"
                      style={{borderBottom: '1px solid rgb(55,65,81)'}}
                    >
                      <div style={{width: '400px'}}>
                        {editingSlideIndex != index && (
                          <>
                            {isImage && (
                              <img
                                className="h-48"
                                alt={slideText}
                                src={slideURI}
                              />
                            )}
                            {isVideo && (
                              <video className="h-48">
                                <source
                                  src={slideURI}
                                  type={videoType}
                                ></source>
                              </video>
                            )}
                            {isIFrame && (
                              <p
                                className="text-xs text-gray-600"
                                style={{overflowWrap: 'anywhere'}}
                              >
                                Resource to load in iFrame: {slideURI}
                              </p>
                            )}
                            <p
                              className="text-xs text-gray-600"
                              style={{overflowWrap: 'anywhere'}}
                            >
                              {slideText}
                            </p>
                          </>
                        )}
                        {editingSlideIndex == index && (
                          <>
                            <input
                              key="inputEditingSlideText"
                              className={mqp(
                                'rounded placeholder-black bg-gray-400 text-black w-full m-4 md:w-full'
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
                                'rounded placeholder-black bg-gray-400 text-black w-full m-4 md:w-full'
                              )}
                              type="text"
                              placeholder={jamConfig.urls.jam}
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
                      <div
                        className="flex w-full justify-end"
                        style={{width: '100px', position: 'relative'}}
                      >
                        <table>
                          <tbody>
                            <tr>
                              <td>
                                {editingSlideIndex == -1 && (
                                  <>
                                    <div
                                      onClick={() => editSlide(index)}
                                      className="cursor-pointer text-xl m-2"
                                    >
                                      📝
                                    </div>
                                    <div
                                      onClick={() => promoteSlide(index)}
                                      className="cursor-pointer text-xl m-2"
                                    >
                                      ⬆️
                                    </div>
                                    <div
                                      onClick={() => demoteSlide(index)}
                                      className="cursor-pointer text-xl m-2"
                                    >
                                      ⬇️
                                    </div>
                                    <div
                                      onClick={() => removeSlide(index)}
                                      className="cursor-pointer text-xl m-2"
                                    >
                                      <Trash />
                                    </div>
                                  </>
                                )}
                                {editingSlideIndex == index && (
                                  <>
                                    <div
                                      onClick={() => saveSlide(index)}
                                      className="cursor-pointer text-xl m-2"
                                    >
                                      💾
                                    </div>
                                    <div
                                      onClick={() => cancelSlide()}
                                      className="cursor-pointer text-xl m-2"
                                    >
                                      ❌
                                    </div>
                                  </>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <div
                                  className="text-gray-700"
                                  style={{marginTop: '32px'}}
                                >
                                  slide {slideNumber}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
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
