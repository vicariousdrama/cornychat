import {Action} from '../lib/state-tree';
export {defaultProps, defaultState};
export {StateType, IdentityInfo, IdentityType, RoomType, ActionType, Props};

const defaultProps = {
  roomId: null as string | null,
  userInteracted: false,
  micMuted: true,
  handRaised: false,
  handType: '',
  autoJoin: false,
  hasMediasoup: false,
  hasBroadcast: false,
  customStream: null,
  passphraseHash: '',
};
type Props = typeof defaultProps;
type ActionType = string | {type: string};

type IdentityInfo = {
  id?: string;
  name?: string;
  avatar?: string;
  identities?: {type: string; id: string; verificationInfo: string}[];
};
type IdentityType = {
  publicKey: string;
  secretKey: string;
  info: IdentityInfo;
};

type AccessType = {
  identities?: string[];
  identitiesLocked?: boolean;
};

type CustomColor = {
  background: string;
  text: {
    light: string;
    dark: string;
  };
  buttons: {
    primary: string;
  };
  avatarBg: string;
  icons: {
    light: string;
    dark: string;
  };
};

type RoomType = {
  name: string;
  description?: string;
  speakers: string[];
  moderators: string[];
  presenters: string[];
  owners: string[];
  customColor: CustomColor;
  videoEnabled?: boolean;
  stageOnly?: boolean;
  videoCall?: boolean;
  isPrivate?: boolean;
  isProtected?: boolean;
  isRecordingAllowed?: boolean;
  color?: string;
  logoURI?: string;
  roomEmojis?: string[];
  backgroundURI?: string;
  access?: AccessType;
  broadcastRoom?: boolean;
  currentSlide?: number;
  passphraseHash?: string;
};
type PeerState = {
  inRoom: boolean;
  micMuted: boolean;
  leftStage: boolean;
  isRecording: boolean;
  camOn: boolean;
  shareScreen: boolean;  
  handRaised: boolean;
  handType: string;
  passphraseHash: string;
};

const defaultState = {
  myIdentity: null as IdentityType | null,
  myId: null as string | null,

  roomId: null as string | null,
  inRoom: null as string | null, // === roomId if user joined, null otherwise
  room: {
    name: '',
    description: '',
    speakers: [],
    moderators: [],
    presenters: [],
    owners: [],
    customColor: {
      background: `rgba(0,0,0,1)`,
      text: {
        light: '#f4f4f4',
        dark: '#111111',
      },
      buttons: {
        primary: `rgba(0,0,0,1)`,
      },
      avatarBg: `rgba(0,0,0,.5)`,
      icons: {
        light: '#f4f4f4',
        dark: '#111111',
      },
    },
    isPrivate: true,
    isProtected: false,
    isRecordingAllowed: false,
    passphraseHash: '',
  } as RoomType,
  hasRoom: false,
  isRoomLoading: false,
  iAmSpeaker: false,
  iAmModerator: false,
  iAmPresenter: false,
  iAmOwner: false,
  identities: {} as Record<string, IdentityInfo>,
  otherDeviceInRoom: false,

  swarm: null,
  peers: [] as string[],
  peerState: {} as Record<string, PeerState | undefined>,
  myPeerState: {
    inRoom: false,
    micMuted: true,
    leftStage: false,
    isRecording: false,
    handType: '',
    passphraseHash: '',
  },

  reactions: {},
  handRaised: false,
  handType: '',
  passphraseHash: '',

  soundMuted: true,
  micMuted: true,
  audioFile: null,
  audioFileElement: null,
  myAudio: null as MediaStream | null,
  availableMicrophones: [] as InputDeviceInfo[],
  myVideo: null as MediaStream | null,
  audioPlayError: false,
  hasMicFailed: false,

  speaking: new Set<string>(),

  isRecording: false, // am I recording?
  isSomeoneRecording: false, // is someone in the room recording?
  recordedAudio: null as Blob | null,

  isPodcasting: false,
  isSomeonePodcasting: false,
  podcastTracks: {} as Record<string, Blob>,

  camOn: false,
  shareScreen: false,
};

type StateType = typeof defaultState & {swarm: any};

export const actions = {
  JOIN: Action('join'),
  LEAVE_STAGE: Action('leave-stage'),
  RETRY_CAM: Action('retry-cam'),
  SWITCH_CAM: Action('switch-cam'),
  SET_CAM_ON: Action('set-cam-on'),
  RETRY_MIC: Action('retry-mic'),
  SELECT_MIC: Action('select-mic'),
  RETRY_AUDIO: Action('retry-audio'),
  REACTION: Action('reaction'),
  AUTO_JOIN: Action('auto-join'),
  START_SERVER_RECORDING: Action('start-server-recording'),
  STOP_SERVER_RECORDING: Action('stop-server-recording'),
  START_RECORDING: Action('start-recording'),
  STOP_RECORDING: Action('stop-recording'),
  START_PODCAST_RECORDING: Action('start-podcast-recording'),
  STOP_PODCAST_RECORDING: Action('stop-podcast-recording'),
  START_SCREEN_SHARE: Action('start-screen-share'),
  STOP_SCREEN_SHARE: Action('stop-screen-share'),
  BACKCHANNEL_SUBSCRIBE: Action('backchannel-subscribe'),
  BACKCHANNEL_UNSUBSCRIBE: Action('backchannel-unsubscribe'),
  BACKCHANNEL_BROADCAST: Action('backchannel-broadcast'),
  TEXT_CHAT: Action('text-chat'),
};
