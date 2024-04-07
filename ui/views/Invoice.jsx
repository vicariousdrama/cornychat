import React, {useState} from 'react';
import {QRCodeSVG} from 'qrcode.react';
import {Modal} from './Modal';
import {useJam} from '../jam-core-react';
import {colors, isDark} from '../lib/theme';
import {sendZaps, openLNExtension} from '../nostr/nostr';

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

export const InvoiceModal = ({info, room, close}) => {
  const [comment, setComment] = useState('');
  const [amount, setAmount] = useState(localStorage.getItem('defaultZap'));
  const [state, {signEvent}] = useJam();
  const [displayInvoice, setDisplayInvoice] = useState(false);
  const [invoice, setInvoice] = useState('');
  const [displayError, setDisplayError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const npub = findNpub(info.identities);
  const shortLnInvoice = invoice.substring(0, 17);

  const userMetadata = JSON.parse(sessionStorage.getItem(npub));
  const lightningAddress = userMetadata?.lightningAddress;

  let colorTheme = room?.color ?? 'default';
  let roomColors = colors(colorTheme, room.customColor);

  const textColor = isDark(roomColors.buttons.primary)
    ? roomColors.text.light
    : roomColors.text.dark;

  async function handleResult(result) {
    const ok = result[0];
    const msgValue = result[1];
    if (ok) {
      const response = await openLNExtension(msgValue);

      if (response?.preimage) {
        close();
        return;
      }
      setDisplayInvoice(true);
      setInvoice(msgValue);
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
//      setDisplayError(true);
//      setErrorMsg('You have not set up a default zap amount');
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
          <h2 className="text-2xl font-bold">Send some sats {lightningAddress ? `to ${lightningAddress}` : null } : </h2>

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
              const result = await sendZaps(
                npub,
                comment,
                amount,
                state,
                signEvent
              );
              await handleResult(result);
            }}
          >
            {isLoading ? <LoadingIcon /> : 'Create Invoice'}
          </button>

          <div className="mt-5">
            {displayError ? <p className="text-red-500">{errorMsg}</p> : null}
          </div>
        </div>
      )}
    </Modal>
  );
};

function findNpub(identities) {
  const npub = identities?.find(identity =>
    identity.type === 'nostr' ? identity.id : null
  ).id;

  return npub;
}
