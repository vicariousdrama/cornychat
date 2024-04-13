import {config} from 'dotenv';
config();

const jamHost = process.env.JAM_HOST || 'beta.jam.systems';
const pantryUrl = process.env.JAM_PANTRY_URL || `https://${jamHost}/_/pantry`;
const distributionHost = process.env.JAM_DISTRIBUTION_HOST;
const recordFileLocationPath = process.env.RECORD_FILE_LOCATION_PATH || './records';
const hlsFileLocationPath = process.env.HLS_FILE_LOCATION_PATH || './hls';
const pantryWsUrl = pantryUrl.replace('http', 'ws');

const local = process.env.LOCAL;

export {
    jamHost,
    pantryWsUrl,
    local,
    distributionHost,
    recordFileLocationPath,
    hlsFileLocationPath,
  };