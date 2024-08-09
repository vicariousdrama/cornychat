import { webln } from "@getalby/sdk";
import {getLNService, loadNWCUrl, getZapEvent, getLNInvoice} from '../nostr/nostr';
const {nip19} = require('nostr-tools');

function getMyName() {
    return JSON.parse(localStorage.getItem('identities'))._default.info?.name || 'anonymous user';
}
function getMyId() {
    return JSON.parse(localStorage.getItem('identities'))._default.publicKey || '';
}

function isTime(key, periodLength) {
    const lastTime = localStorage.getItem(key);
    const currentTime = Date.now();
    const isTimeToRun = (lastTime == undefined || lastTime < (currentTime - periodLength));
    if (isTimeToRun) localStorage.setItem(key, currentTime);
    return isTimeToRun;
}

export function time4Ad() {
    const key = `v4v2skipad.timechecked`;
    const frequency = Math.floor(localStorage.getItem(`v4v2skipad.frequency`) ?? '15');
    const periodLength = frequency*60*1000;
    return isTime(key, periodLength);
}

export async function value4valueAdSkip (sourceNote, fnSuccess, textForSuccess) {
    if ((localStorage.getItem('v4v2skipad.enabled') ?? 'false') != 'true') return false;
    const myName = getMyName();
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const jamID = JSON.parse(localStorage.getItem('identities'))._default.publicKey;
    const comment = `🌽💬🎑 from ${myName} (${jamID}) @ ${currentTimestamp} ${sourceNote}`;
    const lightningAddress = window.jamConfig.v4vLN;
    const satAmount = Math.floor(localStorage.getItem('v4v2skipad.amount') ?? '0');
    if (satAmount < 1) return false;
    return await sendSats(lightningAddress, satAmount, comment, fnSuccess, textForSuccess, 'v4v2skipad.timepaid');
}

export function time4Tip(roomId) {
    const key = `roomtip-${roomId}.timechecked`;
    const frequency = Math.floor(localStorage.getItem(`v4vtiproom.frequency`) ?? '15');
    const periodLength = frequency*60*1000;
    return isTime(key, periodLength);
}

export async function tipRoom(roomId, lightningAddress, satAmount, fnSuccess, textForSuccess) {
    if ((localStorage.getItem(`v4vtiproom.enabled`) ?? 'false') != 'true') return false;
    const myName = getMyName();
    const comment = `🌽💬 tip from ${myName} in ${jamConfig.urls.jam}/${roomId}`;
    return await sendSats(lightningAddress, satAmount, comment, fnSuccess, textForSuccess, `roomtip-${roomId}.timepaid`);
}

export async function zapRoomGoal(zapGoal, roomId, lightningAddress, satAmount, fnSuccess, textForSuccess) {
    if ((localStorage.getItem(`v4vtiproom.enabled`) ?? 'false') != 'true') return false;
    const comment = `Raisin Corn!`;
    const eventId = zapGoal.id;
    const pubkey = nip19.decode(zapGoal.npub).data;
    return await zapSats(lightningAddress, satAmount, pubkey, eventId, comment, fnSuccess, textForSuccess, `roomtip-${roomId}.timepaid`);
}

async function sendSats(lightningAddress, satAmount, comment, fnSuccess, textForSuccess, keyForSuccess) {
    return zapSats(lightningAddress, satAmount, null, null, comment, fnSuccess, textForSuccess, keyForSuccess);
}

async function zapSats(lightningAddress, satAmount, pubkey, eventId, comment, fnSuccess, textForSuccess, keyForSuccess) {
    if (lightningAddress == undefined) return false;
    if (lightningAddress.length == 0) return false;
    if (satAmount == undefined) return false;
    if (satAmount < 1) return false;
    const msatsAmount = satAmount * 1000; 
    const currentTimestamp = Math.floor(Date.now() / 1000);

    try {
        if (localStorage.getItem('nwc.enabled') != 'true') return false;
        let nwcUrl = loadNWCUrl();  // cannot be const, as the webln.NostrWebLNProvider wants to modify values
        if (nwcUrl == undefined) return false;
        let x = (async () => {
            const lnService = await getLNService(lightningAddress);
            let invoice = {};
            if (pubkey) {
                const signedZapRequest = await getZapEvent(comment, pubkey, {id: eventId}, msatsAmount);
                if (signedZapRequest[0]) {
                    const lnInvoice = await getLNInvoice(signedZapRequest[1], lightningAddress, lnService, msatsAmount, comment);
                    if (lnInvoice?.pr) invoice = lnInvoice;
                }
            }
            if (!invoice?.pr) {
                const lnurl = `${lnService.callback}?amount=${msatsAmount}&comment=${comment}`;
                const invoiceResponse = await fetch(lnurl);
                invoice = await invoiceResponse.json();
            }
            if (!invoice?.pr) return false;
            const paymentRequest = invoice.pr;
            const nwc = new webln.NostrWebLNProvider({nostrWalletConnectUrl: nwcUrl});
            await nwc.enable();
            const nwcResponse = await nwc.sendPayment(paymentRequest);
            if (nwcResponse?.preimage) {
                console.log(`Value 4 Value payment of ${satAmount} sats completed (${comment}). Preimage: ${nwcResponse.preimage}`);
                if (fnSuccess && textForSuccess) {
                    (async () => {await fnSuccess(textForSuccess);})();
                }
                localStorage.setItem(keyForSuccess, Date.now());
                //res(true);
                return true;
            }
            //rej('Unable to send sats. Nostr Wallet Connect payment did not return a preimage');
            return false;
        });
        let y = x();
        if (window.DEBUG) console.log(`in sendSats, y: ${y}`);
        return y; // always a pending promise?
    } catch (e) {
        let m = `ERROR sending sats: ${e}`;
        if (fnSuccess) {
            (async () => {await fnSuccess(m, getMyId());})();
        }
        console.log(m);
        return false;
    }    
}