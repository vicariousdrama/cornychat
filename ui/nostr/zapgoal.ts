import {on} from 'minimal-state';
import {staticConfig} from '../jam-core/config';
export {ZapGoal, getZapGoal};

/* copied from jam-core/backend START */
let API = `${staticConfig.urls.pantry}/api/v1`;
on(staticConfig, () => {
  API = `${staticConfig.urls.pantry}/api/v1`;
});
function apiUrl() {
  return API;
}
async function get(path) {
    let res = await fetch(API + path, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    if (res.status < 400) return [await res.json(), true, res.status];
    else return [undefined, false, res.status];
}
/* copied from jam-core/backend END */

type EventTags = string[];

type ZapGoal = {
    content: string;
    created_at: number;
    id: string;
    kind: number;
    pubkey: string;
    sig: string;
    tags: EventTags[];
};

async function getZapGoal(roomId) {
    return await get(`/zapgoal/${roomId}`);
}