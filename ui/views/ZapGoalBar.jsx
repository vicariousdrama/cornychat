import React, {useEffect} from 'react';
import {Modal, openModal} from './Modal';
import {InvoiceEventModal} from './InvoiceEvent';
import {getZapReceipts} from '../nostr/nostr';
import {nip19} from 'nostr-tools';

export default function ZapGoalBar({
    zapgoal,
    lud16,
    backgroundColorTitle,
    backgroundColorFilled,
    backgroundColorUnfilled,
    borderColorUnfilled,
    textColorTitle,
    textColorFilled,
    textColorUnfilled,
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
    if (fillWidth > width) fillWidth = width;
    if (fillWidth < 1) fillWidth = 1;
    let unfilledWidth = width - fillWidth;
    let barStyleFilled = {backgroundColor: backgroundColorFilled,  height: '18px', width: String(fillWidth) + 'px'}
    let barStyleUnfilled = {backgroundColor: backgroundColorUnfilled, height: '18px', width: String(unfilledWidth) + 'px'}
    let textStyleFilled = {marginTop: '0px', marginLeft: '2px', marginRight: '2px', position: 'relative', color: textColorFilled}
    let textStyleUnfilled = {marginTop: '0px', marginLeft: '2px', marginRight: '2px', position: 'relative', color: textColorUnfilled}

    function setWidths(totalSats) {
        let zg = document.getElementById("zapgoal");
        let width = 100;
        if (zg) width = zg.parentElement.parentElement.clientWidth;
        fillWidth = goalAmount > 0 ? Math.floor((totalSats/goalAmount) * width) : width;
        if (fillWidth > width) fillWidth = width;
        let unfilledWidth = width - fillWidth;
        let leftok = (fillWidth > (width/4));
        let rightok = (unfilledWidth > (width/4));
        let zu = document.getElementById("zapgoal_unfilled");
        let zut = document.getElementById("zapgoal_unfilled_text");
        let zf = document.getElementById("zapgoal_filled");
        let zft = document.getElementById("zapgoal_filled_text");
        if (zft) zft.innerText = leftok ? (rightok ? totalSats : totalSats + " / " + goalAmount) : "";
        if (zft) zft.style.textAlign = leftok ? (rightok ? 'right' : 'center') : 'center';
        if (zut) zut.innerText = rightok ? (leftok ? (remainAmount > 0 ? String(remainAmount) + " to go" : goalAmount): totalSats + " / " + goalAmount) : "";
        if (zut) zut.style.textAlign = rightok ? (leftok ? 'left' : 'center') : 'center';
        if (zf) zf.style.display = fillWidth > 0 ? 'inline' : 'none';
        if (zf) zf.style.width = String(fillWidth) + "px";
        if (zu) zu.style.display = unfilledWidth > 0 ? 'inline' : 'none';
        if (zu) zu.style.width = String(unfilledWidth) + "px";
        if (zu) zu.style.border = `${unfilledWidth <= 0 ? 0 : 1}px solid ${borderColorUnfilled}`;
        if (zg) zg.setAttribute("title", String(totalSats) + " sats towards goal of " + goalAmount);
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
        },388);

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
            <div className="px-0 text-xs"
                style={{backgroundColor: backgroundColorTitle, color: textColorTitle}}>
                Click to Zap Goal: {goalDescription}
            </div>
            <div className="flex flex-wrap text-md">
                <div id="zapgoal_filled" className="px-0" style={barStyleFilled}><div id="zapgoal_filled_text" style={textStyleFilled}></div></div>
                <div id="zapgoal_unfilled" className="px-0" style={barStyleUnfilled}><div id="zapgoal_unfilled_text" style={textStyleUnfilled}></div></div>
            </div>
        </div>
        </center>
    );
}
