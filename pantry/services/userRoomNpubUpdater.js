const {set, get, list} = require('./redis');
const CHECK_INTERVAL = 30 * 60 * 1000; // We check rooms every 30 minutes
const pmd = true;

const getNpubFromID = async userId => {
  let usernpub = '';
  if (userId.length == 43) {
    let userinfo = await get(`identities/${userId}`);
    if (userinfo != undefined) {
      if (userinfo.identities != undefined) {
        for (let identity of userinfo.identities) {
          if (identity.type == undefined) continue;
          if (identity.type != 'nostr') continue;
          if (identity.id == undefined) continue;
          usernpub = identity.id;
          break;
        }
      }
    }
  }
  return usernpub;
};

const userRoomNpubUpdaterLogic = async () => {
  if (pmd)
    console.log(
      `[userRoomNpubUpdaterLogic] Checking for rooms needing npubs associated`
    );

  let rooms = {};
  let userIds = {}; // keys = userid, and the value is the corresponding npub
  let npubs = {}; // keys = npub, and the value is an array of 1 or more userids
  let npubsToAdd = [];
  let npubsPresent = [];
  let roomsChecked = 0;
  let roomsUpdated = 0;
  try {
    rooms = await list(`rooms/*`);
    if (rooms.length > 0) {
      for (let roomkey of rooms) {
        roomsChecked += 1;
        let roominfo = await get(roomkey);
        let dirty = false;
        if (roominfo == undefined) continue;
        let roomId = roomkey.split('/')[1];
        if (roominfo.speakers != undefined) {
          npubsToAdd = [];
          npubsPresent = [];
          for (let uservalue of roominfo.speakers) {
            if (uservalue.startsWith('npub')) {
              if (!npubsPresent.includes(uservalue))
                npubsPresent.push(uservalue);
            }
            if (!uservalue.startsWith('npub')) {
              let npubToAdd = '';
              if (userIds.hasOwnProperty(uservalue)) {
                npubToAdd = userIds[uservalue];
              } else {
                npubToAdd = await getNpubFromID(uservalue);
                userIds[uservalue] = npubToAdd;
              }
              if (npubToAdd.length > 0) {
                if (!npubs.hasOwnProperty(npubToAdd)) npubs[npubToAdd] = [];
                if (!npubs[npubToAdd].includes(uservalue))
                  npubs[npubToAdd].push(uservalue);
                if (
                  !roominfo.speakers.includes(npubToAdd) &&
                  !npubsPresent.includes(npubToAdd) &&
                  !npubsToAdd.includes(npubToAdd)
                )
                  npubsToAdd.push(npubToAdd);
              }
            }
          }
          if (npubsToAdd.length > 0) {
            dirty = true;
            if (pmd)
              console.log(
                `[userRoomNpubUpdaterLogic] room ${roomId} will be updated with npubs for ${npubsToAdd.length} speakers`
              );
            for (let npubToAdd of npubsToAdd) {
              roominfo.speakers.push(npubToAdd);
            }
          }
          let uniquevalues = [...new Set(roominfo.speakers)];
          if (uniquevalues.length != roominfo.speakers.length) {
            dirty = true;
            if (pmd)
              console.log(
                `[userRoomNpubUpdaterLogic] room ${roomId} will be updated to deduplicate speakers`
              );
            roominfo.speakers = uniquevalues;
          }
        }
        if (roominfo.moderators != undefined) {
          npubsToAdd = [];
          npubsPresent = [];
          for (let uservalue of roominfo.moderators) {
            if (uservalue.startsWith('npub')) {
              if (!npubsPresent.includes(uservalue))
                npubsPresent.push(uservalue);
            }
            if (!uservalue.startsWith('npub')) {
              let npubToAdd = '';
              if (userIds.hasOwnProperty(uservalue)) {
                npubToAdd = userIds[uservalue];
              } else {
                npubToAdd = await getNpubFromID(uservalue);
                userIds[uservalue] = npubToAdd;
              }
              if (
                npubToAdd.length > 0 &&
                !roominfo.moderators.includes(npubToAdd) &&
                !npubsPresent.includes(npubToAdd) &&
                !npubsToAdd.includes(npubToAdd)
              )
                npubsToAdd.push(npubToAdd);
            }
          }
          if (npubsToAdd.length > 0) {
            dirty = true;
            if (pmd)
              console.log(
                `[userRoomNpubUpdaterLogic] room ${roomId} will be updated with npubs for ${npubsToAdd.length} moderators`
              );
            for (let npubToAdd of npubsToAdd) {
              roominfo.moderators.push(npubToAdd);
            }
          }
          let uniquevalues = [...new Set(roominfo.moderators)];
          if (uniquevalues.length != roominfo.moderators.length) {
            dirty = true;
            if (pmd)
              console.log(
                `[userRoomNpubUpdaterLogic] room ${roomId} will be updated to deduplicate moderators`
              );
            roominfo.moderators = uniquevalues;
          }
        }
        if (roominfo.owners != undefined) {
          npubsToAdd = [];
          npubsPresent = [];
          for (let uservalue of roominfo.owners) {
            if (uservalue.startsWith('npub')) {
              if (!npubsPresent.includes(uservalue))
                npubsPresent.push(uservalue);
            }
            if (!uservalue.startsWith('npub')) {
              let npubToAdd = '';
              if (userIds.hasOwnProperty(uservalue)) {
                npubToAdd = userIds[uservalue];
              } else {
                npubToAdd = await getNpubFromID(uservalue);
                userIds[uservalue] = npubToAdd;
              }
              if (
                npubToAdd.length > 0 &&
                !roominfo.owners.includes(npubToAdd) &&
                !npubsPresent.includes(npubToAdd) &&
                !npubsToAdd.includes(npubToAdd)
              )
                npubsToAdd.push(npubToAdd);
            }
          }
          if (npubsToAdd.length > 0) {
            dirty = true;
            if (pmd)
              console.log(
                `[userRoomNpubUpdaterLogic] room ${roomId} will be updated with npubs for ${npubsToAdd.length} owners`
              );
            for (let npubToAdd of npubsToAdd) {
              roominfo.owners.push(npubToAdd);
            }
          }
          let uniquevalues = [...new Set(roominfo.owners)];
          if (uniquevalues.length != roominfo.owners.length) {
            dirty = true;
            if (pmd)
              console.log(
                `[userRoomNpubUpdaterLogic] room ${roomId} will be updated to deduplicate owners`
              );
            roominfo.owners = uniquevalues;
          }
        }
        // if changes, update the room
        if (dirty) {
          if (pmd)
            console.log(
              `[userRoomNpubUpdaterLogic] saving changes to room: ${roomId}`
            );
          await set(roomkey, roominfo);
          roomsUpdated += 1;
        }
      }
    }
    if (pmd)
      console.log(
        `[userRoomNpubUpdaterLogic] Finished checking ${roomsChecked} rooms. ${roomsUpdated} updated`
      );
    // save npub to userid cache. will be referenced for delete room requests by user
    await set('npubs2users', npubs);
  } catch (error) {
    if (pmd)
      console.log(
        `[userRoomNpubUpdaterLogic] error updating rooms with npubs from user ids: ${error}`
      );
  }
};

const userRoomNpubUpdater = async () => {
  try {
    await userRoomNpubUpdaterLogic();
    setInterval(async () => {
      await userRoomNpubUpdaterLogic();
    }, CHECK_INTERVAL);
  } catch (error) {
    if (pmd)
      console.log(`[userRoomNpubUpdater] error setting up updater: ${error}`);
  }
};

module.exports = {userRoomNpubUpdater};
