const fetch = require('node-fetch');
const express = require('express');
const {get,set} = require('../services/redis');
const {gifSearchEndpoint, gifSearchApiKey} = require('../config');
const router = express.Router({mergeParams: true});

async function getPhrase (req, res) {
    let phrase = undefined;
    res.type('application/json');
    const phraseRaw = req.params.phrase ?? '';
    if (phraseRaw.length == 0) {
        res.sendStatus(404);
        return phrase;
    }
    phrase = phraseRaw;
    return phrase;
}

async function getCursor (req, res) {
    return req.params.cursor ?? '';
}

async function getImages (phrase, cursor) {
    // Check for cache
    let cacheKey = `gifsearch/${encodeURIComponent(phrase)}`;
    let cacheValue = await get(cacheKey);
    if (cacheValue) {
        return cacheValue;
    }
    // Check if enough time since last call (3 seconds)
    let timeKey = `activity/gifsearch/last-accessed`;
    let timeLast = await get(timeKey);
    let timeNow = Date.now();
    if (timeLast) {
        let timeDelay = 3 * 1000;
        if ((timeNow - timeDelay) < timeLast) {
            return 420; // enhance your calm
        }
    }
    // Get from upstream service
    let url = gifSearchEndpoint;
    let data = {q:phrase,pos:cursor};
    let res = await fetch(url, {
        method:'POST',
        headers: {
            'Content-Type': 'application/json',
            'API-Key': gifSearchApiKey,
        },
        body: JSON.stringify(data),
    });
    const ret = await res.json();
    // Save to cache
    await set(timeKey, timeNow);
    await set(cacheKey, ret);
    // Return
    return ret;
}

// gets images that reference the phrase specified
router.get('/:phrase', async function (req, res) {
    let phrase = await getPhrase(req, res);
    if (!phrase) return;
    let cursor = "";
    let ret = await getImages(phrase, cursor);
    if (typeof(ret) == 'number') {
        res.sendStatus(ret);
    } else {
        res.send(ret);
    }
});

router.get('/:phrase/next/:cursor', async function (req, res) {
    let phrase = await getPhrase(req, res);
    if (!phrase) return;
    let cursor = await getCursor(req, res);
    let ret = await getImages(phrase, cursor);
    if (typeof(ret) == 'number') {
        res.sendStatus(ret);
    } else {
        res.send(ret);
    }
});

module.exports = router;