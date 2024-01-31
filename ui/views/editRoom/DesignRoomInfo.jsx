import React, {useState} from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';
import {RgbaColorPicker} from 'react-colorful';

export function DesignRoomInfo({
  backgroundURI,
  setBackgroundURI,
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
}) {
  let mqp = useMqParser();

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

  function PaletteColor() {
    return (
      <>
        {paletteColors.map((colorPalette, index) => {
          const colorThemeName = colorPalette[0];
          return (
            <div
              className={
                color === colorThemeName
                  ? 'border-2 m-2 pb-2 rounded-lg border-blue-500'
                  : 'cursor-pointer border-2 m-2 pb-2 rounded-lg hover:border-blue-500'
              }
              onClick={() => setColor(colorThemeName)}
              onMouseLeave={() => hideTooltip(index)}
            >
              <div className="mx-2 my-2 h-20 flex flex-col justify-between">
                <div>{colorThemeName}</div>
                <div class="flex">
                  <div
                    onMouseEnter={() => displayTooltip(index, 'Background')}
                    className="w-1/5 p-4"
                    style={{backgroundColor: colorPalette[1].background}}
                  ></div>

                  <div
                    className="w-1/5 p-4"
                    onMouseEnter={() =>
                      displayTooltip(index, 'Panel background')
                    }
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
                    <p class="text-center text-xs">{colorType}</p>
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

      <p className="text-lg font-medium text-gray-500 px-2">
        Designer Settings
      </p>

      <p className="text-sm font-medium text-gray-500 p-2">
        Background Image URI:
      </p>
      <input
        className={mqp(
          'rounded-lg placeholder-gray-400 bg-gray-100 border-4 m-2 pb-2 rounded-lg w-full md:w-96'
        )}
        type="text"
        placeholder="Background Image URI"
        value={backgroundURI}
        name="room background image URI"
        style={{
          fontSize: '15px',
        }}
        onChange={e => {
          setBackgroundURI(e.target.value);
        }}
      ></input>

      <div className="my-2">
        <span class="flex items-center text-sm font-medium text-gray-500 p-2">
          Choose a Color Theme:  <b>{color}</b>
        </span>
        <div className="flex flex-wrap justify-between">
          <PaletteColor />
        </div>

        { color === 'customColor' && (
        <div className="text-sm">
        <p className="text-sm font-medium text-gray-500 p-2">
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
              className="mx-1.5 cursor-pointer flex flex-col items-center"
              onClick={() => {
                setColorPickerBg(!colorPickerBg);
                setColorPickerAvatar(false);
                setColorPickerButton(false);
              }}
            >
              <div
                className="w-8 h-8 rounded-full"
                style={{
                  backgroundColor: styleBg,
                }}
              ></div>
              <span className="text-xs">Background / Alternate</span>
            </div>
            <div
              className="mx-1.5 cursor-pointer flex flex-col items-center"
              onClick={() => {
                setColorPickerAvatar(!colorPickerAvatar);
                setColorPickerBg(false);
                setColorPickerButton(false);
              }}
            >
              <div
                className="w-8 h-8 rounded-full"
                style={{backgroundColor: styleAvatar}}
              ></div>
              <span className="text-xs">Panel background</span>
            </div>
            <div
              className="mx-1.5 cursor-pointer flex flex-col items-center"
              onClick={() => {
                setColorPickerButton(!colorPickerButton);
                setColorPickerBg(false);
                setColorPickerAvatar(false);
              }}
            >
              <div
                className="w-8 h-8 rounded-full"
                style={{backgroundColor: styleButtons}}
              ></div>
              <span className="text-xs">Buttons</span>
            </div>
          </div>
        </div>
        </div>
        )}

      </div>
    </div>
  );
}
