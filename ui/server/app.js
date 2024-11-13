/* eslint-env node */
import express from 'express';
import fetch from 'node-fetch';
import qs from 'qs';
import fs from 'fs';
import ical from 'ical-generator';
import ejs from 'ejs';
import escape_html from 'escape-html';
import dns from 'dns';

export {app as default};

const app = express();

dns.setDefaultResultOrder('ipv4first');

app.use(express.static(process.env.JAM_CONFIG_DIR + '/public'));
app.use(express.static(process.env.STATIC_FILES_DIR || 'public'));

const jamHost = process.env.JAM_HOST || 'beta.jam.systems';
const jamSchema = process.env.JAM_SCHEMA || 'https://';
const relaysGeneral = process.env.RELAYS_GENERAL || 'wss://relay.damus.io,wss://nos.lol,wss://nostr-pub.wellorder.net,wss://relay.snort.social';
const relaysZapGoals = process.env.RELAYS_ZAPGOALS || 'wss://relay.damus.io,wss://nos.lol,wss://nostr-pub.wellorder.net,wss://relay.snort.social';

const urls = {
  jam: process.env.JAM_URL || `${jamSchema}${jamHost}`,
  pantry: process.env.JAM_PANTRY_URL || `${jamSchema}${jamHost}/_/pantry`,
  stun: process.env.JAM_STUN_SERVER || `stun:stun.${jamHost}:3478`,
  turn: process.env.JAM_TURN_SERVER || `turn:turn.${jamHost}:3478`,
  turnCredentials: {
    username: process.env.JAM_TURN_SERVER_USERNAME || 'test',
    credential: process.env.JAM_TURN_SERVER_CREDENTIAL || 'yieChoi0PeoKo8ni',
  },
};

const jamServerName = process.env.SERVER_NAME || 'Jam';
const jamServerLogo = process.env.SERVER_LOGO || `${urls.jam}/img/cornychat-app-icon.jpg`;
const jamServerImage = process.env.SERVER_IMAGE || jamServerLogo;
const jamServerFavicon = process.env.SERVER_FAVICON || jamServerLogo;
const jamServerOperator = process.env.SERVER_OPERATOR || 'a Friendly Nostrich';
const serverLightningAddress = process.env.SERVER_PROFILE_LUD16 || 'cornychatdev@satsilo.com';
console.log(`jamServerName: ${jamServerName}`);
console.log(`jamServerLogo: ${jamServerLogo}`);
console.log(`jamServerOperator: ${jamServerOperator}`);

const preloadScript = getPreloadScript();

let jamConfigFromFile = {};

const jamConfig = {
  ...jamConfigFromFile,
  urls,
  development: !!process.env.DEVELOPMENT,
  sfu: ['true', '1'].includes(process.env.JAM_SFU),
  broadcast: ['true', '1'].includes(process.env.JAM_BROADCAST),
  hideJamInfo: ['true', '1'].includes(process.env.JAM_HIDE_JAM_INFO),
  handbill: ['true', '1'].includes(process.env.ADS),
  relaysGeneral: relaysGeneral.split(','),
  relaysZapGoals: relaysZapGoals.split(','),
  v4vLN: serverLightningAddress,
};
console.log(jamConfig);
app.use('/config.json', (_, res) => {
  res.json(jamConfig);
});

