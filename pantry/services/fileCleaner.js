const fs = require('fs/promises');
const path = require('path');
const {recordFileLocationPath, recordFileRetentionDays} = require('../config');

const CLEANING_INTERVAL = 60 * 60 * 1000;

const cleanDirectory = async recordingPath => {
  try {
    if ((await fs.stat(recordingPath)).isDirectory()) {
      for await (const dirent of await fs.opendir(recordingPath)) {
        const entryPath = path.join(recordingPath, dirent.name);
        if (dirent.isDirectory()) {
          await cleanDirectory(entryPath);
        } else if (dirent.isFile()) {
          const stats = await fs.stat(entryPath);
          if (
            stats.mtimeMs <
            Date.now() - recordFileRetentionDays * 24 * 60 * 60 * 1000
          ) {
            console.log(`Removing ${entryPath}.`);
            await fs.rm(entryPath);
          }
        }
      }
      if (
        recordingPath !== recordFileLocationPath &&
        (await fs.readdir(recordingPath)).length === 0
      ) {
        console.log(`Removing ${recordingPath}.`);
        await fs.rm(recordingPath, {recursive: true});
      }
    }
  } catch (e) {
    console.log('Cleanup error:');
    console.log(e);
  }
};

const setupCleaner = async () => {
  setInterval(async () => {
    console.log(
      `[setupCleaner] starting cleanup of recordings older than ${recordFileRetentionDays} day${
        recordFileRetentionDays > 1 ? 's' : ''
      } ...`
    );
    try {
      await cleanDirectory(recordFileLocationPath);
    } catch(error) {
      console.log(`[setupCleaner] error: ${error}`);
    }
    console.log('[setupCleaner] Cleanup complete.');
  }, CLEANING_INTERVAL);
};

module.exports = {setupCleaner};
