import React, {useState} from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';
import {RgbaColorPicker} from 'react-colorful';
import {handleFileUpload} from '../../lib/fileupload.js';
import {LoadingIcon} from '../Svg.jsx';

export function DesignRoomInfo({
  iOwn,
  backgroundURI,
  setBackgroundURI,
  backgroundRepeat,     // repeat, no-repeat
  setBackgroundRepeat,
  backgroundSize,       // auto, contain, cover, 100% auto
  setBackgroundSize,
  paletteColors,
  color,
  setColor,
  colorPickerBg,
  colorPickerAvatar,
  colorPickerButton,
  setColorPickerBg,
  setColorPickerAvatar,
  setColorPickerButton,
  customBg,
  setCustomBg,
  customAvatar,
  setCustomAvatar,
  customButtons,
  setCustomButtons,
  styleBg,
  styleAvatar,
  styleButtons,
  tooltipStates,
  setTooltipStates,
  textColor,
  roomColor,
}) {
  let mqp = useMqParser();
  let [expanded, setExpanded] = useState(false);
  let [colorType, setColorType] = useState('');

  function displayTooltip(index, colorType) {
    setTooltipStates(prevStates =>
      prevStates.map((state, i) => (i === index ? true : state))
    );
    setColorType(colorType);
  }

  function hideTooltip(index) {
    setTooltipStates(prevStates =>
      prevStates.map((state, i) => (i === index ? false : state))
    );
    setColorType('');
  }

  let showUploadFile = ((localStorage.getItem(`fileUpload.auth`) ?? 'false') == 'true') && window.nostr;
  let uploadBackgroundFile = async e => {
    e.preventDefault();
    let buttonObject = document.getElementById('buttonUploadBackground');
    let fileObject = document.getElementById('fileUploadBackground');
    let textObject = document.getElementById('fileUploadingBackground');
    buttonObject.style.display = 'none';
    fileObject.style.display = 'none';
    textObject.style.display = 'inline';
    let urls = await handleFileUpload(fileUploadBackground);
    if (urls.length > 0) {
      setBackgroundURI(urls[0]);
    }
    textObject.style.display = 'none';
    fileObject.style.display = 'inline';
    buttonObject.style.display = 'inline';
  }

  function PaletteColor() {
    return (
      <>
        {paletteColors.map((colorPalette, index) => {
          const colorThemeName = colorPalette[0];
          let palettekey = `palettekey_${index}`;
          return (
            <div
              key={palettekey}
              className={
                color === colorThemeName
                  ? 'border-4 m-2 pb-2 rounded-lg border-blue-500'
                  : 'cursor-pointer border-2 m-2 pb-2 rounded-lg hover:border-blue-500'
              }
              onClick={() => setColor(colorThemeName)}
              onMouseLeave={() => hideTooltip(index)}
            >
              <div className="mx-2 my-2 h-20 flex flex-col justify-between">
                <div>{colorThemeName}</div>
                <div className="flex">
                  <div
                    className="w-1/5 p-4"
                    onMouseEnter={() => displayTooltip(index, 'Background')}
                    style={{backgroundColor: colorPalette[1].background}}
                  ></div>

                  <div
                    className="w-1/5 p-4"
                    onMouseEnter={() => displayTooltip(index, 'Panel background')}
                    style={{backgroundColor: colorPalette[1].avatarBg}}
                  ></div>

                  <div
                    className="w-1/5 p-4"
                    onMouseEnter={() => displayTooltip(index, 'Buttons')}
                    style={{backgroundColor: colorPalette[1].buttons.primary}}
                  ></div>
                </div>
                <div>
                  {tooltipStates[index] ? (
                    <p className="text-center text-xs">{colorType}</p>
                  ) : null}
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

      <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpanded(!expanded)}>
      {expanded ? '🔽' : '▶️'} Designer Settings
      </p>
      <div className={expanded ? '' : 'hidden'}>
      <div className="text-sm font-medium text-gray-300">
          Background URI
        </div>
      <div className="flex justify-between">
        <img
          className="w-full h-full"
          src={backgroundURI}
        />
      </div>
      {iOwn && (
        <>
      <div className="flex justify-between">
        <input
          className="rounded placeholder-gray-500 bg-gray-300 text-black w-full"
          type="text"
          placeholder=""
          value={backgroundURI ?? ''}
          name="backgroundURI"
          onChange={e => {
            setBackgroundURI(e.target.value);
          }}
        />
      </div>
      {showUploadFile && (
        <>
      <div className="flex justify-between">
        <input type="file" name="uploadBackgroundFile" id="fileUploadBackground" accept="image/*" 
          className="w-full"
          style={{
            fontSize: '10pt',
            margin: '0px',
            marginLeft: '4px',
            padding: '2px'
          }} 
        />
      </div>
      <div>
        <button 
          id="buttonUploadBackground"
          className="px-5 text-md rounded-md" 
          style={{
              color: textColor,
              backgroundColor: roomColor.buttons.primary,
          }}
          onClick={async(e) => {uploadBackgroundFile(e);}}
        >Upload</button>
      </div>
      <div id="fileUploadingBackground" style={{display: 'none', fontSize: '10pt', }}><LoadingIcon /> uploading file</div>
      </>
      )}
      </>
      )}

      <p className="text-sm font-medium text-gray-300">
        Repeat Background: {!iOwn && (backgroundRepeat == 'repeat' ? 'Yes' : 'No')}
      </p>
      {iOwn && (
      <select
        name="backgroundRepeat"
        defaultValue={(backgroundRepeat)}
        onChange={e => {
          setBackgroundRepeat(e.target.value);
        }}
        className={'border mt-3 ml-2 p-2 bg-gray-300 text-black rounded'}
      >
        <option key="backgroundRepeatYes" value="repeat">Yes</option>
        <option key="backgroundRepeatNo" value="no-repeat">No</option>
      </select> 
      )}

      <p className="text-sm font-medium text-gray-300">
        Background Size Style: {!iOwn && (backgroundSize)}
      </p>
      {iOwn && (
      <select
        name="backgroundSize"
        defaultValue={backgroundSize}
        onChange={e => {
          setBackgroundSize(e.target.value);
        }}
        className={'border mt-3 ml-2 p-2 bg-gray-300 text-black rounded'}
      >
        <option key="backgroundSizeAuto" value="auto">auto</option>
        <option key="backgroundSizeContain" value="cover">contain</option>
        <option key="backgroundSizeCover" value="cover">cover</option>
        <option key="backgroundSizeAuto100" value="100% auto">100% auto</option>
      </select> 
      )}

      {iOwn ? (
      <div className="my-2">
        <span className="flex items-center text-sm font-medium text-gray-300">
          Choose a Color Theme:  <b>{color}</b>
        </span>
        <div className="flex flex-wrap justify-between">
          <PaletteColor />
        </div>

        { color === 'customColor' && (
        <div className="text-sm">
        <p className="text-sm font-medium text-gray-300 p-2">
          Choose your custom colors:
        </p>
        {colorPickerBg ? (
          <div className="w-full">
            <RgbaColorPicker
              color={customBg}
              onChange={setCustomBg}
              style={{width: '100%'}}
            />
          </div>
        ) : null}
        {colorPickerAvatar ? (
          <div>
            <RgbaColorPicker
              color={customAvatar}
              onChange={setCustomAvatar}
              style={{width: '100%'}}
            />
          </div>
        ) : null}
        {colorPickerButton ? (
          <div>
            <RgbaColorPicker
              color={customButtons}
              onChange={setCustomButtons}
              style={{width: '100%'}}
            />
          </div>
        ) : null}
        <div className="mt-3">
          <div className="flex flex-wrap justify-between mt-3">
            <div
              className={'mx-1.5 cursor-pointer flex m-2 pb-2 rounded-lg ' + (colorPickerBg ? 'border-4 border-blue-500' : 'border-2 hover:border-blue-500')}
              onClick={() => {
                setColorPickerAvatar(false);
                setColorPickerBg(true);
                setColorPickerButton(false);
              }}
            >
              <div
                className="w-8 h-8 rounded-full"
                style={{backgroundColor: styleBg}}
              ></div>
              <div className="flex text-xs">Background / Alternate</div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex flex-wrap justify-between mt-3">
            <div
              className={'mx-1.5 cursor-pointer flex m-2 pb-2 rounded-lg ' + (colorPickerAvatar ? 'border-4 border-blue-500' : 'border-2 hover:border-blue-500')}
              onClick={() => {
                setColorPickerAvatar(true);
                setColorPickerBg(false);
                setColorPickerButton(false);
              }}
            >
              <div
                className="w-8 h-8 rounded-full"
                style={{backgroundColor: styleAvatar}}
              ></div>
              <div className="flex text-xs">Panel background</div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex flex-wrap justify-between mt-3">
            <div
              className={'mx-1.5 cursor-pointer flex m-2 pb-2 rounded-lg ' + (colorPickerButton ? 'border-4 border-blue-500' : 'border-2 hover:border-blue-500')}
              onClick={() => {
                setColorPickerAvatar(false);
                setColorPickerBg(false);
                setColorPickerButton(true);
              }}
            >
              <div
                className="w-8 h-8 rounded-full"
                style={{backgroundColor: styleButtons}}
              ></div>
              <div className="flex text-xs">Buttons</div>
            </div>
          </div>
        </div>
        </div>
        )}
      </div>
      ) : (
      <div className="my-2">
        <span className="flex items-center text-sm font-medium text-gray-300">
          Color Theme:  <b>{color}</b>
        </span>
      </div>
      )}
      </div>
    </div>
  );
}
