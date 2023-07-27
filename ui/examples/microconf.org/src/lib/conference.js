import {createRandomId} from './utils';
import {useContext} from 'react';

const verbs = [
  'Arguing',
  'Conferring',
  'Considering',
  'Debating',
  'Deliberating',
  'Examining',
  'Explaining',
  'Disputing',
  'Contesting',
  'Reasoning',
];

const animals = [
  'Aardvarks',
  'Albatrosses',
  'Alligators',
  'Alpacas',
  'Ants',
  'Anteaters',
  'Antelopes',
  'Apes',
  'Armadillos',
  'Donkeys',
  'Baboons',
  'Badgers',
  'Barracudas',
  'Bats',
  'Bears',
  'Beavers',
  'Bees',
  'Bisons',
  'Boars',
  'Buffalos',
  'Butterflys',
  'Camels',
  'Capybaras',
  'Caribous',
  'Cassowarys',
  'Cats',
  'Caterpillars',
  'Cattles',
  'Chamoises',
  'Cheetahs',
  'Chickens',
  'Chimpanzees',
  'Chinchillas',
  'Choughs',
  'Clams',
  'Cobras',
  'Cockroachs',
  'Cods',
  'Cormorants',
  'Coyotes',
  'Crabs',
  'Cranes',
  'Crocodiles',
  'Crows',
  'Curlews',
  'Deers',
  'Dinosaurs',
  'Dogs',
  'Dogfish',
  'Dolphins',
  'Dotterels',
  'Doves',
  'Dragonflies',
  'Ducks',
  'Dugongs',
  'Dunlins',
  'Eagles',
  'Echidnas',
  'Eels',
  'Elands',
  'Elephants',
  'Elks',
  'Emus',
  'Falcons',
  'Ferrets',
  'Finchs',
  'Fish',
  'Flamingos',
  'Flies',
  'Foxs',
  'Frogs',
  'Gaurs',
  'Gazelles',
  'Gerbils',
  'Giraffes',
  'Gnats',
  'Gnus',
  'Goats',
  'Goldfinches',
  'Goldfish',
  'Gooses',
  'Gorillas',
  'Goshawks',
  'Grasshoppers',
  'Grouses',
  'Guanacos',
  'Gulls',
  'Hamsters',
  'Hares',
  'Hawks',
  'Hedgehogs',
  'Herons',
  'Herrings',
  'Hippopotamuses',
  'Hornets',
  'Horses',
  'Humans',
  'Hummingbirds',
  'Hyenas',
  'Ibexes',
  'Ibises',
  'Jackals',
  'Jaguars',
  'Jays',
  'Jellyfish',
  'Kangaroos',
  'Kingfishers',
  'Koalas',
  'Kookaburas',
  'Koupreys',
  'Kudus',
  'Lapwings',
  'Larks',
  'Lemurs',
  'Leopards',
  'Lions',
  'Llamas',
  'Lobsters',
  'Locusts',
  'Lorises',
  'Lyrebirds',
  'Magpies',
  'Mallards',
  'Manatees',
  'Mandrills',
  'Mantises',
  'Martens',
  'Meerkats',
  'Minks',
  'Moles',
  'Mongooses',
  'Monkeys',
  'Mooses',
  'Mosquitos',
  'Mouses',
  'Mules',
  'Narwhals',
  'Newts',
  'Nightingales',
  'Octopuses',
  'Okapis',
  'Opossums',
  'Oryxes',
  'Ostriches',
  'Otters',
  'Owls',
  'Oysters',
  'Panthers',
  'Parrots',
  'Partridges',
  'Peafowls',
  'Pelicans',
  'Penguins',
  'Pheasants',
  'Pigs',
  'Pigeons',
  'Ponies',
  'Porcupines',
  'Porpoises',
  'Quails',
  'Queleas',
  'Quetzals',
  'Rabbits',
  'Raccoons',
  'Rails',
  'Rams',
  'Rats',
  'Ravens',
  'Red deer',
  'Red pandas',
  'Reindeer',
  'Rhinoceroses',
  'Rooks',
  'Salamanders',
  'Salmons',
  'Sand Dollars',
  'Sandpipers',
  'Sardines',
  'Scorpions',
  'Seahorses',
  'Seals',
  'Sharks',
  'Sheep',
  'Shrews',
  'Skunks',
  'Snails',
  'Snakes',
  'Sparrows',
  'Spiders',
  'Spoonbills',
  'Squids',
  'Squirrels',
  'Starlings',
  'Stingrays',
  'Stinkbugs',
  'Storks',
  'Swallows',
  'Swans',
  'Tapirs',
  'Tarsiers',
  'Termites',
  'Tigers',
  'Toads',
  'Trouts',
  'Turkeys',
  'Turtles',
  'Vipers',
  'Vultures',
  'Wallabys',
  'Walruss',
  'Wasps',
  'Weasels',
  'Whales',
  'Wildcats',
  'Wolfs',
  'Wolverines',
  'Wombats',
  'Woodcocks',
  'Woodpeckers',
  'Worms',
  'Wrens',
  'Yaks',
  'Zebras',
];

