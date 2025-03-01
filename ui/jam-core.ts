import {is, set, on, update, until} from 'minimal-state';
import {debugStateTree, declareStateRoot} from './lib/state-tree';
import {debug} from './lib/state-utils';

import {displayName} from './lib/avatar';

import {updateInfo} from './jam-core/identity';
import {
  defaultState,
  actions,
  defaultProps,
  IdentityInfo,
  StateType,
  RoomType,
  Props,
  ActionType,
} from './jam-core/state';
import {
  addModerator,
  addOwner,
  addPresenter,
  addSpeaker,
  removeModerator,
  removeOwner,
  removePresenter,
  removeSelfFromRoom,
  removeSpeaker,
  setCurrentSlide,
} from './jam-core/room';
import {staticConfig} from './jam-core/config';
import {
  populateApiCache,
  createRoom,
  updateRoom,
  getRoom,
  apiUrl,
  recordingsDownloadLink,
  getGifs,
  getMOTD,
  getRoomList,
  getPermanentRoomsList,
  getScheduledEvents,
  getStaticRoomsList,
  getStaticEventsList,
  getMyRoomList,
  getRoomATag,
} from './jam-core/backend';
import {
  getZapGoal,
  ZapGoal
} from './nostr/zapgoal';
import {
  addAdmin, 
  addPermanentRoom,
  deleteOldRooms,
  removeAdmin, 
  removePermanentRoom,
  setMOTD,
} from './jam-core/admin';
import AppState from './jam-core/AppState';

/* THE JAM API */

export {createJam}; // main API
export {is, set, on, update, until}; // helper functions
export {importRoomIdentity, importDefaultIdentity} from './jam-core/identity';

// types, internal stuff for jam-core-react
export {
  StateType,
  RoomType,
  IdentityInfo,
  ActionType,
  Props,
  defaultState,
  createApi,
  apiUrl,
};

function createApi<T extends StateType>(
  state: T,
  dispatch: (type: ActionType, payload?: unknown) => Promise<void>,
  setProps: {
    <K extends keyof Props>(key: K, value: Props[K]): Promise<void>;
    (state: Partial<Props>): Promise<void>;
  }
) {
  return {
    setProps,
    setState: (<L extends keyof T>(
      keyOrValue: L | Partial<T>,
      value?: T[L]
    ) => {
      (is as any)(state, keyOrValue, value);
    }) as {
      <L extends keyof T>(key: L, value: T[L]): void;
      (state: Partial<T>): void;
    },
    onState: ((keyOrListener, listenerOrNone) => {
      return on(state, keyOrListener, listenerOrNone);
    }) as {
      (
        key: keyof T | undefined,
        listener: (...args: unknown[]) => void
      ): () => void;
    },
    // create room with the own identity as the only moderator and speaker
    createRoom: (roomId: string, partialRoom?: Partial<RoomType>) =>
      createRoom(state, roomId, partialRoom as any) as Promise<boolean>,

    getMOTD:  () => getMOTD(),
    setMOTD: (motd: string) =>
      setMOTD(state, motd) as Promise<boolean>,
    getRoom: (roomId: string) =>
      (getRoom(roomId) as unknown) as Promise<RoomType | undefined>,
    getRoomATag: (roomId: string) =>
      (getRoomATag(roomId) as unknown) as Promise<String | undefined>,
    getDisplayName: (info: IdentityInfo, room: RoomType) =>
      displayName(info, room) as string,
    getZapGoal: (roomId: string) =>
      (getZapGoal(roomId) as unknown) as Promise<ZapGoal | undefined>,

    addAdmin: (peerId: string) =>
      addAdmin(state, peerId) as Promise<boolean>,
    addModerator: (roomId: string, peerId: string) =>
      addModerator(state, roomId, peerId) as Promise<boolean>,
    addOwner: (roomId: string, peerId: string) =>
      addOwner(state, roomId, peerId) as Promise<boolean>,
    addPermanentRoom: (roomId: string) =>
      addPermanentRoom(state, roomId) as Promise<boolean>,
    addPresenter: (roomId: string, peerId: string) =>
      addPresenter(state, roomId, peerId) as Promise<boolean>,
    addSpeaker: (roomId: string, peerId: string) =>
      addSpeaker(state, roomId, peerId) as Promise<boolean>,

    removeAdmin: (peerId: string) =>
      removeAdmin(state, peerId) as Promise<boolean>,
    removeModerator: (roomId: string, peerId: string) =>
      removeModerator(state, roomId, peerId) as Promise<boolean>,
    removeOwner: (roomId: string, peerId: string) =>
      removeOwner(state, roomId, peerId) as Promise<boolean>,
    removePermanentRoom: (roomId: string) =>
      removePermanentRoom(state, roomId) as Promise<boolean>,
    removePresenter: (roomId: string, peerId: string) =>
      removePresenter(state, roomId, peerId) as Promise<boolean>,
    removeSpeaker: (roomId: string, peerId: string) =>
      removeSpeaker(state, roomId, peerId) as Promise<boolean>,
    removeSelfFromRoom: (roomId: string, userId: string) =>
      removeSelfFromRoom(state, roomId, userId) as Promise<boolean>,

    updateInfo: (info: IdentityInfo) => updateInfo(state, info),
    // completely replaces the room, rejects if moderator/speaker array is not set
    // only possible for moderators
    updateRoom: (roomId: string, room: RoomType) =>
      updateRoom(state, roomId, room) as Promise<boolean>,

    deleteOldRooms: () => deleteOldRooms(state),
    listRooms: () => getRoomList(),
    listScheduledEvents: () => getScheduledEvents(),
    listGifs: (phrase: string, cursor: string) => getGifs(phrase, cursor),
    listMyRooms: (userId: string) => getMyRoomList(userId),
    listPermanentRooms: () => getPermanentRoomsList(),
    listStaticRooms: () => getStaticRoomsList(),
    listStaticEvents: () => getStaticEventsList(),
    enterRoom: (roomId: string) => dispatch(actions.JOIN, roomId),
    leaveRoom: () => dispatch(actions.JOIN, null),
    leaveStage: () => dispatch(actions.LEAVE_STAGE),
    sendReaction: (reaction: string) => dispatch(actions.REACTION, reaction),
    sendTextChat: (textchat: string, peerId: string) => dispatch(actions.TEXT_CHAT, {textchat:textchat, peerId:peerId}),
    sendCSAR: (csar: string) => dispatch(actions.CSAR, {csar:csar}),
    retryMic: () => dispatch(actions.RETRY_MIC),
    retryAudio: () => dispatch(actions.RETRY_AUDIO),
    autoJoinOnce: () => dispatch(actions.AUTO_JOIN),

    switchCamera: () => dispatch(actions.SWITCH_CAM),
    setCameraOn: (cameraOn: boolean) => dispatch(actions.SET_CAM_ON, cameraOn),

    selectMicrophone: (mic: InputDeviceInfo) =>
      dispatch(actions.SELECT_MIC, mic),

    startScreenShare: () => dispatch(actions.START_SCREEN_SHARE),
    stopScreenShare: () => dispatch(actions.STOP_SCREEN_SHARE),

    startRecording: () => dispatch('start-recording'),
    stopRecording: () => dispatch('stop-recording'),
    getRecordingsDownloadLink: (roomId: string) => recordingsDownloadLink(state, roomId),

    startServerRecording: () => dispatch(actions.START_SERVER_RECORDING),
    stopServerRecording: () => dispatch(actions.STOP_SERVER_RECORDING),

    downloadRecording: (fileName?: string) =>
      dispatch('download-recording', fileName),

    startPodcastRecording: () => dispatch('start-podcast-recording'),
    stopPodcastRecording: () => dispatch('stop-podcast-recording'),

    backchannelSubscribe: (roomId, topic, handler, subscriptionId) =>
      dispatch(actions.BACKCHANNEL_SUBSCRIBE, {
        roomId,
        topic,
        handler,
        subscriptionId,
      }),
    backchannelUnsubscribe: subscriptionId =>
      dispatch(actions.BACKCHANNEL_UNSUBSCRIBE, subscriptionId),
    backchannelBroadcast: (roomId, topic, data) =>
      dispatch(actions.BACKCHANNEL_BROADCAST, {roomId, topic, data}),

    setCurrentSlide: (roomId: string, slideNumber: string) =>
      setCurrentSlide(state, roomId, slideNumber) as Promise<boolean>,

  };
}