app.use(async (req, res) => {
  let route = parsePath(req.path);
  //console.log(req.path, route);
  if (route === 'new') {
    return res.redirect(
      302,
      `${urls.jam}/${Math.random().toString(36).substr(2, 6)}`
    );
  }

  if (req.path.startsWith('/_/integrations/nostr/')) {
    let parts = req.path.split('/');
    let lastpart = parts.slice(-1)[0];
    if (lastpart.startsWith("n")) {
      res.send(
        ejs.render(
          fs.readFileSync('server/templates/nostrhandler.ejs').toString('utf-8'),
          {
            bech32encoded: lastpart,
          }
        )
      );
    } else {
      console.log('invalid bech32 value in path:', lastpart);
      return res.send('invalid bech32 value for handler');
    }
  }

  if (false && req.path === '/_/integrations/slack') {
    return res.json({
      response_type: 'in_channel',
      text: `${urls.jam}/${Math.random().toString(36).substr(2, 6)}`,
    });
  }

  if (false && req.path === '/_/integrations/slack/install') {
    let slackInstallURI = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=chat:write,chat:write.public,commands&user_scope=`;
    return res.redirect(302, slackInstallURI);
  }

  if (false && req.path === '/_/integrations/slack/oauth') {
    if (!req.query.code) {
      console.log('invalid code from Slack');
      return res.send('invalid code parameter');
    }

    let params = {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code: req.query.code,
    };

    let SLACK_API_URL = process.env.SLACK_API_URL || 'https://slack.com/api';

    const result = await fetch(`${SLACK_API_URL}/oauth.v2.access`, {
      method: 'POST',
      body: qs.stringify(params),
      headers: {
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });
    let apiResponse = await result.json();
    if (apiResponse.ok) {
      console.log(apiResponse);
      return res.send(jamServerName + ' was successfully added to your workspace.');
    } else {
      console.log(apiResponse);
      return res.send(jamServerName + ' was not added to your workspace, please try again later.'
      );
    }
  }

  let {metaInfo, roomInfo, roomId} = await getRoomMetaInfo(route);

  if (false && req.path.includes('/_/integrations/oembed')) {
    if (!req.query.url?.startsWith(`${urls.jam}/`)) return res.json();

    let width = parseInt(req.query.width || '440', 10);
    let height = parseInt(req.query.height || '600', 10);

    return res.json({
      type: 'rich',
      version: '1.0',
      html: `<iframe src="${req.query.url}" allow="microphone *;" width="${width}" height="${height}"></iframe>`,
      width: width,
      height: height,
      provider_name: jamServerName,
      provider_url: urls.jam,
    });
  }

  if (req.path.endsWith('.ics')) {
    console.log(metaInfo);
    if (!metaInfo.id) return res.sendStatus(404);

    const calendar = ical({
      domain: urls.jam,
      name: metaInfo.ogTitle,
      prodId: {company: jamServerName, product: jamServerName},
      timezone: metaInfo.schedule?.timezone,
    });

    if (metaInfo.schedule) {
      let startdt = new Date(
        `${metaInfo.schedule?.date}T${metaInfo.schedule?.time}`
      );
      let enddt = new Date(startdt.getTime() + 20 * 60 * 1000);
      console.log(startdt);
      let event = calendar.createEvent({
        start: startdt,
        end: enddt,
        summary: metaInfo.ogTitle,
        description: metaInfo.ogDescription,
        url: `${urls.jam}/${metaInfo.id}`,
      });
      if (metaInfo.schedule?.repeat) {
        event.repeating({
          freq: metaInfo.schedule.repeat.toUpperCase(),
        });
      }
    }

    res.set('Content-Type', 'text/calendar');
    return res.send(calendar.toString());
  }

  if (req.path.endsWith('manifest.json')) {
    return res.json({
      short_name: metaInfo.ogTitle,
      name: metaInfo.ogTitle,
      icons: [
        {
          src: `${urls.jam}/img/cornychat-app-icon-512.png`,
          type: 'image/png',
          sizes: '512x512',
          purpose: 'any',
        },
        {
          src: `${urls.jam}/img/cornychat-app-icon-192.png`,
          type: 'image/png',
          sizes: '192x192',
          purpose: 'any',
        },
      ],
      start_url: '/?source=pwa',
      display: 'standalone',
      scope: '/',
      theme_color: '#212121',
      description: metaInfo.ogDescription,
    });
  }

  res.send(
    ejs.render(
      fs.readFileSync('server/templates/index.ejs').toString('utf-8'),
      {
        metaInfo,
        preloadScript,
        urls,
        jamConfigString: JSON.stringify(jamConfig ?? null, escapeHtmlReplacer),
        roomInfoString: JSON.stringify(roomInfo ?? null, escapeHtmlReplacer),
        roomIdString: JSON.stringify(roomId ?? null, escapeHtmlReplacer),
      }
    )
  );
});

const escapeHtmlReplacer = function (key, value) {
  return typeof value === 'string' ? escape_html(value) : value;
};

const pantryApiPrefix = `${urls.pantry}/api/v1/rooms`;
const defaultMetaInfo = {
  ogTitle: jamServerName,
  ogDescription: 'Join this audio room',
  ogUrl: urls.jam,
  ogImage: `${jamServerImage}?t=${Math.floor(new Date().getTime()/1000)}`,
  favIcon: jamServerFavicon,
};
const reservedRoutes = ['me', null];

async function getRoomMetaInfo(route) {
  if (reservedRoutes.includes(route)) return {metaInfo: defaultMetaInfo};
  let roomUrl = `not yet set`;
  let pmdl = 231;
  try {
    // remove .ics or other suffixes
    const [roomIdCaseSensitive] = route.split('.');
    const roomId = roomIdCaseSensitive.toLowerCase();
    //roomUrl = `${pantryApiPrefix}/${roomId}`;
    roomUrl = `http://pantry:3001/api/v1/rooms/${roomId}`;  // This is a hack calling pantry directly as a workaround for localhost in dev
    pmdl = 236;
    const response = await fetch(roomUrl, {method: "GET", headers: {"Accept":"application/json"}} ); 
    pmdl = 238;
    const roomInfo = await response.json();
    pmdl = 240;
    const t = Math.floor(new Date().getTime()/1000);    
    return {
      metaInfo: {
        ...defaultMetaInfo,
        ogTitle: roomInfo.name,
        ogDescription: roomInfo.description,
        ogUrl: `${urls.jam}/${roomId}`,
        ogImage: `${(roomInfo.logoURI || jamServerImage)}?t=${t}` ,
        color: roomInfo.color || '',
        id: roomId || '',
        favIcon: `${(roomInfo.logoURI || jamServerFavicon)}?t=${t}`,
        schedule: roomInfo.schedule,
      },
      roomInfo,
      roomId,
    };
  } catch (e) {
    console.log(JSON.stringify(e));
    console.log(`Unable to retrieve info for ${route} [pmdl=${pmdl}, roomUrl=${roomUrl}] : ${e.toString()}`);
    return {metaInfo: defaultMetaInfo};
  }
}

function parsePath(pathname) {
  let [first, second] = pathname.split('/').filter(x => x);
  let stageOnly = first === 's';
  // other special configs go here
  let route = stageOnly ? second : first;
  return route ?? null;
}

function getPreloadScript() {
  let bundleHelperFile = fs.readFileSync(
    `${process.env.STATIC_FILES_DIR || 'public'}/js/bundling/all.js`,
    {encoding: 'utf-8'}
  );
  let i = bundleHelperFile.indexOf('/chunk-');
  let j = bundleHelperFile.indexOf('.js', i);
  let thirdPartyChunk = bundleHelperFile.slice(i + 1, j + 3);
  return thirdPartyChunk;
}
