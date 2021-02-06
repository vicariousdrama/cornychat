import React, {useEffect} from 'react';
import {render} from 'react-dom';
import Start from './views/Start.jsx';
import Room from './views/Room.jsx';
import {initializeIdentity, getInfo, getId} from "./lib/identity";
import {useApiQuery} from './backend.js';
import {usePath} from './lib/use-location.js';
import {connectRoom, state} from './main.js';
import swarm from './lib/swarm.js';

render(<App />, document.querySelector('#root'));

function App() {
  // detect roomId & connect to signalhub
  const [roomId] = usePath();
  useEffect(() => {
    initializeIdentity();
    state.set("myInfo", getInfo());
    swarm.set("myPeerId", getId());
    if (roomId) connectRoom(roomId);
    return () => swarm.disconnect();
  }, [roomId]);
  // fetch room if we are in one
  let [room, isLoading] = useApiQuery(`/rooms/${roomId}`, !!roomId);

  if (roomId) {
    if (isLoading) return null;
    if (room) return <Room room={room} roomId={roomId} />;
  }
  return <Start urlRoomId={roomId} />;
}
