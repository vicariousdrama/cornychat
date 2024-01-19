import {
  declare,
  use,
  useRootState,
  useOn,
  useAction,
  merge,
} from '../lib/state-tree';
import Microphone from './audio/Microphone';
import AudioFile from './audio/AudioFile';
import PlayingAudio from './audio/PlayingAudio';
import VolumeMeter from './audio/VolumeMeter';
import {is} from 'minimal-state';
import {actions} from './state';
import Recording from './audio/Recording';
import PodcastRecording from './audio/PodcastRecording';

export {ServerRecording};

function ServerRecording({swarm}) {
  let isServerRecording = false;

  return function ServerRecording({}) {
    const {hub} = swarm;
    const [start] = useAction(actions.START_SERVER_RECORDING);
    const [stop] = useAction(actions.STOP_SERVER_RECORDING);

    console.log('server recording started?', start, 'server recording stopped?', stop);

    if (start) {
      hub.sendRequest('mediasoup', {type: 'startServerRecording'});
      isServerRecording = true;
    }

    if (stop) {
      hub.sendRequest('mediasoup', {type: 'stopServerRecording'});
      isServerRecording = false;
    }

    return {isServerRecording};
  };
}
