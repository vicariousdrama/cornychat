import React, {useState} from 'react';
import {Modal} from '../Modal';
import {useJam, useApiQuery} from '../../jam-core-react';
import {colorThemes, isDark} from '../../lib/theme';
import {BasicRoomInfo} from './BasicRoomInfo';
import {DesignRoomInfo} from './DesignRoomInfo';
import {UserList} from './UserList';
import {Links} from './Links';
import {Slides} from './Slides';
import {CustomEmojis} from './CustomEmojis';
import {Schedule} from './Schedule';
import {getCustomColor, getRgbaObj, getColorPallete} from './utils';
import {use} from 'use-minimal-state';

export function EditRoomModal({roomId, iOwn, room, roomColor, close}) {
  const [state, api] = useJam();
  const {
    addModerator,
    addOwner,
    addSpeaker,
    removeModerator,
    removeOwner,
    removeSpeaker,
    updateRoom
  } = api;
  let submitUpdate = async partialRoom => {
    return updateRoom(roomId, {...room, ...partialRoom});
  };
  const textColor = isDark(roomColor.buttons.primary) ? roomColor.text.light : roomColor.text.dark;
  let [myId, myIdentity] = use(state, ['myId', 'myIdentity']);
  let [myAdminStatus] = useApiQuery(`/admin/${myId}`, {fetchOnMount: true});
  let iAdmin = myAdminStatus?.admin || false;
  const info = myIdentity?.info;
  const nostrIdentity = info?.identities?.find(i => i.type === 'nostr');
  const nostrNpub = nostrIdentity?.id ?? '';
  let [name, setName] = useState(room.name || '');
  let [description, setDescription] = useState(room.description || '');
  let [color, setColor] = useState(room?.color ?? 'default');
  let [logoURI, setLogoURI] = useState(room.logoURI || '');
  let [lud16, setLud16] = useState(room.lud16 || '');
  let [backgroundURI, setBackgroundURI] = useState(room.backgroundURI || '');
  let [roomLinks, setRoomLinks] = useState(room.roomLinks || []);
  let [owners, setOwners] = useState(room.owners || []);
  let [ownersDeleting, setOwnersDeleting] = useState([]);
  let [moderators, setModerators] = useState(room.moderators || []);
  let [moderatorsDeleting, setModeratorsDeleting] = useState([]);
  let [speakers, setSpeakers] = useState(room.speakers || []);
  let [speakersDeleting, setSpeakersDeleting] = useState([]);
  let [closed, setClosed] = useState(room.closed || false);
  let [isPrivate, setIsPrivate] = useState(room.isPrivate || false);
  let [isRecordingAllowed, setIsRecordingAllowed] = useState(room.isRecordingAllowed || false);
  let [stageOnly, setStageOnly] = useState(room.stageOnly || false);
  let [customEmojis, setCustomEmojis] = useState(room.customEmojis);
  let [roomSlides, setRoomSlides] = useState(room.roomSlides || []);
  let [colorPickerBg, setColorPickerBg] = useState(false);
  let [colorPickerAvatar, setColorPickerAvatar] = useState(false);
  let [colorPickerButton, setColorPickerButton] = useState(false);
  let [customBg, setCustomBg] = useState(
    getRgbaObj(room.customColor?.background ?? 'rbga(255,255,255,1)')
  );
  let [customAvatar, setCustomAvatar] = useState(
    getRgbaObj(room.customColor?.avatarBg ?? 'rgba(21,21,192,1)')
  );
  let [customButtons, setCustomButtons] = useState(
    getRgbaObj(room.customColor?.buttons.primary ?? 'rgba(192,192,21,1)')
  );
  let styleBg = `rgba(${customBg.r},${customBg.g},${customBg.b},${customBg.a})`;
  let styleAvatar = `rgba(${customAvatar.r},${customAvatar.g},${customAvatar.b},${customAvatar.a})`;
  let styleButtons = `rgba(${customButtons.r},${customButtons.g},${customButtons.b},${customButtons.a})`;
  let customColor = getCustomColor(styleBg, styleAvatar, styleButtons);
  let paletteColors = getColorPallete({
    ...colorThemes,
    customColor,
  });
  const [tooltipStates, setTooltipStates] = useState(
    paletteColors?.map(() => false) ?? false
  );
  let [schedule, setSchedule] = useState(room.schedule);

  function decodeHTMLEncoded(v) {
    let o = v;
    let goagain = false;
    while (o.indexOf("&amp;") > -1) {
      o = o.replaceAll("&amp;", "&");
      goagain = true;
    }
    while (o.indexOf("&#38;") > -1) {
      o = o.replaceAll("&#38;", "&");
      goagain = true;
    }
    while (o.indexOf("&lt;") > -1) {
      o = o.replaceAll("&lt;", "<");
      goagain = true;
    }
    while (o.indexOf("&#60;") > -1) {
      o = o.replaceAll("&#60;", "<");
      goagain = true;
    }
    while (o.indexOf("&gt;") > -1) {
      o = o.replaceAll("&gt;", ">");
      goagain = true;
    }
    while (o.indexOf("&#62;") > -1) {
      o = o.replaceAll("&#62;", ">");
      goagain = true;
    }
    while (o.indexOf("&apos;") > -1) {
      o = o.replaceAll("&apos;", "'");
      goagain = true;
    }
    while (o.indexOf("&#39;") > -1) {
      o = o.replaceAll("&#39;", "'");
      goagain = true;
    }
    while (o.indexOf("&quot;") > -1) {
      o = o.replaceAll("&quot;", "\"");
      goagain = true;
    }
    while (o.indexOf("&#38;") > -1) {
      o = o.replaceAll("&#38;", "\"");
      goagain = true;
    }
    if (goagain) {
      return decodeHTMLEncoded(o);
    }
    return o;
  }

  let submit = async e => {
    e.preventDefault();

    name          = decodeHTMLEncoded(name);
    description   = decodeHTMLEncoded(description);
    logoURI       = decodeHTMLEncoded(logoURI);
    backgroundURI = decodeHTMLEncoded(backgroundURI);
    let decodedRoomLinks = [];
    for (let roomLink of roomLinks) {
      roomLink[0] = decodeHTMLEncoded(roomLink[0]);
      roomLink[1] = decodeHTMLEncoded(roomLink[1]);
      decodedRoomLinks.push(roomLink);
    }
    roomLinks = decodedRoomLinks;
    let decodedRoomSlides = [];
    for (let roomSlide of roomSlides) {
      roomSlide[0] = decodeHTMLEncoded(roomSlide[0]);
      roomSlide[1] = decodeHTMLEncoded(roomSlide[1]);
      decodedRoomSlides.push(roomSlide);
    }
    roomSlides = decodedRoomSlides;

    let removeDeleted = false;
    if (removeDeleted) {
      if (iOwn || iAdmin) {
        ownersDeleting.forEach(jamId => {
          removeOwner(roomId, jamId);
        })
        moderatorsDeleting.forEach(jamId => {
          removeModerator(roomId, jamId);
        })
      }
      speakersDeleting.forEach(jamId => {
        removeSpeaker(roomId, jamId);
      })
    }

    let ok = await submitUpdate({
      name,
      description,
      color,
      customColor,
      logoURI,
      backgroundURI,
      roomLinks,
      customEmojis,
      closed,
      isPrivate,
      isRecordingAllowed,
      stageOnly,
      moderators,
      speakers,
      roomSlides,
      schedule,
      lud16,
    });
    if (!ok) {
      alert('An error occurred. Your changes were not saved. If another owner or moderator was making changes you will need to close and reopen the setttings to make your changes.');
    } else {
      close();
    }
  };

  return (
    <Modal close={close}>
      <h1>Room Settings</h1>

      {(iOwn || iAdmin) && (
      <div className="p-4 py-2 bg-gray-400 rounded-lg my-3 text-md">
        As a room owner you can modify all settings. Moderators that you set may only modify links and slides, speakers, schedule next event, and close or open the room.
      </div>
      )}

      {!(iOwn || iAdmin) && (
      <div className="p-4 py-2 bg-gray-400 rounded-lg my-3 text-md">
        As a room moderator you can manage speakers, view the room settings, make changes to the links and slides, schedule the next event, and close or open the room.
      </div>
      )}

      <div className="px-4 py-2 bg-gray-100 rounded-lg my-3">
        <BasicRoomInfo
          iOwn={iOwn}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          logoURI={logoURI}
          setLogoURI={setLogoURI}
          closed={closed}
          setClosed={setClosed}
          isPrivate={isPrivate}
          setIsPrivate={setIsPrivate}
          isRecordingAllowed={isRecordingAllowed}
          setIsRecordingAllowed={setIsRecordingAllowed}
          stageOnly={stageOnly}
          setStageOnly={setStageOnly}
          lud16={lud16}
          setLud16={setLud16}
        />
      </div>

      <div className="px-4 py-2 bg-gray-100 rounded-lg my-3">
        <DesignRoomInfo
          iOwn={iOwn}
          backgroundURI={backgroundURI}
          setBackgroundURI={setBackgroundURI}
          paletteColors={paletteColors}
          color={color}
          setColor={setColor}
          colorPickerBg={colorPickerBg}
          colorPickerAvatar={colorPickerAvatar}
          colorPickerButton={colorPickerButton}
          setColorPickerBg={setColorPickerBg}
          setColorPickerAvatar={setColorPickerAvatar}
          setColorPickerButton={setColorPickerButton}
          customBg={customBg}
          setCustomBg={setCustomBg}
          customAvatar={customAvatar}
          setCustomAvatar={setCustomAvatar}
          customButtons={customButtons}
          setCustomButtons={setCustomButtons}
          styleBg={styleBg}
          styleAvatar={styleAvatar}
          styleButtons={styleButtons}
          tooltipStates={tooltipStates}
          setTooltipStates={setTooltipStates}
        />
      </div>

      <div className="px-4 py-2 bg-gray-100 rounded-lg my-3">
        <Links
          iOwn={iOwn}
          roomId={roomId}
          roomLinks={roomLinks}
          setRoomLinks={setRoomLinks}
          textColor={textColor}
          roomColor={roomColor}
        />
      </div>

      <div className="px-4 py-2 bg-gray-100 rounded-lg my-3">
        <Slides
          iOwn={iOwn}
          roomId={roomId}
          roomSlides={roomSlides}
          setRoomSlides={setRoomSlides}
          textColor={textColor}
          roomColor={roomColor}
        />
      </div>

      <div className="px-4 py-2 bg-gray-100 rounded-lg my-3">
        <CustomEmojis
          iOwn={iOwn}
          customEmojis={customEmojis}
          setCustomEmojis={setCustomEmojis}
          textColor={textColor}
          roomColor={roomColor}
        />
      </div>

      <div className="px-4 py-2 bg-gray-100 rounded-lg my-3">
        <UserList
          allowDelete={iOwn}
          room={room}
          roomId={roomId}
          userlist={owners}
          setUserlist={setOwners}
          userDeleteList={ownersDeleting}
          setUserDeletelist={setOwnersDeleting}
          label={'Owners'}
        />
      </div>

      <div className="px-4 py-2 bg-gray-100 rounded-lg my-3">
        <UserList
          allowDelete={iOwn}
          room={room}
          roomId={roomId}
          userlist={moderators}
          setUserlist={setModerators}
          userDeleteList={moderatorsDeleting}
          setUserDeletelist={setModeratorsDeleting}
          label={'Moderators'}
        />
      </div>

      <div className="px-4 py-2 bg-gray-100 rounded-lg my-3">
        <UserList
          allowDelete={true}
          room={room}
          roomId={roomId}
          userlist={speakers}
          setUserlist={setSpeakers}
          userDeleteList={speakersDeleting}
          setUserDeletelist={setSpeakersDeleting}
          label={'Speakers'}
        />
      </div>

      <div className="px-4 py-2 bg-gray-100 rounded-lg my-3">
        <Schedule
          myId={myId}
          nostrNpub={nostrNpub}
          iOwn={iOwn}
          name={name}
          description={description}
          schedule={schedule}
          setSchedule={setSchedule}
          textColor={textColor}
          roomColor={roomColor}
        />
      </div>      

      <div className="px-4 py-2 rounded-lg my-3">
        <div style={{
            bottom: '72px', zIndex: '5', backgroundColor: roomColor.avatarBg
          }}>
          <div className="flex p-4">
            <div className="flex flex-grow">
              <button
                onClick={submit}
                className="flex-grow h-12 px-4 text-md rounded-lg mr-2"
                style={{
                  color: textColor,
                  backgroundColor: roomColor.buttons.primary,
                }}
              >
                Update Room
              </button>
            </div>
            <div className="flex">
              <button
                onClick={close}
                className="h-12 px-4 text-md text-black bg-gray-100 rounded-lg focus:shadow-outline active:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        <div className="h-28"></div>
      </div>     

    </Modal>
  );
}
