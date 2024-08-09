import React, {useState, useEffect} from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import {isDark} from '../lib/theme';
import {useJamState} from '../jam-core-react/JamContext';
import {useJam} from '../jam-core-react';
import {MicOnSvg, Links, Audience} from './Svg';
import {openModal} from './Modal';
import {InvoiceModal} from './Invoice';
import {tipRoom, time4Ad, time4Tip, value4valueAdSkip, zapRoomGoal} from '../lib/v4v';
import {publishStatus} from '../nostr/nostr';
import ZapGoalBar from './ZapGoalBar';

export default function RoomHeader2({
    colors,
    name,
    description,
    logoURI,
    roomLinks,
    showLinks,
    setShowLinks,
    audience,
    closed,
    lud16,
    room,
    roomId,
}) {
    let [isRecording, isPodcasting] = useJamState([
        'isSomeoneRecording',
        'isSomeonePodcasting',
    ]);
    isRecording = isRecording || isPodcasting;
    const textColor = isDark(colors.avatarBg) ? colors.text.light : colors.text.dark;
    const iconColor = isDark(colors.avatarBg) ? colors.icons.light : colors.icons.dark;  
    const [displayDescription, setDisplayDescription] = useState(false);
    const [autoTipRoom, setAutoTipRoom] = useState((localStorage.getItem(`roomtip-${roomId}.enabled`) ?? 'false') == 'true');
    const [state, {sendTextChat, sendCSAR, getRoomATag}] = useJam();
    let textchats = JSON.parse(localStorage.getItem(`${roomId}.textchat`) || '[]');
    let {npub} = room || {};
    if (npub == undefined || npub == "") npub = `fakenpub-${roomId}`;
    let roomInfo = {identities:[{type:"nostr",id:npub}]};
    let autoTipAmount = localStorage.getItem('v4vtiproom.amount') ?? '10';
    let autoTipFrequency = localStorage.getItem('v4vtiproom.frequency') ?? '15';
    if (room?.zapGoal?.id != undefined) {
        room.zapGoal.tags = [["amount", String(room.zapGoal.amount * 1000)]];
    }

    function toggleTipRoom(b) {
        localStorage.setItem(`roomtip-${roomId}.enabled`, (b?'true':'false'));
        setAutoTipRoom(b);
    }

    // Ensure required lightning address info stored in session
    if(sessionStorage.getItem(npub) == undefined && room.lud16) {
        sessionStorage.setItem(npub, JSON.stringify({lightningAddress: room.lud16}));
    }

    useEffect(() => {
        let textDeduplicaterToggle = true;
        // Indicate that we entered the chat
        let timeoutEntered = undefined;
        const entertimeout = 1*500;
        timeoutEntered = setTimeout(() => {
            if (textchats == undefined || textchats.length == 0) {
                (async () => {await sendTextChat("*has entered the chat!*");})();
            }        
        }, entertimeout);
        // Room Tipping
        const roomtiptimeout = 1*60*1000;
        const roomtipinterval = 1*60*1000; // once a minute
        let timeoutRoomTip = undefined;
        let intervalRoomTip = undefined;
        timeoutRoomTip = setTimeout(() => {
            intervalRoomTip = setInterval(() => {
                const v4vtiproomEnabled = ((localStorage.getItem(`v4vtiproom.enabled`) ?? 'false') == 'true');
                const thisroomTipEnabled = ((localStorage.getItem(`roomtip-${roomId}.enabled`) ?? 'false') == 'true');
                if (v4vtiproomEnabled && thisroomTipEnabled && room.lud16) {
                    if (time4Tip(roomId)) {
                        const roomtipamount = Math.floor(localStorage.getItem(`v4vtiproom.amount`) ?? '0');
                        textDeduplicaterToggle = !textDeduplicaterToggle;

                        if(room?.zapGoal?.id) {
                            // Send periodic tip to the zap goal set
                            let chatText = `*zapped ⚡${roomtipamount} sats${textDeduplicaterToggle ? " to the room goal!":"."}*`;
                            (async () => {
                                let zapped = await zapRoomGoal(room.zapGoal, roomId, room.lud16, roomtipamount, sendTextChat, chatText);
                                if (!zapped) {
                                    console.log("zapping room goal failed");
                                }
                            })();
                        } else {
                            // Tip goes straight to room owner's lightning address set
                            // TODO: convert to zap?
                            let chatText = `*tipped the room owner ⚡${roomtipamount} sats${textDeduplicaterToggle ? "!":"."}*`;
                            (async () => {
                            let tipped = await tipRoom(roomId, room.lud16, roomtipamount, sendTextChat, chatText);
                            if (!tipped) {
                                console.log("room tip failed");
                            }                        
                            })();
                        }
                    }
                }
            }, roomtipinterval);
        }, roomtiptimeout);
        // Dev Tipping
        let adidx = Math.floor(Date.now() / 1000);
        const chatadinterval = 1*60*1000; // once a minute
        let intervalAdSkip = setInterval(() => {
            let textchatAds = (localStorage.getItem(`textchat.adsenabled`) ?? true);
            let bufferSize = localStorage.getItem(`textchat.bufferSize`) || 50;
            if(textchatAds) {
                if(time4Ad()) {
                    const adskipamount = Math.floor(localStorage.getItem('v4v2skipad.amount') ?? '0');
                    textDeduplicaterToggle = !textDeduplicaterToggle;
                    let chatText = `*tipped the corny chat dev ⚡${adskipamount} sats${textDeduplicaterToggle ? "!":"."}*`;
                    (async () => {
                        let v4vadskip = await value4valueAdSkip('RoomChat', sendTextChat, chatText);
                        if (!v4vadskip) {
                            if (jamConfig.handbill) {
                                adidx += 1;
                                let adreqdt = Math.floor(Date.now() / 1000);
                                let adPeerId = `ad-${adidx}`;
                                let textchat = `/chatad:${adidx}:${adreqdt}`;
                                if (!textchats) textchats = [];
                                let lastline = textchats.slice(-1);
                                let textTime = Math.floor(Date.now() / 1000);
                                if ((lastline.length == 0) || (lastline[0].length != 2) || (lastline[0][0] != adPeerId) || (lastline[0][1] != textchat)) {
                                textchats.push([adPeerId, textchat, false, null, textTime]);
                                textchats = textchats.slice(-1 * bufferSize);
                                localStorage.setItem(`${roomId}.textchat`, JSON.stringify(textchats));
                                //let n = Math.floor(sessionStorage.getItem(`${roomId}.textchat.unread`) ?? 0) + 1;
                                //sessionStorage.setItem(`${roomId}.textchat.unread`, n);
                                }
                            }
                        } else {
                            console.log("dev tip failed");
                        }
                    })();
                }
            }
        }, chatadinterval);
        // Status Update
        let statusintervalReport = 60*60*1000;  // once an hour
        let statusintervalCheck = 1*60*1000;  // once a minute
        let intervalStatusUpdate = setInterval(() => {
            const publishStatusEnabled = (localStorage.getItem('publishStatus.enabled') ?? 'false') == 'true';
            const publishStatusLastTime = (localStorage.getItem('publishStatus.timechecked') ?? 0);
            if (publishStatusLastTime < Date.now() - statusintervalReport) {
                if (publishStatusEnabled && window.nostr) {
                    const urlStatus = `${jamConfig.urls.jam}/${roomId}`;
                    const nostrStatus = `${urlStatus}`;
                    let r = (async () => {await publishStatus(nostrStatus, urlStatus);})();
                    localStorage.setItem('publishStatus.timechecked', Date.now());
                    sendCSAR("nostrstatus");
                }
            }
        }, statusintervalCheck);
        
        // Room ATag
        let atagdelay = 1*5*1000; // once after 5 seconds
        let atagfetching = false;
        let timeoutATagUpdate = setTimeout(() => {
            if (
                (localStorage.getItem('textchat.tonostr') || 'false') == 'true' && 
                (room.isLiveActivityAnnounced || 'false') == 'true'
            ) {
                let atagkey = `${roomId}.atag`;
                let roomATag = sessionStorage.getItem(atagkey) || '';
                if (roomATag.length == 0 && !atagfetching) {
                    atagfetching = true;
                    let r = (async () => {
                        roomATag = await getRoomATag(roomId);
                        sessionStorage.setItem(atagkey, roomATag);
                        atagfetching = false;
                    })();
                }
            }
        }, atagdelay);
        // This function is called when component unmounts
        return () => {
            clearTimeout(timeoutEntered);
            clearInterval(intervalRoomTip);
            clearTimeout(timeoutRoomTip);
            clearInterval(intervalAdSkip);
            clearInterval(intervalStatusUpdate);
            clearTimeout(timeoutATagUpdate);
        }
    }, []);

    function RoomLinks() {
        return (
        <div
            key="roomLinks"
            className="absolute z-10 w-72 mr-3 overflow-y-scroll p-3 rounded-lg cursor-pointer"
            style={{backgroundColor: colors.avatarBg, maxHeight: '512px', top: '30px', left: '3%', width: '94%', border: '1px solid white'}}
            onClick={() => setShowLinks(false)}
        >
            {!roomLinks || roomLinks.length === 0 ? (
            <p className="text-xs" style={{color: textColor}}>
                This room has no Links
            </p>
            ) : (
            <p className="flex justify-center" style={{color: textColor}}>ROOM LINKS</p>
            )}
            {roomLinks && roomLinks.length > 0 ? (
            roomLinks.map((links,index) => {
                let linkNumber = 1 + index;
                let roomlinkkey = `roomlinkkey_${linkNumber}`;
                return (
                <div key={roomlinkkey} className="mb-2">
                    <a href={links[1]} target="_blank">
                    <p className="text-xs" style={{color: textColor}}>
                        {linkNumber}. {links[0]}
                    </p>
                    <p className="text-xs opacity-60" style={{color: textColor}}>
                        {links[1]}
                    </p>
                    </a>
                </div>
                );
            })
            ) : null}
        </div>
        );
    }

    function RoomDescription() {
        return (
        <div
            className="markdown z-10"
            style={{backgroundColor: colors.avatarBg, color: textColor, maxHeight: '512px', top: '30px', left: '3%', width: '94%', border: '1px solid white'}}
            onClick={async () => {
            setDisplayDescription(false);
            }}
        >
            <div className="flex">
                <div className="flex">
                {logoURI && (
                    <img
                    alt={'room icon'}
                    className="w-24 h-24 rounded p-0 m-0 mt-0 mr-4"
                    src={logoURI}
                    style={{objectFit: 'cover', display: 'none', cursor: lud16 ? 'pointer' : 'auto'}}
                    onLoad={e => (e.target.style.display = '')}
                    onClick={() => {
                        if(lud16) {
                        openModal(InvoiceModal, {info: roomInfo, room: room});
                        }
                    }}
                    />
                )}
                </div>            
                <div className="flex-grow text-sm mx-4">
                    {room.stageOnly ? 'Stage Only - everyone in the room will be able to speak' : 'Managed Speakers - moderators facilitate who can speak in the room'}<br />
                    {room.isPrivate ? 'Private Room - the room is not displayed on landing page or announced by bot' : 'Public Room - this room appears on the home page and announced by bot'}<br />
                    {room.isProtected ? 'Password Protected - requires passphrase for entry' : 'All Access Room - anyone with the room link can enter'}<br />
                    {room.isRecordingAllowed ? 'Recordings Allowed - when a recording is in progress, an indicator will be displayed' : 'Recordings Disabled - recordings are not supported for this room'}<br />
                    {room.isLiveActivityAnnounced ? 'Live Activity - an event will be published to nostr and updated periodically with room information.' : ''}
                </div>
                <hr />
            </div>

            {!description || description.length === 0 ? (
            <p className="text-xs" style={{color: textColor}}>
                This room has not set up a description yet.
            </p>
            ) : (
            <p className="flex justify-center" style={{color: textColor}}>ROOM DESCRIPTION</p>
            )}
            {description && (description.length > 0) && (
            <ReactMarkdown
            className="text-sm opacity-70 h-full mt-3"
            plugins={[gfm]}
            transformLinkUri={customUriTransformer}
            >
            {description}
            </ReactMarkdown>
            )}
        </div>
        );
    }


  return (
    <>
        <div className="flex justify-between m-0">
            <div className="flex-grow cursor-pointer"
                onClick={async () => {
                setDisplayDescription(!displayDescription);
                setShowLinks(false);
                }}
            >
                <div
                className="flex flex-wrap px-1 py-1"
                style={{backgroundColor: colors.avatarBg, overflow: 'hidden', maxHeight: '116px'}}
                >
                <p className="text-md mr-2" style={{color: textColor, maxHeight: '22px'}}>
                    {name || roomId}
                </p>
                </div>
                {displayDescription && <RoomDescription />}
            </div>
        </div>
        {(lud16) && (
        <div className="flex justify-between m-0 w-full">
            <div className="flex w-full">
                {room?.zapGoal?.id && (
                <ZapGoalBar zapgoal={room.zapGoal} />
                )}
                {!room?.zapGoal?.id && (
                <>
                {((localStorage.getItem(`v4vtiproom.enabled`) ?? 'false') == 'true') && autoTipRoom && (
                <div className="flex-grow cursor-pointer"
                    style={{textAlign:'center',backgroundColor:'rgba(21,21,21,1)',color:'rgba(21,221,21,.8'}}              
                    onClick={() => {toggleTipRoom(false)}}
                >Autotipping {autoTipAmount} sats every {autoTipFrequency} minutes</div>
                )}
                {((localStorage.getItem(`v4vtiproom.enabled`) ?? 'false') == 'true') && !autoTipRoom && (
                <div className="flex-grow cursor-pointer"
                    style={{textAlign:'center',backgroundColor:'rgba(21,21,21,1)',color:'rgba(221,21,21,.8'}}              
                    onClick={() => {toggleTipRoom(true)}}
                >Autotipping is off. Click to enable.</div>
                )}
                </>
                )}
            </div>
        </div>
        )}
        <div className="flex justify-between m-0">
            <div className="flex">
                {!room?.zapGoal?.id && lud16 && (
                <div className="flex w-16 h-6 cursor-pointer bg-yellow-200"
                    style={{backgroundColor:'rgba(21,21,21,1)',color:'rgba(221,142,42,.8'}}              
                    onClick={() => {openModal(InvoiceModal, {info: roomInfo, room: room});}}
                    title="Send sats to the lightning address set by the owner of this room"
                >⚡ Tip</div>
                )}
                {room?.zapGoal?.id && lud16 && (
                <>
                    {((localStorage.getItem(`v4vtiproom.enabled`) ?? 'false') == 'true') && autoTipRoom && (
                    <div className="flex items-center justify-center w-16 h-6 text-xs mx-0 cursor-pointer"
                        style={{textAlign:'center',backgroundColor:'rgba(21,21,21,1)',color:'rgba(21,221,21,.8'}}              
                        onClick={() => {toggleTipRoom(false)}}
                        title={`You are tipping ${autoTipAmount} sats every ${autoTipFrequency} minutes`}
                    >Tips: ON</div>
                    )}
                    {((localStorage.getItem(`v4vtiproom.enabled`) ?? 'false') == 'true') && !autoTipRoom && (
                    <div className="flex items-center justify-center w-16 h-6 text-xs mx-0 cursor-pointer"
                    style={{textAlign:'center',backgroundColor:'rgba(21,21,21,1)',color:'rgba(221,21,21,.8'}}              
                    onClick={() => {toggleTipRoom(true)}}
                    title={`You are currently not autotipping this room`}
                    >Tips: OFF</div>
                    )}
                </>
                )}
                {closed && (
                <div className="flex items-center justify-center w-16 h-6 text-xs mx-0 bg-red-50 text-red-500">
                    CLOSED
                </div>
                )}
                {isRecording && (
                <div className="flex items-center justify-center w-16 h-6 text-xs mx-0" aria-label="Recording"
                    style={{
                        backgroundColor: 'rgb(0,0,0)'
                    }}
                >
                    <div>
                        <MicOnSvg className="h-5" stroke="#f80000" />
                    </div>
                    <div style={{color:'#f80000',backgroundColor:'#000000',fontWeight:'bold',fontSize:'1em'}}>
                        REC
                    </div>
                </div>
                )}
                <div className="flex items-center justify-center w-16 h-6 text-xs mx-0"
                    style={{
                        color: isDark(colors.buttons.primary) ? colors.text.light : colors.text.dark,
                        backgroundColor: colors.buttons.primary,
                    }}
                >
                    <Audience color={isDark(colors.buttons.primary) ? colors.icons.light : colors.icons.dark} />
                    <div className="px-1">{audience}</div>
                </div>
                <div className="flex items-center justify-center w-16 h-6 text-xs mx-0 cursor-pointer align-center"
                    style={{
                        color: isDark(colors.avatarBg) ? colors.text.light : colors.text.dark,
                        backgroundColor: colors.avatarBg,
                    }}
                    onClick={() => {
                        setShowLinks(!showLinks);
                        setDisplayDescription(false);
                    }}
                >
                    <Links color={iconColor} />
                    <div className="px-1">
                        {!roomLinks || roomLinks.length === 0 ? '0' : roomLinks.length}
                    </div>
                </div>
                {showLinks ? <RoomLinks /> : null}

                {room.isLiveActivityAnnounced && (
                <div className="flex items-center justify-center w-16 h-6 text-xs mx-0 text-red-500"
                    style={{
                        backgroundColor: 'rgb(0,0,0)'
                    }}
                    title={`Live activity info is periodically published to nostr`}
                >
                    LIVE!
                </div>
                )}
            </div>
        </div>
    </>
  );

}

function customUriTransformer(uri) {
  const schemes = ['bitcoin:', 'lightning:'];
  for (const scheme of schemes) {
    if (uri.startsWith(scheme)) {
      return uri;
    }
  }
  return ReactMarkdown.uriTransformer(uri);
}
