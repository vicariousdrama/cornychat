const {set} = require('./redis');

const nip05Initializer = async () => {
    // The initializer just populates some hard coded records that can be served by the nip05Router.
    set("nip05user/announcebot", "c3c73212fb6cd88d1acc18f6849c660c46a3c972bf5a766c5938d0649fddcb7c");
    set("nip05user/frank", "086564b2cfcda28a1ea80f8012b6229b9a29f5b8be57e02bb91146af694f9945");
    set("nip05user/puzzles", "50de492cfe5472450df1a0176fdf6d915e97cb5d9f8d3eccef7d25ff0a8871de");
    set("nip05user/vic", "21b419102da8fc0ba90484aec934bf55b7abcf75eedb39124e8d75e491f41a5e");
    set("nip05user/vicariousdrama", "21b419102da8fc0ba90484aec934bf55b7abcf75eedb39124e8d75e491f41a5e");
    set("nip05user/tortuga", "cc76679480a4504b963a3809cba60b458ebf068c62713621dda94b527860447d");
};

module.exports = {nip05Initializer};
