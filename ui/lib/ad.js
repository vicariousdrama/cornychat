import { webln } from "@getalby/sdk";
import {getLNService, loadNWCUrl} from '../nostr/nostr';

export function time4Ad() {
  // Only show ad if its been at least 15 minutes from last ad
  let lastadtime = localStorage.getItem('lastad.timechecked');
  let fetchad = (lastadtime == undefined || lastadtime < (Date.now() - (15*60*1000)));
  if(fetchad) {
    localStorage.setItem('lastad.timechecked', Date.now());
  }
  return fetchad;
}

export function value4valueAdSkip () {  
  try {
    if (localStorage.getItem('nwc.enabled') != 'true') return false;
    if (localStorage.getItem('v4v2skipad.enabled') != 'true') return false;
    let v4vAmount = localStorage.getItem('v4v2skipad.amount');
    if (v4vAmount == undefined) return false;
    v4vAmount = Math.floor(v4vAmount);
    if (v4vAmount < 1) return false;
    let nwcUrl = loadNWCUrl();  // cannot be const, as the webln.NostrWebLNProvider wants to modify values
    if (nwcUrl == undefined) {
      console.log('Unable to skip ad. Nostr Wallet Connect url not found');
      return false;
    }
    const v4vAmountMSats = v4vAmount * 1000; 
    let x = (async () => { 
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const lightningAddress = window.jamConfig.v4vLN;
      const lnService = await getLNService(lightningAddress);
      const durationLNService = Math.floor(Date.now() / 1000) - currentTimestamp;
      const jamID = JSON.parse(localStorage.getItem('identities'))._default.publicKey;
      const comment = encodeURI(`🌽💬🎑 ${jamID} ${currentTimestamp}`);
      const lnurl = `${lnService.callback}?amount=${v4vAmountMSats}&comment=${comment}`;
      const invoiceResponse = await fetch(lnurl);
      const durationInvoice = Math.floor(Date.now() / 1000) - currentTimestamp;
      const invoice = await invoiceResponse.json();
      const durationJSON = Math.floor(Date.now() / 1000) - currentTimestamp;
      const paymentRequest = invoice.pr;
      const nwc = new webln.NostrWebLNProvider({nostrWalletConnectUrl: nwcUrl});
      await nwc.enable();
      const durationNWC = Math.floor(Date.now() / 1000) - currentTimestamp;
      const nwcResponse = await nwc.sendPayment(paymentRequest);
      const durationPayment = Math.floor(Date.now() / 1000) - currentTimestamp;
      //console.log({lnservice: durationLNService, invoice: durationInvoice, json: durationJSON, nwc: durationNWC, payment: durationPayment });
      if (nwcResponse?.preimage) {
        console.log(`Value 4 Value payment completed (${v4vAmount} sats for skipping ad). Preimage: ${nwcResponse.preimage}`)
        return true;
      }
      console.log('Unable to skip ad. Nostr Wallet Connect payment did not return a preimage');
      return false;
    })();
    //console.log('x in value4valueadskip: ', x);
    return x; // always a pending promise
  } catch (e) {
    console.log('error while attempting to skip ad', e);
    return false;
  }
}