import React, {useEffect, useMemo} from 'react';
import Modals from './views/Modal';
import {mergeClasses} from './lib/util';
import {useProvideWidth, WidthContext} from './lib/tailwind-mqp';
import {use} from 'use-minimal-state';
import Start from './views/Start';
import Me from './views/Me';
import PossibleRoom from './views/PossibleRoom';
import {declare, declareStateRoot} from './lib/state-tree';
import {ShowAudioPlayerToast} from './views/AudioPlayerToast';
import {JamProvider, useJam} from './jam-core-react';
import {createJam} from './jam-core';
import {ShowInteractionModal} from './views/InteractionModal';
import {parseUrlConfig} from './lib/url-utils';
import {colors} from './lib/theme.js';
import About from './views/About';

let urlConfig = parseUrlConfig(location.search, location.hash);

const [state, api] = createJam({
  jamConfig: window.jamConfig,
  initialProps: {roomId: window.existingRoomId ?? null},
  cachedRooms: window.existingRoomInfo && {
    [window.existingRoomId]: window.existingRoomInfo,
  },
  debug: !!urlConfig.debug,
});

declareStateRoot(ShowModals, null, {state});

export default function Jam(props) {
  return (
    <JamProvider state={state} api={api}>
      <JamUI {...props} />
    </JamProvider>
  );
}

function JamUI({style, className, route = null, dynamicConfig = {}, ...props}) {
  const [state, {setProps}] = useJam();

  const defaultRoom = window.jamConfig.defaultRoom || {};

  let roomId = null;

  // routing
  const View = (() => {
    switch (route) {
      case null:
        return <Start newRoom={{...defaultRoom, ...dynamicConfig.room}} />;
      case 'me':
        return <Me />;
      case 'about':
        return <About />;
      default:
        roomId = route;
        return (
          <PossibleRoom
            roomId={route}
            newRoom={dynamicConfig.room}
            autoCreate={!!dynamicConfig.ux?.autoCreate}
            roomIdentity={dynamicConfig.identity}
            roomIdentityKeys={dynamicConfig.keys}
            uxConfig={dynamicConfig.ux ?? emptyObject}
            onError={({error}) => (
              <Start
                urlRoomId={route}
                roomFromURIError={!!error.createRoom}
                newRoom={dynamicConfig.room}
              />
            )}
          />
        );
    }
  })();

  // set/unset room id
  useEffect(() => {
    let {autoJoin, autoRejoin, userInteracted} = dynamicConfig.ux ?? {};
    if (autoJoin !== undefined) {
      setProps('autoJoin', !!autoJoin);
    }
    if (autoRejoin !== undefined) {
      setProps('autoRejoin', !!autoRejoin);
    }
    if (userInteracted !== undefined) {
      setProps('userInteracted', !!userInteracted);
    }
    setProps('roomId', roomId);
  }, [roomId, dynamicConfig.ux, setProps]);

  // global styling
  // TODO: the color should depend on the loading state of GET /room, to not flash orange before being in the room
  // => color should be only set here if the route is not a room id, otherwise <PossibleRoom> should set it
  // => pass a setColor prop to PossibleRoom

  let colorTheme = use(state, 'room')?.color ?? 'default';
  let customColor = state.room.customColor;
  let roomColors = colors(colorTheme, customColor);
  let backgroundImg = state.room?.backgroundURI;
  let [width, , setContainer, mqp] = useProvideWidth();

  let backgroundRoom = useMemo(() => {
    if (backgroundImg && backgroundImg !== '') {
      return {
        position: 'relative',
        minHeight: '-webkit-fill-available',
        backgroundImage: `url(${backgroundImg})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '100% auto',
        ...(style || null),
      };
    }
    //    backgroundRepeat: 'repeat',   'no-repeat'
    //    backgroundSize: '100% auto',  'cover'

    return {
      position: 'relative',
      minHeight: '-webkit-fill-available',
      background: roomColors.background,
    };
  }, [colorTheme, backgroundImg, customColor]);

  return (
    <div
      ref={el => setContainer(el)}
      className={mqp(mergeClasses('jam', className), width)}
      style={backgroundRoom}
      {...props}
    >
      <WidthContext.Provider value={width}>
        {View}
        <Modals />
      </WidthContext.Provider>
    </div>
  );
}

const emptyObject = {};

function ShowModals() {
  declare(ShowAudioPlayerToast);
  declare(ShowInteractionModal);
}
