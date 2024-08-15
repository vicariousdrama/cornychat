import React, {useState} from 'react';
import {QRCodeSVG} from 'qrcode.react';
import {Modal} from './Modal';
import {useJam} from '../jam-core-react';
import {colors, isDark} from '../lib/theme';
import {getUserMetadata, loadNWCUrl, openLNExtension, zapEvent} from '../nostr/nostr';
import {webln} from "@getalby/sdk";
import {nip19} from 'nostr-tools';
import {defaultState} from '../jam-core/state';

const DisplayInvoice = ({invoice, shortInvoice, room}) => {
  const [wasCopied, setWasCopied] = useState(false);
  let colorTheme = room?.color ?? 'default';
  let roomColors = colors(colorTheme, room.customColor);

  const handleCopy = () => {
    setWasCopied(true);
    navigator.clipboard.writeText(invoice);

    setTimeout(() => {
      setWasCopied(false);
    }, 2500);
  };

  return (
    <div className="p-6 rounded-lg bg-gray-700">
      <h2 className="text-2xl font-bold text-gray-200">Here's your invoice:</h2>
      <div className="flex justify-center bg-white m-4 p-4">
        <QRCodeSVG value={invoice} size={256} />
      </div>
      <div className="mt-5 text-center">
        <p className="text-sm text-gray-200">{shortInvoice}...</p>
        <button
          onClick={handleCopy}
          className="select-none px-5 h-12 text-lg text-white focus:shadow-outline active:bg-gray-600"
          style={{backgroundColor: roomColors.buttons.primary}}
        >
          {wasCopied ? 'Copied' : 'Copy LN invoice'}
        </button>
      </div>
    </div>
  );
};

