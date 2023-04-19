import React, {createContext, useContext, useEffect, useState} from 'react';
import {conferenceApi, getConference} from './lib/conference.js';
import {useJam} from 'jam-core-react';

const ConferenceContext = createContext([
  {
    rooms: {},
  },
  {},
]);

export function ConferenceProvider({children, conferenceId, roomId}) {
  const [jamState, jamApi] = useJam();

  const [conference, setConference] = useState(undefined);
  const [rooms, setRooms] = useState({});

  const [api, setApi] = useState(conferenceApi(conference, jamState, jamApi));

  async function refreshRoomInfo(conference) {
    const rooms = (
      await Promise.all(
        Object.keys(conference.rooms).map(async id => ({
          [id]: await jamApi.getRoom(id),
        }))
      )
    ).reduce((o, r) => ({...o, ...r}));

    setRooms(rooms);
  }

  useEffect(() => {
    (async () => {
      const conference = await getConference(jamApi, conferenceId);

      if (conference) {
        const newApi = conferenceApi(conference, jamState, jamApi);

        setApi(newApi);
        await refreshRoomInfo(conference);
        newApi.subscribeConference(async message => {
          const conference = message.data;
          await refreshRoomInfo(conference);
          setConference(conference);
          setApi(conferenceApi(conference, jamState, jamApi));
        });
        newApi.subscribeRoomInfo(() => refreshRoomInfo(conference));
        setConference(conference);
      }
    })();

    return () => {
      api.unsubscribeConference();
      api.unsubscribeRoomInfo();
    };
  }, [conferenceId]);

  return (
    <ConferenceContext.Provider value={[{conference, rooms, roomId}, api]}>
      {children}
    </ConferenceContext.Provider>
  );
}

export function useConference() {
  return useContext(ConferenceContext);
}
