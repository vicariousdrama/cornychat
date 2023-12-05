const defaultConfig = {
  urls: {
    pantry: `http://localhost/_/pantry`,
    stun: `stun:stun.localhost:3478`,
    turn: `turn:turn.localhost:3478`,
    turnCredentials: {username: 'test', credential: 'yieChoi0PeoKo8ni'},
  },
  development: false,
  sfu: false,
};

const staticConfig =
  ((window as any).jamConfig as typeof defaultConfig) ?? defaultConfig;

export {staticConfig};