export const InvoiceEventModal = ({event, lud16, close}) => {
  const [comment, setComment] = useState(localStorage.getItem('zaps.defaultComment') ?? 'Zapping from Corny Chat!');
  const [amount, setAmount] = useState(localStorage.getItem('zaps.defaultAmount') ?? (localStorage.getItem('defaultZap') ?? ''));
  const [state, {sendTextChat}] = useJam();
  const [displayInvoice, setDisplayInvoice] = useState(false);
  const [invoice, setInvoice] = useState('');
  const [displayError, setDisplayError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const npub = (!event.npub && event.pubkey ? nip19.npubEncode(event.pubkey) : event.npub); // target of the zap is the pubkey that authored the event
  const shortLnInvoice = invoice.substring(0, 17);
  const nwcEnabled = (localStorage.getItem("nwc.enabled") ?? 'false') == 'true';

  // Load user metadata if not found in session, and then store it
  if(sessionStorage.getItem(npub) == undefined) {
    let metadata = (async () => {
      let pubkey = nip19.decode(npub).data;
      await getUserMetadata(pubkey, null);
    })();
  }
  const userMetadata = JSON.parse(sessionStorage.getItem(npub));
  const lightningAddress = (lud16 ? lud16 : userMetadata?.lightningAddress);  // use override lud16 if provided, else fallback to the address for the npub

  let room = {color: 'default', customColor: defaultState.room.customColor}

  let colorTheme = room?.color ?? 'default';
  let roomColors = colors(colorTheme, room.customColor);

  const textColor = isDark(roomColors.buttons.primary)
    ? roomColors.text.light
    : roomColors.text.dark;


  async function handleResult(result) {
    const ok = result[0];
    const msgValue = result[1]; // error message if ok != true. Else its a payment request
    if (ok) {
      const paymentRequest = msgValue;
      // attempt using nwc config
      if(nwcEnabled) {
        let nwcUrl = loadNWCUrl(); // cannot be const, as the webln.NostrWebLNProvider wants to modify values
        if (nwcUrl != undefined) {
          const nwc = new webln.NostrWebLNProvider({nostrWalletConnectUrl: nwcUrl});
          await nwc.enable();
          const nwcResponse = await nwc.sendPayment(paymentRequest);
          if (nwcResponse?.preimage) {
            // Add zap info to chat
            let chatText = `*zapped ${lightningAddress} ⚡${amount} sats : ${comment}*`;
            (async () => {await sendTextChat(chatText);})(); // send to swarm (including us) as text-chat
            // Done
            close();
            return;
          } else {
            alert('Nostr Wallet Connect payment did not return preimage.');
          }
        }
      }
      // still here? try using browser extension
      const response = await openLNExtension(paymentRequest);
      if (response?.preimage) {
        // Add zap info to chat
        let chatText = `*zapped ${lightningAddress} ⚡${amount} sats : ${comment}*`;
        (async () => {await sendTextChat(chatText);})(); // send to swarm (including us) as text-chat
        // Done
        close();
        return;
      }
      // still here? show invoice and expect them to pay externally
      setDisplayInvoice(true);
      setInvoice(paymentRequest);
    } else {
      setDisplayError(true);
      setErrorMsg(msgValue.message);
      setIsLoading(false);
      setAmount('');
      setComment('');
    }
  }

  function handleDefaultZap() {
    const defaultZap = localStorage.getItem('defaultZap');
    if (!defaultZap) {
      setAmount(1);
    } else {
      setAmount(defaultZap);
    }
  }

  const LoadingIcon = () => {
    return (
      <div className="flex justify-center px-4">
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 6.627 5.373 12 12 12v-4c-3.313 0-6-2.687-6-6z"
          ></path>
        </svg>
      </div>
    );
  };

  return (
    <Modal close={close}>
      {displayInvoice ? (
        <DisplayInvoice
          invoice={invoice}
          shortInvoice={shortLnInvoice}
          room={room}
        />
      ) : (
        <div className="bg-white p-6 rounded-lg bg-gray-700 text-gray-200">
          <h2 className="text-2xl font-bold" style={{overflowWrap: 'anywhere'}}>
            Send some sats 
            {lightningAddress && (` to ${lightningAddress}`)}
            {event?.content && (` for ${event.content}`)}
          </h2>

          <div className="flex mb-5 w-full justify-between">
            <div className="mx-2 w-2/4">
              <button
                className="w-full text-sm px-4 py-2 rounded-md m-2"
                style={{
                  backgroundColor: roomColors.buttons.primary,
                  color: textColor,
                }}
                onClick={handleDefaultZap}
              >
                Default
              </button>

              <button
                className="w-full text-sm px-4 py-2 rounded-md m-2"
                style={{
                  backgroundColor: roomColors.buttons.primary,
                  color: textColor,
                }}
                onClick={() => setAmount('21')}
              >
                21 sats
              </button>
            </div>

            <div className="mx-2 w-2/4">
              <button
                className="w-full text-sm px-4 py-2 rounded-md m-2"
                style={{
                  backgroundColor: roomColors.buttons.primary,
                  color: textColor,
                }}
                onClick={() => setAmount('1000')}
              >
                1000 sats
              </button>
              <button
                className="w-full text-sm px-4 py-2 rounded-md m-2"
                style={{
                  backgroundColor: roomColors.buttons.primary,
                  color: textColor,
                }}
                onClick={() => setAmount('2000')}
              >
                2000 sats
              </button>
            </div>
          </div>

          {/* Input 1 */}
          <input
            type="number"
            className="w-full p-2 border border-gray-300 bg-gray-400 text-black placeholder-black mb-4"
            placeholder="Custom amount"
            value={amount}
            onChange={e => {
              setAmount(e.target.value);
            }}
          />

          {/* Input 2 */}
          <input
            type="text"
            className="w-full p-2 border border-gray-300 bg-gray-400 text-black placeholder-black mb-4"
            placeholder="Comment (optional)"
            value={comment}
            onChange={e => {
              setComment(e.target.value);
            }}
          />

          {/* Button */}
          <button
            className="py-2 px-4 rounded text-center w-full"
            style={{
              backgroundColor: roomColors.buttons.primary,
              color: textColor,
            }}
            onClick={async () => {
              setIsLoading(true);
              const result = await zapEvent(
                npub,
                event,
                comment,
                amount
              );
              await handleResult(result);
            }}
          >
            {isLoading ? <LoadingIcon /> : (nwcEnabled ? 'Pay with Nostr Wallet Connect' : 'Create Invoice')}
          </button>

          <div className="mt-5">
            {displayError ? <p className="text-red-500">{errorMsg}</p> : null}
          </div>
        </div>
      )}
    </Modal>
  );
};

