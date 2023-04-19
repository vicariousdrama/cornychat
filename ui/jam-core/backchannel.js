import {useAction} from '../lib/state-tree';
import {actions} from './state';

import signalws from '../lib/signalws.js';

export {BackChannel};

function BackChannel({swarm, myId}) {
  let backChannels = new Map();
  let subscriptionIds = new Set();

  return function BackChannel() {
    const [isSubscribe, subscription] = useAction(
      actions.BACKCHANNEL_SUBSCRIBE
    );
    const [isUnsubscribe, subscriptionId] = useAction(
      actions.BACKCHANNEL_UNSUBSCRIBE
    );
    const [isBroadcast, message] = useAction(actions.BACKCHANNEL_BROADCAST);

    const ensureBackChannelPresence = async roomId => {
      if (!backChannels.has(roomId)) {
        const {url, sign} = swarm;
        const myConnId = randomHex4();
        backChannels.set(
          roomId,
          await signalws({
            url,
            roomId,
            myPeerId: myId,
            myConnId,
            sign,
            subscriptions: ['all'],
          })
        );
      }
    };

    if (isSubscribe) {
      const {roomId, handler, topic, subscriptionId} = subscription;

      ensureBackChannelPresence(roomId).then(() => {
        if (!subscriptionIds.has(subscriptionId)) {
          subscriptionIds.add(subscriptionId);

          const fencedHandler = data => {
            if (subscriptionIds.has(subscriptionId)) {
              handler(data);
            }
          };

          backChannels.get(roomId).subscribe(topic, fencedHandler);
        }
      });
    }

    if (isUnsubscribe) {
      subscriptionIds.delete(subscriptionId);
    }

    if (isBroadcast) {
      const {roomId, topic, data} = message;

      ensureBackChannelPresence(roomId).then(() =>
        backChannels.get(roomId).broadcast(topic, {data})
      );
    }

    return {
      backChannels: [...backChannels.keys()],
    };
  };
}

function randomHex4() {
  return ((Math.random() * 16 ** 4) | 0).toString(16).padStart(4, '0');
}