function createJam(
  {jamConfig, initialProps, cachedRooms, debug: debug_ = false} = {} as {
    jamConfig?: Partial<typeof staticConfig> & {domain?: string};
    initialProps?: Partial<typeof defaultProps>;
    cachedRooms?: {[K in string]: RoomType};
    debug: boolean;
  }
) {
  // setup stuff
  if (jamConfig) {
    let {domain} = jamConfig;
    if (domain) {
      let jamConfigUrls: Partial<typeof staticConfig.urls> = jamConfig.urls ?? {
        turnCredentials: staticConfig.urls.turnCredentials,
      };
      jamConfigUrls.pantry =
        jamConfigUrls.pantry ?? `https://${domain}/_/pantry`;
      jamConfigUrls.stun = jamConfigUrls.stun ?? `stun:${domain}:3478`;
      jamConfigUrls.turn = jamConfigUrls.turn ?? `turn:${domain}:3478`;
      jamConfig.urls = jamConfigUrls as typeof staticConfig.urls;
      delete jamConfig.domain;
    }
    set(staticConfig, jamConfig);
  }
  if (cachedRooms) {
    for (let roomId in cachedRooms) {
      populateApiCache(`/rooms/${roomId}`, cachedRooms[roomId]);
    }
  }
  if (debug_ || jamConfig?.development) {
    if (debug_) (window as any).DEBUG = true;
    debugStateTree();
  }

  let props = {
    ...defaultProps,
    ...initialProps,
    hasMediasoup: !!staticConfig.sfu,
    hasBroadcast: !!staticConfig.broadcast,
  };
  const {state, dispatch, setProps} = declareStateRoot(AppState, props as any, {
    state: undefined,
    defaultState,
  }) as {
    state: StateType;
    dispatch: (type: ActionType, payload?: unknown) => Promise<void>;
    setProps: {
      <K extends keyof Props>(key: K, value: Props[K]): Promise<void>;
      (state: Partial<Props>): Promise<void>;
    };
  };
  const api = createApi(state, dispatch, setProps);

  if (debug_ || jamConfig?.development) {
    if (debug_) debug(state.swarm);
    (window as any).swarm = state.swarm;
    (window as any).state = state;
    (window as any).api = api;
    debug(state);
  }
  return [state, api] as const;
}
