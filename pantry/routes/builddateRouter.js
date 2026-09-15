const express = require('express');
const router = express.Router();

router.get('', async function (req, res) {
  res.type('application/json');
  res.send({bd: 'BUILD_DATE'});
});

module.exports = router;
