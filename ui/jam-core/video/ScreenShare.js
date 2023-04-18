import {actions} from '../state';
import {useUpdate, useAction, useUnmount} from '../../lib/state-tree';

export default function ScreenShare() {
  let screenState = 'initial'; // 'requesting', 'active', 'failed'
  let screenStream = null;
  const update = useUpdate();
  let sharingScreen = false;

  useUnmount(() => {
    screenStream?.getTracks().forEach(track => track.stop());
  });

  async function requestScreen() {
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia();
      screenState = 'active';
      screenStream.getVideoTracks()[0].addEventListener('ended', async () => {
        screenStream = null;
        sharingScreen = false;
        screenState = 'initial';
        await update();
      });
    } catch (err) {
      console.error('error getting cam', err);
      screenState = 'failed';
      screenStream = null;
    }
    await update();
  }

  return function ScreenShare({canShareScreen = true}) {
    let [startScreenShare] = useAction(actions.START_SCREEN_SHARE);
    let [stopScreenShare] = useAction(actions.STOP_SCREEN_SHARE);

    if (startScreenShare) {
      sharingScreen = true;
    }
    if (stopScreenShare) {
      sharingScreen = false;
    }

    const shouldShareScreen = canShareScreen && sharingScreen;

    switch (screenState) {
      case 'initial':
        if (shouldShareScreen) {
          screenState = 'requesting';
          requestScreen();
        }
        break;
      case 'requesting':
        if (!shouldShareScreen) {
          screenState = 'initial';
        }
        break;
      case 'active':
        if (!shouldShareScreen) {
          screenStream.getTracks().forEach(track => track.stop());
          screenStream = null;
          screenState = 'initial';
        }
        break;
      case 'failed':
        if (!shouldShareScreen) {
          screenState = 'initial';
        }
        break;
    }

    return {screenStream, hasScreenFailed: screenState === 'failed'};
  };
}
