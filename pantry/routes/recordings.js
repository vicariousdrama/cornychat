const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const archiver = require('archiver');
const {get} = require('../services/redis');
const {isModerator} = require('../auth');
const {recordFileLocationPath} = require('../config');

const router = express.Router({mergeParams: true});

router.get('', async (req, res) => {
  const roomId = req.params.id;

  if (!(await isModerator(req, roomId))) {
    res.sendStatus(403);
    return;
  }

  const roomPath = path.join(recordFileLocationPath, roomId);

  // ensure directory exists, return empty zip if no recordings present
  await fs.mkdir(roomPath, {recursive: true});

  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition':
      'attachment; filename="recordings.zip"; filename*="recordings.zip"',
  });

  const userIds = await fs.readdir(roomPath);

  const users = await Promise.all(userIds.map(id => get(`identities/${id}`)));

  const archive = archiver('zip', {
    zlib: {level: 0}, // Sets the compression level.
  });

  archive.pipe(res);

  archive.directory(roomPath, roomId);

  archive.append(JSON.stringify(users), {name: `${roomId}/users.json`});

  await archive.finalize();
});

module.exports = router;
