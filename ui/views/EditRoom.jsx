import React, {useState, useMemo} from 'react';
import {useMqParser} from '../lib/tailwind-mqp';
import {Modal} from './Modal';
import {rawTimeZones} from '@vvo/tzdb';
import {useJam} from '../jam-core-react';
import {colorThemes, colors, isDark} from '../lib/theme';

export function EditRoomModal({roomId, room, roomColor, close}) {
  const [, {updateRoom}] = useJam();

  let submitUpdate = async partialRoom => {
    updateRoom(roomId, {...room, ...partialRoom});
  };

  let [name, setName] = useState(room.name || '');
  let [description, setDescription] = useState(room.description || '');
  let [color, setColor] = useState(room?.color ?? 'default');
  let [logoURI, setLogoURI] = useState(room.logoURI || '');
  let [backgroundURI, setBackgroundURI] = useState(room.backgroundURI || '');
  let [roomLinks, setRoomLinks] = useState(room.roomLinks || []);
  let [buttonURI, setButtonURI] = useState(room.buttonURI || '');
  let [buttonText, setButtonText] = useState(room.buttonText || '');
  let [closed, setClosed] = useState(room.closed || false);
  let [shareUrl, setShareUrl] = useState(room.shareUrl || '');

  let [schedule, setSchedule] = useState(room.schedule);
  let [scheduleCandidate, setScheduleCandidate] = useState({
    date: `${new Date().toISOString().split('T')[0]}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  let [showTimezoneSelect, setShowTimezoneSelect] = useState(false);
  let [showRepeatSelect, setShowRepeatSelect] = useState(false);

  let completeSchedule = () => {
    return scheduleCandidate?.date && scheduleCandidate?.time;
  };

  let handleScheduleChange = e => {
    setScheduleCandidate({
      ...scheduleCandidate,
      [e.target.name]: e.target.value,
    });
    console.log(scheduleCandidate);
  };

  let removeSchedule = e => {
    e.preventDefault();
    setSchedule(undefined);
    let schedule = undefined;

    submitUpdate({schedule});
  };

  let submitSchedule = e => {
    e.preventDefault();
    if (scheduleCandidate) {
      let schedule = scheduleCandidate;
      setSchedule(scheduleCandidate);
      submitUpdate({schedule});
    }
  };

  let submit = async e => {
    e.preventDefault();
    await submitUpdate({
      name,
      description,
      color,
      logoURI,
      backgroundURI,
      roomLinks,
      closed,
      shareUrl,
    });
    close();
  };

  function PaletteColor() {
    let paletteColors = [];
    for (const key in colorThemes) {
      paletteColors.push([key, colorThemes[key]]);
    }
    return (
      <>
        {paletteColors.map(color => {
          return (
            <div className="cursor-pointer" onClick={() => setColor(color[0])}>
              <p className="text-sm">{color[0]}</p>
              <div className="flex mx-1.5 my-1.5">
                <div
                  className="w-1/5 p-4"
                  style={{backgroundColor: color[1].background}}
                ></div>

                <div
                  className="w-1/5 p-4"
                  style={{backgroundColor: color[1].text.dark}}
                ></div>
                <div
                  className="w-1/5 p-4"
                  style={{backgroundColor: color[1].avatarBg}}
                ></div>
                <div
                  className="w-1/5 p-4"
                  style={{backgroundColor: color[1].buttons.primary}}
                ></div>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  function RoomLinks() {
    if (roomLinks.length === 0) {
      return (
        <div>
          <p>There are not links set up.</p>
        </div>
      );
    }

    function removeLink(indexLink) {
      let newRoomLinks = roomLinks.filter((link, index) =>
        index !== indexLink ? link : null
      );
      setRoomLinks(newRoomLinks);
    }

    return (
      <>
        {roomLinks.map((link, index) => {
          let linkText = link[1];
          let linkDescription = link[0];
          if (linkText.length > 25) linkText = linkText.substring(0, 40);

          return (
            <div className="flex w-full justify-between my-3">
              <div>
                {' '}
                <p className="text-sm text-black">{linkDescription}</p>
                <p className="text-xs text-gray-500">{linkText}</p>
              </div>
              <div onClick={() => removeLink(index)} className="cursor-pointer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-4 h-4"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke="red"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  const textColor = isDark(roomColor.buttons.primary)
    ? roomColor.text.light
    : roomColor.text.dark;

  const [showAdvanced, setShowAdvanced] = useState(
    !!(room.logoURI || room.color)
  );
  let mqp = useMqParser();

  return (
    <Modal close={close}>
      <h1>Room Settings</h1>
      <br />
      <div>
        <input
          className={mqp(
            'rounded placeholder-gray-300 bg-gray-50 w-full md:w-96'
          )}
          type="text"
          placeholder="Room topic"
          value={name}
          name="jam-room-topic"
          autoComplete="off"
          onChange={e => {
            setName(e.target.value);
          }}
        ></input>
        <br />
        <div className="p-2 text-gray-500 italic">
          Pick a topic to talk about.{' '}
          <span className="text-gray-400">(optional)</span>
        </div>
        <br />
        <textarea
          className={mqp(
            'rounded -mb-1 placeholder-gray-300 bg-gray-50 w-full md:w-full'
          )}
          placeholder="Room description"
          value={description}
          name="jam-room-description"
          autoComplete="off"
          rows="2"
          onChange={e => {
            setDescription(e.target.value);
          }}
        ></textarea>
        <div className="p-2 text-gray-500 italic">
          Describe what this room is about.{' '}
          <span className="text-gray-400">
            (optional) (supports{' '}
            <a
              className="underline"
              href="https://www.markdownguide.org/cheat-sheet/"
              target="_blank"
              rel="noreferrer"
            >
              Markdown
            </a>
            )
          </span>{' '}
        </div>

        {!showAdvanced && (
          <div className="p-2 text-gray-500 italic">
            <span onClick={() => setShowAdvanced(!showAdvanced)}>
              {/* heroicons/gift */}
              <svg
                style={{cursor: 'pointer'}}
                className="pb-1 h-5 w-5 inline-block"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </span>
          </div>
        )}

        {/* advanced Room options */}
        {showAdvanced && (
          <div>
            <br />
            <input
              className={mqp(
                'rounded placeholder-gray-300 bg-gray-50 w-full md:w-full'
              )}
              type="text"
              placeholder="Logo URI"
              value={logoURI}
              name="jam-room-logo-uri"
              autoComplete="off"
              onChange={e => {
                setLogoURI(e.target.value);
              }}
            ></input>
            <div className="p-2 text-gray-500 italic">
              Set the URI for your logo.{' '}
              <span className="text-gray-400">(optional)</span>
            </div>
            <br />
            <input
              className={mqp(
                'rounded placeholder-gray-300 bg-gray-50 w-full md:w-full'
              )}
              type="text"
              placeholder="Background Image URI"
              value={backgroundURI}
              name="room background image URI"
              onChange={e => {
                setBackgroundURI(e.target.value);
              }}
            ></input>
            <div className="p-2 text-gray-500 italic">
              Set the URI of an image for your room's background.{' '}
              <span className="text-gray-400">(optional)</span>
            </div>
            <br />
            <div className="flex flex-wrap">
              <PaletteColor />
            </div>

            <div className="p-2 text-gray-500 italic">
              Choose your room color theme. Your color theme is going to be:{' '}
              {color} <span className="text-gray-400">(optional)</span>
            </div>

            <br />
            <div className="flex">
              <input
                className={mqp(
                  'rounded placeholder-gray-400 bg-gray-50 w-full md:w-full'
                )}
                type="text"
                placeholder="Visit my website"
                name="jam-room-button-uri"
                value={buttonText}
                autoComplete="off"
                onChange={e => {
                  setButtonText(e.target.value);
                }}
              ></input>
              <input
                className={mqp(
                  'rounded placeholder-gray-400 bg-gray-50 w-full md:w-full'
                )}
                type="text"
                placeholder="http://google.com"
                name="jam-room-button-uri"
                value={buttonURI}
                autoComplete="off"
                onChange={e => {
                  setButtonURI(e.target.value);
                }}
              ></input>
              <button
                className="px-5 h-12 text-sm"
                style={{
                  color: textColor,
                  backgroundColor: roomColor.buttons.primary,
                }}
                onClick={() => {
                  setRoomLinks([[buttonText, buttonURI], ...roomLinks]);
                  setButtonURI('');
                  setButtonText('');
                }}
              >
                Add link
              </button>
            </div>

            <div className="p-2 text-gray-500 italic">
              Set the link for the {`'call to action'`} button.{' '}
              <span className="text-gray-400">(optional)</span>
            </div>

            <br />
            <div className="bg-gray-100 py-2 px-4 rounded-lg">
              <RoomLinks />
            </div>

            <br />

            <input
              className={mqp(
                'rounded placeholder-gray-400 bg-gray-50 w-full md:w-96'
              )}
              type="text"
              placeholder="Share URL"
              value={shareUrl}
              name="jam-room-share-url"
              autoComplete="off"
              onChange={e => {
                setShareUrl(e.target.value);
              }}
            ></input>
            <div className="p-2 text-gray-500 italic">
              The URL used for sharing the room.
              <span className="text-gray-400">(optional)</span>
            </div>

            <br />
            <hr />
            <br />
            <input
              className="ml-2"
              type="checkbox"
              name="jam-room-closed"
              id="jam-room-closed"
              onChange={() => {
                setClosed(!closed);
              }}
              defaultChecked={closed}
            />

            <label className="pl-3 ml-0.5" htmlFor="jam-room-closed">
              Close the room (experimental){' '}
              <div className="p-2 pl-9 text-gray-500">
                Closed rooms can only be joined by moderators.
                <br />
                Everyone else sees the description and the&nbsp;
                {`'call to action'`} button.
              </div>
            </label>
          </div>
        )}
        <div className="flex">
          <button
            onClick={submit}
            className="flex-grow mt-5 h-12 px-6 text-lg rounded-lg mr-2"
            style={{
              color: textColor,
              backgroundColor: roomColor.buttons.primary,
            }}
          >
            Update Room
          </button>
          <button
            onClick={close}
            className="mt-5 h-12 px-6 text-lg text-black bg-gray-100 rounded-lg focus:shadow-outline active:bg-gray-300"
          >
            Cancel
          </button>
        </div>

        <br />
        <hr />
        <br />

        <form>
          <div className="pb-1">🗓 Room Schedule (experimental)</div>
          <div className="pb-3 text-gray-500">
            Set the date and time for an upcoming event.
          </div>

          <div className={schedule ? 'hidden' : 'w-full'}>
            <div className="flex">
              <input
                type="date"
                className="flex-grow p-2 border rounded"
                name="date"
                placeholder="yyyy-mm-dd"
                min={`${
                  new Date(new Date() - 86400000).toISOString().split('T')[0]
                }`}
                value={
                  scheduleCandidate?.date ||
                  `${new Date().toISOString().split('T')[0]}`
                }
                onChange={handleScheduleChange}
              />
              <input
                type="time"
                className="flex-none ml-3 p-2 border rounded"
                name="time"
                placeholder="hh:mm"
                value={scheduleCandidate?.time || ''}
                onChange={handleScheduleChange}
              />
            </div>
            <div
              className={
                showTimezoneSelect ? 'hidden' : 'p-2 pt-4 text-gray-500'
              }
            >
              {scheduleCandidate.timezone}{' '}
              <span
                className="underline"
                onClick={() => setShowTimezoneSelect(true)}
              >
                change
              </span>
            </div>
            <select
              name="timezone"
              defaultValue={scheduleCandidate.timezone}
              onChange={handleScheduleChange}
              className={
                showTimezoneSelect ? 'w-full border mt-3 p-2 rounded' : 'hidden'
              }
            >
              {rawTimeZones.map(tz => {
                return (
                  <option key={tz.rawFormat} value={tz.name}>
                    {tz.rawFormat}
                  </option>
                );
              })}
            </select>

            <div className={showRepeatSelect ? 'hidden' : 'p-2 text-gray-500'}>
              <span
                className="underline"
                onClick={() => setShowRepeatSelect(true)}
              >
                repeat?
              </span>
            </div>
            <select
              name="repeat"
              defaultValue="never"
              onChange={handleScheduleChange}
              className={
                showRepeatSelect ? 'border mt-3 p-2 rounded' : 'hidden'
              }
            >
              {['never', 'weekly', 'monthly'].map(rep => {
                return (
                  <option key={rep} value={rep}>
                    {rep}
                  </option>
                );
              })}
            </select>
          </div>

          <div
            className={schedule ? 'rounded bg-gray-50 border w-full' : 'hidden'}
          >
            <div className="text-gray-500 p-3">
              {schedule?.date} at {schedule?.time}
              <br />
              {schedule?.timezone}
              <br />
              {schedule?.repeat == 'weekly' || schedule?.repeat == 'monthly'
                ? schedule?.repeat
                : ''}
            </div>
            <div className={schedule ? 'p-3 text-gray-500' : 'hidden'}>
              <span onClick={removeSchedule} className="underline">
                Remove schedule
              </span>
            </div>
          </div>

          <div className={!schedule && completeSchedule() ? 'flex' : 'hidden'}>
            <button
              onClick={submitSchedule}
              className="flex-grow mt-5 h-12 px-6 text-lg bg-gray-600 rounded-lg mr-2"
              style={{
                color: textColor,
                backgroundColor: roomColor.buttons.primary,
              }}
            >
              Set Schedule
            </button>
          </div>
        </form>

        <br />
        <hr />
        <br />
        <input
          className="rounded bg-gray-50 text-gray-400 w-full"
          defaultValue={`<iframe src="${window.location.href}" allow="microphone *;" width="420" height="600"></iframe>`}
        />
        <div className="p-2 text-gray-500 italic">
          Embed this room using an iFrame. (
          <a
            className="underline"
            href="https://gitlab.com/jam-systems/jam"
            target="_blank"
            rel="noreferrer"
          >
            Learn more
          </a>
          )
        </div>
      </div>
    </Modal>
  );
}
