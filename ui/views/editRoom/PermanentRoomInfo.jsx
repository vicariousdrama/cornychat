import React, {useState, useEffect} from 'react';
import {useJam, useJamState} from '../../jam-core-react';

export function PermanentRoomInfo({roomId}) {
  const [
    {room},
    {listPermanentRooms, addPermanentRoom, removePermanentRoom},
  ] = useJam();
  const [loadingData, setLoadingData] = useState(true);
  const [permanentRooms, setPermanentRooms] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (permanentRooms.length == 0) {
        setLoadingData(true);
        let roomlist = await listPermanentRooms();
        setPermanentRooms(roomlist);
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  let toggleRoomPermanence = async e => {
    if (permanentRooms.includes(roomId)) {
      await removeRoom();
    } else {
      await addRoom();
    }
  };

  let addRoom = async e => {
    (async () => {
      let r = await addPermanentRoom(roomId);
      let rs = [];
      for (let ri of permanentRooms) rs.push(ri);
      if (!rs.includes(roomId)) rs.push(roomId);
      setPermanentRooms(rs);
    })();
  };

  let removeRoom = async e => {
    (async () => {
      let r = await removePermanentRoom(roomId);
      let rs = [];
      for (let ri of permanentRooms) {
        if (ri != roomId) rs.push(ri);
      }
      setPermanentRooms(rs);
    })();
  };

  return (
    <div>
      <p
        className="text-lg font-medium text-gray-200 cursor-pointer"
        onClick={() => toggleRoomPermanence()}
      >
        {permanentRooms.includes(roomId) ? '✅' : '❌'} Permanent Room
      </p>
    </div>
  );
}
