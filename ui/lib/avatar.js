import {decode} from './identity-utils';

const DEFAULT_AVATAR = `/img/avatars/avatar-default.png`;

const roomAvatar = (info, room, defaultAvatar) => {
  if (info?.id == undefined) {
    console.log('info has no id when calling roomAvatar');
    return DEFAULT_AVATAR;
  }  
  let cornAvatarList = [];
  for (let i = 0; i < 9; i ++) {
    cornAvatarList.push('/img/avatars/avatar-corn-' + i.toString() + '.png');
  }
  defaultAvatar = selectFromList(info.id, cornAvatarList);
  if (room.userDisplay?.identities) {
    return room.userDisplay.identities[info.id].avatar || defaultAvatar;
  } else if (room.userDisplay?.avatars) {
    return room.userDisplay.avatars[info.id] || defaultAvatar;
  } else if (room.userDisplay?.randomIdentities) {
    return selectFromList(info.id, room.userDisplay?.randomIdentities).avatar;
  } else if (room.userDisplay?.randomAvatars) {
    return selectFromList(info.id, room.userDisplay.randomAvatars);
  } else {
    return defaultAvatar;
  }
};

const roomDisplayName = (info, room) => {
  // if incomplete info, return first name
  if (info?.id == undefined) {
    console.log('in roomDisplayName and info does not have id');
    console.log(info);
    return names[0];
  }
  if (room.userDisplay?.identities) {
    return (
      room.userDisplay.identities[info.id].name ||
      selectFromList(info.id, names)
    );
  } else if (room.userDisplay?.names) {
    return room.userDisplay.names[info.id] || selectFromList(info.id, names);
  } else if (room.userDisplay?.randomIdentities) {
    return selectFromList(info.id, room.userDisplay?.randomIdentities).name;
  } else if (room.userDisplay?.randomNames) {
    return selectFromList(info.id, room.userDisplay?.randomNames);
  } else {
    return selectFromList(info.id, names);
  }
};

export const avatarUrl = (info, room, defaultAvatar = DEFAULT_AVATAR) => {
  let avatar = DEFAULT_AVATAR;
  if (info?.avatar && !room.access?.lockedIdentities && info?.avatar !== '') {
    avatar = info.avatar;
  } else {
    avatar = roomAvatar(info, room, defaultAvatar);
  }
  if (avatar && avatar.startsWith('/img/avatar-corn')) {
    avatar = avatar.replace('/img/', '/img/avatars/');
  } 
  return avatar;
};

export const displayName = (info, room) => {
  // if incomplete info, return first name
  if (info?.id == undefined) {
    console.log('in displayName and info does not have id');
    console.log(info);
    return names[0];
  }
  const infoName = info?.name ?? '';
  if (infoName && !room?.access?.lockedIdentities) {
    return infoName;
  } else if (room) {
    return roomDisplayName(info, room);
  } else {
    return selectFromList(info.id, names);
  }
};

const selectFromList = (id, list) => {
  if (id != undefined) {
    return list[publicKeyToIndex(id, list.length)];
  }
  console.log('no id when calling selectFromList');
  if (list != undefined) {
    return list[0];
  }
  console.log('no list when calling selectFromList');
  return 'No Id No List';
};

const names = [
  'Honeybadger',
  'Ostrich',
  'Popcorn',
  'Sprout',
  'Kernel',
  'Bushel',
  'Mr. Orange',
  'Tipster',
  'Triangle 45',
  'AI Prompter',
  'Rug Salesman',
  'Elliptic',
  'Zappy',
  'Blockbuster',
  'The Oracle',
  'Memer',
  'Tangerine',
  'Clementine',
  'Unspent',
  'NGU Technician',
  'Freedom Fry',
  'Sat Sniper',
  'The Keymaker',
];

const integerFromBytes = rawBytes =>
  rawBytes[0] + (rawBytes[1] << 8) + (rawBytes[2] << 16) + (rawBytes[3] << 24);

function publicKeyToIndex(publicKey, range) {
  const bytes = decode(publicKey);
  return Math.abs(integerFromBytes(bytes)) % range;
}
