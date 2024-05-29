import { webln } from "@getalby/sdk";
import {getLNService, loadNWCUrl} from '../nostr/nostr';

function getMyName() {
    return JSON.parse(localStorage.getItem('identities'))._default.info?.name || 'anonymous user';
}

function isTime(key, periodLength) {
    const lastTime = localStorage.getItem(key);
    const currentTime = Date.now();
    const isTimeToRun = (lastTime == undefined || lastTime < (currentTime - periodLength));
    if (isTimeToRun) localStorage.setItem(key, currentTime);
    return isTimeToRun;
}

export function time4Ad() {
    const key = `lastad.timechecked`;
    const periodLength = 15*60*1000; // 15 minutes
    return isTime(key, periodLength);
}

export function value4valueAdSkip () {
    if ((localStorage.getItem('v4v2skipad.enabled') ?? 'false') != 'true') return false;
    const myName = getMyName();
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const jamID = JSON.parse(localStorage.getItem('identities'))._default.publicKey;
    const comment = `🌽💬🎑 from ${myName} (${jamID}) @ ${currentTimestamp}`;
    const lightningAddress = window.jamConfig.v4vLN;
    const satAmount = Math.floor(localStorage.getItem('v4v2skipad.amount') ?? '0');
    if (satAmount < 1) return false;
    return sendSats(lightningAddress, satAmount, comment);
}

export function time4Tip(roomId) {
    const key = `roomtip-${roomId}.timechecked`
    const periodLength = 15*60*1000; // 15 minutes
    return isTime(key, periodLength);
}

export function tipRoom(roomId, lightningAddress, satAmount) {
    if ((localStorage.getItem(`v4vtiproom.enabled`) ?? 'false') != 'true') return false;
    const myName = getMyName();
    const comment = `🌽💬 tip from ${myName} in ${jamConfig.urls.jam}/${roomId}`;
    return sendSats(lightningAddress, satAmount, comment);
}

function sendSats(lightningAddress, satAmount, comment) {
    if (lightningAddress == undefined) return false;
    if (lightningAddress.length == 0) return false;
    if (satAmount == undefined) return false;
    if (satAmount < 1) return false;
    const msatAmount = satAmount * 1000; 
    const currentTimestamp = Math.floor(Date.now() / 1000);

    try {
        if (localStorage.getItem('nwc.enabled') != 'true') return false;
        let nwcUrl = loadNWCUrl();  // cannot be const, as the webln.NostrWebLNProvider wants to modify values
        if (nwcUrl == undefined) return false;
        let x = (async () => {
            const lnService = await getLNService(lightningAddress);
            const lnurl = `${lnService.callback}?amount=${msatAmount}&comment=${comment}`;
            const invoiceResponse = await fetch(lnurl);
            const invoice = await invoiceResponse.json();
            const paymentRequest = invoice.pr;
            const nwc = new webln.NostrWebLNProvider({nostrWalletConnectUrl: nwcUrl});
            await nwc.enable();
            const nwcResponse = await nwc.sendPayment(paymentRequest);
            if (nwcResponse?.preimage) {
                console.log(`Value 4 Value payment of ${satAmount} sats completed (${comment}). Preimage: ${nwcResponse.preimage}`)
                //res(true);
                return true;
            }
            //rej('Unable to send sats. Nostr Wallet Connect payment did not return a preimage');
            return false;
        })();
        return x; // always a pending promise?
    } catch (e) {
        console.log('Error in sendSats', e);
        return false;
    }    
}