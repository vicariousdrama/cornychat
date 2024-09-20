const {get, set} = require('./redis');
const {serverAdminId} = require('../config');
const {addAdmin} = require('../auth');

const initDb = async () => {
  if (serverAdminId && serverAdminId.length > 0) {
    try {
      await addAdmin(serverAdminId);
    } catch(error) {
      console.log(`[initDb] error: ${error}`);
    }
  }
};

module.exports = initDb;
