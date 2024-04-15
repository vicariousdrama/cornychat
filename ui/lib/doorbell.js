function doorbell(d, myPeerId, roomId) {
  if (!localStorage.getItem('doorbellEnabled')) return;
  // Doorbell check
  if (d?.peerId !== myPeerId) {
    if (d?.type != undefined && d.type == 'shared-state') {
      if (d.data?.state?.inRoom == true) {
        // Play doorbell if its been at least 30 seconds since last played
        let dbt = sessionStorage.getItem(`${roomId}-doorbelltime`);
        if ((Math.floor(dbt ?? '0') + 30) < Math.floor(Date.now() / 1000)) {
          sessionStorage.setItem(`${roomId}-doorbelltime`, Math.floor(Date.now() / 1000));
          let dbe = localStorage.getItem("doorbellEnabled");
          if (dbe == undefined) return;
          if (dbe == false) return;
          if (dbe == true) dbe = 1;
          dbe = Math.floor(dbe);          
          let dbs = document.getElementById("doorbellsound" + dbe);
          dbs.play();
        }
      }
    }
  } else {
    // Set last doorbell time for the room to now
    sessionStorage.setItem(`${roomId}-doorbelltime`, Math.floor(Date.now() / 1000));
  }
}

export {doorbell};