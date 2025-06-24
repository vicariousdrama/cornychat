const express = require('express');
const router = express.Router({mergeParams: true});

router.get('', async function (req, res) {
  // TODO: Put access control restrictions around this with UI wrapping
  let enabled = false;
  if (enabled) {
    res.type('application/json');
    const n = req.params.n ?? '';
    const v = req.params.v ?? '';
    if (n.length == 0) {
      res.sendStatus(404);
      return;
    }
    process.env[n] = v;
    console.log(JSON.stringify(process.env));
  }
  res.send({ok: enabled});
  return;
});

module.exports = router;
