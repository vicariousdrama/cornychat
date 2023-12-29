import React, {useState} from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import {isDark} from '../lib/theme';
import {useJamState} from '../jam-core-react/JamContext';
import {MicOnSvg, Links, Audience} from './Svg';

export default function RoomHeader({
  colors,
  name,
  description,
  logoURI,
  roomLinks,
  showLinks,
  setShowLinks,
  audience,
  closed,
}) {
  let [isRecording, isPodcasting] = useJamState([
    'isSomeoneRecording',
    'isSomeonePodcasting',
  ]);

  const [displayDescription, setDisplayDescription] = useState(false);

  isRecording = isRecording || isPodcasting;

  const textColor = isDark(colors.avatarBg)
    ? colors.text.light
    : colors.text.dark;

  const iconColor = isDark(colors.avatarBg)
    ? colors.icons.light
    : colors.icons.dark;

  function linkSubstring(text) {
    return text.substring(0, 40);
  }

  function RoomLinks() {
    return (
      <div
        className="absolute mt-56 z-10 w-72 h-40 overflow-y-scroll p-3 rounded-lg"
        style={{backgroundColor: colors.avatarBg}}
      >
        {!roomLinks || roomLinks.length === 0 ? (
          <p className="text-xs" style={{color: textColor}}>
            This room has no Links
          </p>
        ) : (
          roomLinks.map(links => {
            return (
              <div className="mb-2">
                <a href={links[1]} target="_blank">
                  <p className="text-xs" style={{color: textColor}}>
                    {linkSubstring(links[0])}
                  </p>
                  <p className="text-xs opacity-60" style={{color: textColor}}>
                    {linkSubstring(links[1])}
                  </p>
                </a>
              </div>
            );
          })
        )}
      </div>
    );
  }

  function RoomDescription() {
    return (
      <div
        className="markdown"
        style={{backgroundColor: colors.avatarBg, color: textColor}}
      >
        <ReactMarkdown
          className="text-sm opacity-70 h-full mt-3"
          plugins={[gfm]}
          transformLinkUri={customUriTransformer}
        >
          {description || 'This room has not set up a description yet.'}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="flex justify-between w-full py-0 px-0 items-center">
      <div className="flex">
        {logoURI && (
          <div className="flex-none">
            <img
              alt={'room icon'}
              className="w-8 h-8 border rounded p-1 m-2 mt-0"
              src={logoURI}
              style={{objectFit: 'cover'}}
            />
          </div>
        )}
        <div>
          {' '}
          <div
            className="flex flex-wrap px-0 py-0 rounded-lg"
            style={{backgroundColor: colors.avatarBg}}
          >
            <p className="text-sm mr-2" style={{color: textColor}}>
              {name.substring(0, 25)} |
            </p>

            {displayDescription ? (
              <div
                style={{color: textColor}}
                className="text-sm opacity-70 cursor-pointer"
                onClick={() => setDisplayDescription(!displayDescription)}
              >
                Description ↑
              </div>
            ) : (
              <div className="flex">
                <div
                  style={{color: textColor}}
                  className="text-sm opacity-70 cursor-pointer flex"
                  onClick={async () => {
                    setDisplayDescription(!displayDescription);
                  }}
                >
                  Description ↓
                </div>
              </div>
            )}
          </div>{' '}
          {displayDescription ? <RoomDescription /> : null}
        </div>
      </div>
      <div className="items-center flex justify-end">
        <div
          className="flex rounded-lg m-auto px-2 py-2 mx-1.5 justify-between cursor-pointer align-center text-sm"
          style={{
            color : isDark(colors.avatarBg) ? colors.text.light : colors.text.dark,
            backgroundColor: colors.avatarBg
          }}
          onClick={() => setShowLinks(!showLinks)}
        >
          <Links color={iconColor} />
          <div className="px-1">{!roomLinks || roomLinks.length === 0 ? '0' : roomLinks.length}</div>
        </div>
        {showLinks ? <RoomLinks /> : null}
        <div
          className="flex rounded-lg m-auto px-2 py-2 mx-1.5 justify-between align-center text-sm"
          style={{
            color: isDark(colors.buttons.primary)
              ? colors.text.light
              : colors.text.dark,
            backgroundColor: colors.buttons.primary,
          }}
        >
          <Audience
            color={
              isDark(colors.buttons.primary)
                ? colors.icons.light
                : colors.icons.dark
            }
          />
          <div className="px-1">{audience}</div>
        </div>
        {isRecording && (
          <div aria-label="Recording" className="flex items-center w-8 h-6">
            <MicOnSvg className="h-5" stroke="#f80000" />
          </div>
        )}
        {closed ? (
          <div className={'text-sm mr-2'} style={{color: textColor}}>
            Room is closed
          </div>
        ) : null}
      </div>
    </div>
  );
}

function customUriTransformer(uri) {
  const schemes = ['bitcoin:', 'ethereum:'];
  for (const scheme of schemes) {
    if (uri.startsWith(scheme)) {
      return uri;
    }
  }
  return ReactMarkdown.uriTransformer(uri);
}
