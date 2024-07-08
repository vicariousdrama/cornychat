import {useAction} from '../lib/state-tree';
import {sendCSAR} from '../lib/swarm';
import {actions} from './state';

function ClientSideActionReport({swarm}) {
  return function ClientSideActionReport() {
    let [isCSAR, payload] = useAction(actions.CSAR);
    if (isCSAR) {
      let csar = payload.csar;
      if (!csar) csar = payload;
      sendCSAR(swarm, 'csar', csar);
    }
  };
}

export {ClientSideActionReport};