const selectRandomElement = list =>
  list[Math.floor(Math.random() * list.length)];

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

export const randomConferenceName = () =>
  `${selectRandomElement(verbs)} ${selectRandomElement(animals)}`;

export const getConference = async (api, conferenceId) => {
  return conferenceId && (await api.getRoom(conferenceId)).conference;
};

export const createConference = async (
  conferenceName,
  theme,
  jamState,
  jamApi
) => {
  const {createRoom} = jamApi;
  const {myId} = jamState;

  const conferenceId = createRandomId();
  const initialRoomId = createRandomId();

  const conference = {
    id: conferenceId,
    name: conferenceName,
    theme,
    admins: [myId],
    rooms: {
      [initialRoomId]: {
        speaker: myId,
      },
    },
  };

  await createRoom(conferenceId, {
    name: 'Lobby',
    stageOnly: true,
    videoCall: true,
    conference,
  });

  await createRoom(initialRoomId, {name: 'Plenary', presenters: [myId]});

  return conference;
};

const inviteToPanel = async (roomId, peerId, jamApi) => {
  await jamApi.addSpeaker(roomId, peerId);
  await sleep(10);
  await jamApi.addPresenter(roomId, peerId);
};

const removeFromPanel = async (roomId, peerId, jamApi) => {
  await jamApi.removeSpeaker(roomId, peerId);
  await sleep(10);
  await jamApi.removePresenter(roomId, peerId);
};

const makeSpeaker = async (conference, roomId, peerId, jamApi) => {
  await jamApi.addSpeaker(roomId, peerId);
  await sleep(10);
  await jamApi.addPresenter(roomId, peerId);
  await sleep(10);
  const newConference = {
    ...conference,
    rooms: {
      ...conference.rooms,
      [roomId]: {
        ...conference.rooms[roomId],
        speaker: peerId,
      },
    },
  };

  await updateConference(newConference, jamApi);
};

const updateConference = async (conference, jamApi) => {
  const room = await jamApi.getRoom(conference.id);
  await jamApi.updateRoom(conference.id, {...room, conference});
  jamApi.backchannelBroadcast(
    `microconf-${conference.id}`,
    'conference-info',
    conference
  );
};

const addRoom = async (roomName, conference, jamState, jamApi) => {
  const newRoomId = createRandomId();
  const {createRoom} = jamApi;
  const {myId} = jamState;

  await createRoom(newRoomId, {name: roomName, presenters: [myId]});

  const newConference = {
    ...conference,
    rooms: {
      ...conference.rooms,
      [newRoomId]: {
        speaker: myId,
      },
    },
  };

  await updateConference(newConference, jamApi);
};

const removeRoom = async (roomId, conference, jamState, jamApi) => {
  const newRooms = conference.rooms;
  newRooms[roomId] = undefined;

  const newConference = {
    ...conference,
    rooms: newRooms,
  };

  await updateConference(newConference, jamApi);
};

export const conferenceApi = (conference, jamState, jamApi) => {
  return {
    conference: () => conference,
    subscribeConference: handler =>
      jamApi.backchannelSubscribe(
        `microconf-${conference.id}`,
        'conference-info',
        handler,
        `${jamState['myId']}-conference-info`
      ),
    subscribeRoomInfo: handler =>
      jamApi.backchannelSubscribe(
        `microconf-${conference.id}`,
        'room-info',
        handler,
        `${jamState['myId']}-room-info`
      ),
    unsubscribeConference: () =>
      jamApi.backchannelUnsubscribe(`${jamState['myId']}-conference-info`),
    unsubscribeRoomInfo: () =>
      jamApi.backchannelUnsubscribe(`${jamState['myId']}-room-info`),
    inviteToPanel: async (roomId, peerId) =>
      await inviteToPanel(roomId, peerId, jamApi),
    removeFromPanel: async (roomId, peerId) =>
      await removeFromPanel(roomId, peerId, jamApi),
    makeSpeaker: async (roomId, peerId) =>
      makeSpeaker(conference, roomId, peerId, jamApi),
    updateConference: async conference => updateConference(conference, jamApi),
    broadcastRoomChange: () =>
      jamApi.backchannelBroadcast(`microconf-${conference.id}`, 'room-info', {
        refresh: true,
      }),
    addRoom: async roomName => addRoom(roomName, conference, jamState, jamApi),
    removeRoom: async roomId =>
      removeRoom(roomId, conference, jamState, jamApi),
  };
};
