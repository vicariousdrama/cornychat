function doorbell(d, myPeerId, roomId) {
  if (!localStorage.getItem('doorbellEnabled')) return;
  // Doorbell check
  let keyDoorbellTime = `${roomId}.doorbellTime`;
  if (d?.peerId !== myPeerId) {
    if (d?.type != undefined && d.type == 'shared-state') {
      let keyPeerIds = `${roomId}.peerIds`;
      let keyPeerIdLeft = `${roomId}.${d.peerId}.left`;
      if (d.data?.state?.inRoom == true) {
        let playsound = false;
        // In room ids check and update
        let inRoomPeerIds = sessionStorage.getItem(keyPeerIds);
        if (inRoomPeerIds == undefined) {
          playsound = true;
          inRoomPeerIds = [d.peerId];
          sessionStorage.setItem(keyPeerIds, JSON.stringify(inRoomPeerIds));
        } else {
          inRoomPeerIds = JSON.parse(inRoomPeerIds);
          if (!inRoomPeerIds.includes(d.peerId)) {
            playsound = true;
            inRoomPeerIds.push(d.peerId);
            sessionStorage.setItem(keyPeerIds, JSON.stringify(inRoomPeerIds));
          }
        }
        // dont play doorbell if its been less than 30 seconds since last time
        let dbt = sessionStorage.getItem(keyDoorbellTime);
        if ((dbt!=undefined) && ((Math.floor(dbt) + 30) > Math.floor(Date.now() / 1000))) playsound = false;
        // dont play doorbell if this user left and came back within the past 60 seconds
        let ult = sessionStorage.getItem(keyPeerIdLeft);
        if ((ult!=undefined) && ((Math.floor(ult) + 60) > Math.floor(Date.now() / 1000))) playsound = false;
        if (!playsound) return;
        // Play the sound based on index user chose
        let dbe = localStorage.getItem("doorbellEnabled");
        if (dbe == undefined) return;
        if (dbe == false) return;
        if (dbe == true) dbe = 1;
        if (dbe == null) return;
        dbe = Math.floor(dbe);
        let dbs = document.getElementById("doorbellsound" + String(dbe));
        if(dbs == undefined) return;
        dbs.volume = .5;
        dbs.play();
        // Mark time last played
        sessionStorage.setItem(keyDoorbellTime, Math.floor(Date.now() / 1000));
      } else {
        // Remove from in room ids
        let inRoomPeerIds = sessionStorage.getItem(keyPeerIds);
        if (inRoomPeerIds == undefined) return;
        inRoomPeerIds = JSON.parse(inRoomPeerIds);
        let removing = inRoomPeerIds.includes(d.peerId);
        if (removing) {
          let newRoomPeerIds = inRoomPeerIds.filter(function (v) {return v != d.peerId});
          sessionStorage.setItem(keyPeerIds, JSON.stringify(newRoomPeerIds));
          // Indicate when left
          sessionStorage.setItem(keyPeerIdLeft, Math.floor(Date.now() / 1000));
        }
      }
    }
  } else {
    // My state changed. Set last doorbell time for the room to now as im active
    sessionStorage.setItem(keyDoorbellTime, Math.floor(Date.now() / 1000));
  }
}

export {doorbell};