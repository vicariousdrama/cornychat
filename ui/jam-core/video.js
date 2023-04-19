import {use} from '../lib/state-tree';
import Camera from './video/Camera';
import ScreenShare from './video/ScreenShare.js';

export {VideoState};

function VideoState() {
  return function VideoState({inRoom, iAmPresenter, remoteStreams}) {
    let shouldHaveCam = !!(inRoom && iAmPresenter);

    let camResult = use(Camera, {
      shouldHaveCam,
    });

    let screenResult = use(ScreenShare, {
      shouldHaveCam,
    });

    let {cameraOn, camStream, hasCamFailed} = camResult;
    let {screenStream, hasScreenFailed} = screenResult;

    const remoteVideoStreams = remoteStreams.filter(
      stream => stream.name === 'video'
    );

    const remoteScreenStreams = remoteStreams.filter(
      stream => stream.name === 'screen'
    );
    return {
      cameraOn,
      myVideo: camStream,
      myScreen: screenStream,
      hasScreenFailed,
      hasCamFailed,
      remoteVideoStreams,
      remoteScreenStreams,
    };
  };
}
