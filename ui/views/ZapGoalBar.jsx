import React, {useEffect} from 'react';
import {Modal, openModal} from './Modal';
import {InvoiceEventModal} from './InvoiceEvent';
import {getZapReceipts} from '../nostr/nostr';
import {nip19} from 'nostr-tools';

export default function ZapGoalBar({
    zapgoal,
    lud16,
}) {
    let width = 300;
    let goalAmount = 0;
    let remainAmount = 0;
    let goalDescription = zapgoal.content;
    for (let t of zapgoal.tags) {
        if (t.length > 1 && t[0] == "amount") goalAmount = Math.floor(Math.floor(t[1])/1000);
    }
    if (!zapgoal.hasOwnProperty("npub") && zapgoal.hasOwnProperty("pubkey")) {
        zapgoal.npub = nip19.npubEncode(zapgoal.pubkey);
    }
    let totalSats = 0; // default for testing display, and sampling progress
    let fillWidth = goalAmount > 0 ? Math.floor((totalSats/goalAmount) * width) : width;
    if (fillWidth > (width - 2)) fillWidth = width - 2;
    if (fillWidth < 1) fillWidth = 1;
    let unfilledWidth = (width - 2) - fillWidth;
    let fillbarStyle = {backgroundColor: 'rgb(24,128,24)',  height: '18px', width: String(fillWidth) + 'px'}
    let unfilledBarStyle = {backgroundColor: 'rgb(64,32,0)', height: '18px', width: String(unfilledWidth) + 'px'}
    let textStyle = {marginTop: '0px', marginLeft: '2px', marginRight: '2px', position: 'relative', color: 'rgb(212,212,212)'}

    function setWidths(totalSats) {
        let width = document.getElementById('zapgoal').parentElement.parentElement.clientWidth;
        fillWidth = goalAmount > 0 ? Math.floor((totalSats/goalAmount) * width) : width;
        if (fillWidth > (width - 2)) fillWidth = width - 2;
        let unfilledWidth = (width - 2) - fillWidth;
        let leftok = (fillWidth > (width/4));
        let rightok = (unfilledWidth > (width/4));
        document.getElementById("zapgoal_filled_text").innerText = leftok ? (rightok ? totalSats : totalSats + " / " + goalAmount) : "";
        document.getElementById("zapgoal_filled_text").style.textAlign = leftok ? (rightok ? 'right' : 'center') : 'center';
        document.getElementById("zapgoal_unfilled_text").innerText = rightok ? (leftok ? (remainAmount > 0 ? String(remainAmount) + " to go" : goalAmount): totalSats + " / " + goalAmount) : "";
        document.getElementById("zapgoal_unfilled_text").style.textAlign = rightok ? (leftok ? 'left' : 'center') : 'center';
        document.getElementById("zapgoal_filled").style.width = String(fillWidth) + "px";
        document.getElementById("zapgoal_unfilled").style.width = String(unfilledWidth) + "px";
        document.getElementById("zapgoal_unfilled").style.border = `${unfilledWidth <= 0 ? 0 : 1}px solid rgb(255,128,0)`;
        document.getElementById("zapgoal").setAttribute("title", String(totalSats) + " sats towards goal of " + goalAmount);
    }

    async function _checkZaps(zapgoal) {
        let receipts = await getZapReceipts(zapgoal.id);
        let totalSats = 0;
        // TODO: more validation
        for (let receipt of receipts) {
            for (let tag of receipt?.tags) {
                if (tag.length > 1 && tag[0] != "description") continue;
                let v = tag[1];
                try {
                    let o = JSON.parse(v);
                    if (o.hasOwnProperty("tags")) {
                        for (let t of o.tags) {
                            if (t.length < 2) continue;
                            if (t[0] != "amount") continue;
                            let msats = t[1];
                            let sats = Math.floor(msats/1000);
                            totalSats += sats;
                        }
                    }
                } catch (e) {
                    console.log('error parsing a zap receipt: ', e);
                }
            }
        }
        remainAmount = goalAmount - totalSats;
        // with total, update the calculations
        setWidths(totalSats);
    }

    useEffect(() => {
        let timeoutWidth = setTimeout(() => {
            setWidths(totalSats);
        },1234);

        // Initial check in 3 seconds
        let timeoutInitialReceipts = setTimeout(() => {
            const loadZapReceipts = async () => {let r = await _checkZaps(zapgoal);} 
            loadZapReceipts();
        }, 3 * 1000); // 3 seconds to load
        // Keep checking every 15 seconds
        let frequencyReceipts = 15 * 1000; // 15 seconds
        let intervalReceipts = setInterval(() => {
            const loadZapReceipts = async () => {let r = await _checkZaps(zapgoal);}
            loadZapReceipts();
        }, frequencyReceipts);

        // This function is called when component unmounts
        return () => {
            clearTimeout(timeoutWidth);
            clearTimeout(timeoutInitialReceipts);
            clearInterval(intervalReceipts);
        }
    }, []);

    return (
        <center key={`zapgoal_${zapgoal.id}`}>
        <div id="zapgoal" className="mx-0 text-xs cursor-pointer w-full"
            onClick={() => {
                openModal(InvoiceEventModal, {event: zapgoal, lud16: lud16});
              }}
        >
            <div className="px-0 text-xs text-white bg-gray-500">
                Click to Zap Goal: {goalDescription}
            </div>
            <div className="flex flex-wrap text-md">
                <div id="zapgoal_filled" className="px-0" style={fillbarStyle}><div id="zapgoal_filled_text" style={textStyle}></div></div>
                <div id="zapgoal_unfilled" className="px-0" style={unfilledBarStyle}><div id="zapgoal_unfilled_text" style={textStyle}></div></div>
            </div>
        </div>
        </center>
    );
}
