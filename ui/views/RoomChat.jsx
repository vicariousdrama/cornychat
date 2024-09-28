import React, {useState, useEffect} from 'react';
import EmojiConvertor from 'emoji-js';
import {useMqParser} from '../lib/tailwind-mqp';
import {colors, isDark} from '../lib/theme';
import {useJam} from '../jam-core-react';
import {avatarUrl, displayName} from '../lib/avatar';
import {getNpubFromInfo, getRelationshipPetname, makeLocalDate} from '../nostr/nostr';
import {openModal} from './Modal';
import {Profile} from './Profile';
import {Send,Upload} from './Svg';
import {UploadFileModal} from './UploadFileModal';

export default function RoomChat({
    room,
    iModerate,
    iOwn,
    iAmAdmin,
    identities,
    myIdentity,
    peers,
}) {
    const mqp = useMqParser();
    const [state, {sendTextChat}] = useJam();
    let {roomId} = state;
    let textchats = JSON.parse(localStorage.getItem(`${roomId}.textchat`) || '[]');
    let [chatTarget, setChatTarget] = useState('0');
    let [chatText, setChatText] = useState('');
    let [chatScrollPosition, setChatScrollPosition] = useState(sessionStorage.getItem(`${roomId}.textchat.scrollpos`) ?? -999);
    let myId = myIdentity.info.id;
    let textchatLayout = localStorage.getItem("textchat.layout") ?? 'left'; //versus
    let textchatShowNames = ((localStorage.getItem('textchat.showNames') ?? 'true') == 'true');
    let textchatShowAvatar = ((localStorage.getItem('textchat.showAvatars') ?? 'true') == 'true');
    let textchatShowDates = ((localStorage.getItem("textchat.showDates") ?? 'false') == 'true');
    let textchatShowDatesDuration = Math.floor(localStorage.getItem("textchat.showDates.duration") ?? '3600');
    let textchatShowTimestamps = ((localStorage.getItem("textchat.showTimestamps") ?? 'false') == 'true');
    const colorTheme = room?.color ?? 'default';
    const roomColor = colors(colorTheme, room.customColor);
    const textColor = isDark(roomColor.avatarBg) ? roomColor.text.light : roomColor.text.dark;
    const iconColor = isDark(roomColor.buttons.primary) ? roomColor.icons.light : roomColor.icons.dark;
    let spoilercount = 0;
    const emoji = new EmojiConvertor();

    const [time, setTime] = useState(Date.now());
    useEffect(() => {
      let siv = false;
      const intervalChatScroll = setInterval(() => {
        setTime(Date.now());    // forces update ?
        sessionStorage.setItem(`${roomId}.textchat.unread`, 0);
        let rc = document.getElementById('roomChat');
        let c = document.getElementById('chatlines');
        let n = document.getElementById('navbar');
        // text scrolling
        if (c) {
            let p = sessionStorage.getItem(`${roomId}.textchat.scrollpos`) ?? -999;
            let n = (p>=0) ? p : c.scrollHeight;
            if (c.scrollTop != n) c.scrollTop = n;
        }
        // resize to fit?
        if (true && rc && c) {
            let nh0 = 56; // height of selector, text entry, send button
            let mh0 = 224; // minimum height of chatlines
            //try to maximize height of chat
            let nt = n.getClientRects()[0].top;
            let ct = c.getClientRects()[0].top;
            let nh1 = document.body.clientHeight - 232 - ct;
            if (nh1 < mh0) nh1 = mh0; // minimum height for chat lines
            if (ct + nh1 > nt) nh1 = nt - ct; // but not under navbar
            let nh2 = document.body.clientHeight - 176 - ct;
            if (nh2 < (mh0+nh0)) nh2 = (mh0+nh0); // minimum height for chat lines + entry
            if (ct + nh2 > nt) { // but not under navbar
                nh2 = nt - ct;
                if (nh2 < (mh0+nh0)) nh2 = (mh0+nh0); // minimum height for chat lines + entry
                nh1 = nh2 - nh0;
            }
            c.style.height = String(nh1) + 'px';
            c.style.maxHeight = c.style.height;
            rc.style.height = String(nh2) + 'px';
            rc.style.maxHeight = rc.style.height;
        }
        if (!siv) {
            document.getElementById('chatentry').scrollIntoView();
            siv = true;
        }        
      }, 1000);   

      return () => {
        clearInterval(intervalChatScroll);
      };
    }, []);

    function CacheAds() {
        const adskey = 'chatads';
        const chatads = sessionStorage.getItem(adskey);
        let fetchit = (chatads == null || chatads == undefined);
        if (fetchit) {
          (async () => {
            let [newchatads, ok] = await get(`/cimg/`);
            if (ok) {
              sessionStorage.setItem(adskey, JSON.stringify(newchatads));
            }
          })();
        }
    }
    if (jamConfig.handbill) {
        CacheAds();
    }

    function handleUserChatScroll(e) {
        let c = document.getElementById('chatlines');
        if (c) {
            let scrollTop = c.scrollTop;
            let scrollHeight = c.scrollHeight;
            let clientHeight = c.clientHeight;
            let newpos = ((scrollTop) >= (scrollHeight - clientHeight)) ? -1 : scrollTop;
            sessionStorage.setItem(`${roomId}.textchat.scrollpos`, newpos);
            setChatScrollPosition(newpos);
        }
    }

    function uploadFile() {
        openModal(UploadFileModal, {
            roomColor, 
            objectValue: chatText, 
            setObjectValue: setChatText,
        });
    }

    function sendText() {
        if (chatText.length == 0) return;                   // ignore if no text
        if (!chatText.startsWith("cashu")) {
            chatText = chatText.substring(0,615);           // cashu is about 355 for single proof, a token can have multiple proofs
        }
        if (chatText.startsWith("/clear")) {
            localStorage.setItem(`${roomId}.textchat`,JSON.stringify([]));
        } else if (chatText.startsWith("/help")) {
            let textTime = Math.floor(Date.now() / 1000);
            textchats.push([myId, "Supported markdown", false, null, textTime]);
            textchats.push([myId, "• To **bold** surround with 2 *", false, null, textTime]);
            textchats.push([myId, "• To *italicize* surround with 1 *", false, null, textTime]);
            textchats.push([myId, "• To hide spoilers, surround with 2 |", false, null, textTime]);
            textchats.push([myId, "• Emoji shortcodes are surrounded by 1 :", false, null, textTime]);
            textchats.push([myId, "• /help shows this guidance", false, null, textTime]);
            textchats.push([myId, "• /clear resets your text buffer", false, null, textTime]);
            textchats.push([myId, "• /me emotes a statement", false, null, textTime]);
            localStorage.setItem(`${roomId}.textchat`,JSON.stringify(textchats));
        } else {
            (async () => {await sendTextChat(chatText, chatTarget);})(); // send to swarm (including us) as text-chat
        }
        setChatText('');
    }

    function isImage(url) {
        if (url.endsWith(".gif")) return true;
        if (url.endsWith(".jpg")) return true;
        if (url.endsWith(".png")) return true;
        if (url.endsWith(".webp")) return true;
        if (url.startsWith("https://www.tradingview.com/x/")) return true;
        if (url.startsWith("https://imgprxy.stacker.news/")) return true;
        return false;
    }

    function createLinksSanitized(text) {
        // Function to escape HTML entities
        function escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
        // Escape HTML entities in the text
        text = escapeHtml(text);
        // Convert **bold** to <b>bold</b>
        text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        // Convert *italic* to <i>italic</i>
        text = text.replace(/\*(.*?)\*/g, '<i>$1</i>');
        // Convert ||spoilertext|| to <a className="spoiler" id="spoilerlink" href="#spoilerlink" title="Tap to reveal">spoilertext</a>
        let spoilermatches = text.match(/\|\|(.*?)\|\|/);
        if (spoilermatches) {
            for(let spoilermatch of spoilermatches) {
                spoilercount += 1;
                if (spoilercount % 2 == 1) {
                    text = text.replace(/\|\|(.*?)\|\|/, '<a class="spoiler" id="spoilerlink' + spoilercount.toString() + '" href="#spoilerlink' + spoilercount.toString() + '" title="Tap to reveal">$1</a>');
                }
            }
        }
        // Regular expression to match URLs
        const urlRegex = /(\bhttps?:\/\/[^\s<>"']*[^\s<>"'?,]+)/gi;

        // Replace colon-sequences with emojis
        emoji.replace_mode = 'unified';
        emoji.allow_native = true;
        text = emoji.replace_colons(text);

        // Replace URLs with <a> tags
        return text.replace(urlRegex, (match) => {
            // Check if there is a query string or fragment identifier
            const queryOrFragmentIndex = match.search(/[\?#]/);
            let url = match;
            let queryString = '';
            // If there is a query string or fragment identifier, separate it from the base URL
            if (queryOrFragmentIndex !== -1) {
                url = match.substring(0, queryOrFragmentIndex);
                queryString = match.substring(queryOrFragmentIndex);
            }
            if ((queryString.length == 0) && isImage(url)) {
                // Images without a querystring
                const baseImageTag = `<a href="${url}" target="_blank"><img src="${url}" style="max-height:20rem" /></a>`;
                return baseImageTag;
            } else {
                // Hyperlink
                // Return the <a> tag with the base URL and a second <a> tag for the full URL including the query string
                const baseUrlTag = `<a href="${url}" target="_blank" style="text-decoration:underline;">${url}</a>`;
                const fullUrlTag = queryString ? `<a href="${url}${queryString}" target="_blank" style="font-weight:300; text-decoration:underline;">${queryString}</a>` : '';
                return baseUrlTag + (queryString ? fullUrlTag: '');
            }
        });
    }
    
    let previoususerid = '';
    let previoustext = '';
    let groupTimeString = '';
    let previousTimeString = '';
    let timestampString = '';
    let dateOptions = {month: 'long', day: 'numeric'};
    let timeOptions = { timeStyle: 'short'};
    return (
    <div id="roomChat" className="h-full w-full bg-gray-700"
        style={{position: 'relative'}}
    >
        <div
            id="chatlines" 
            className="flex-col-reverse justify-end mb-2 overflow-y-scroll"
            onScroll={handleUserChatScroll}
            onTouchEnd={handleUserChatScroll}
            onMouseUp={handleUserChatScroll}
            onWheel={handleUserChatScroll}
        >
        {textchats.map((textentry, index) => {
            let chatkey = `chatkey_${index}`;
            let userid = ((textentry != undefined && textentry.length > 0) ? textentry[0] : '');
            let userobj = JSON.parse(sessionStorage.getItem(userid)) ?? {id: '', avatar: ''};
            let username = displayName(userobj, room);
            const userNpub = getNpubFromInfo(userobj);
            if (userNpub != undefined) {
                username = getRelationshipPetname(userNpub, username);
            }
            let useravatar = avatarUrl(userobj, room);
            let thetext = ((textentry != undefined && textentry.length > 1) ? textentry[1] : '');
            let isdm = ((textentry != undefined && textentry.length > 2) ? textentry[2] : false);
            let todm = ((textentry != undefined && textentry.length > 3) ? textentry[3] : '');
            let texttime = ((textentry != undefined && textentry.length > 4) ? textentry[4] : 0);
            let nostrId = ((textentry != undefined && textentry.length > 5) ? textentry[5] : undefined);
            let isNostrEvent = (nostrId != undefined);
            if (window.DEBUG) console.log('texttime:', texttime);
            if (texttime == undefined) texttime = 0;
            if (String(texttime).length > 10) texttime = Math.floor(texttime / 1000);
            if (window.DEBUG) console.log('texttime:',texttime);
            try {
                let textdate = new Date((Math.floor(texttime/textchatShowDatesDuration)*textchatShowDatesDuration) * 1000);
                if (window.DEBUG) console.log('textdate', textdate);
                let humanDate = new Intl.DateTimeFormat('en-us',dateOptions).format(textdate);
                let humanTime = new Intl.DateTimeFormat('en-us',timeOptions).format(textdate);
                let textdate2 = new Date((Math.floor((texttime+textchatShowDatesDuration)/textchatShowDatesDuration)*textchatShowDatesDuration) * 1000);
                if (window.DEBUG) console.log('textdate2', textdate2);
                let humanTime2 = new Intl.DateTimeFormat('en-us',timeOptions).format(textdate2);
                groupTimeString = texttime > 0 ? `${humanDate} ${humanTime} - ${humanTime2}` : 'Older Messages';
            } catch (edate) {
                if (window.DEBUG) console.log(edate);
            }
            try {
                let timestampString1 = texttime > 0 ? makeLocalDate(texttime) : 'Older Message';
                if (window.DEBUG) console.log('timestampString1', timestampString1);
                let timestampString2 = texttime > 0 ? (new Intl.DateTimeFormat('en-us',{timeStyle:'short'}).format(new Date(texttime * 1000)).split(' ')[0]) : 'Older';
                timestampString = timestampString2;
                if (window.DEBUG) console.log('timestampString', timestampString);
            } catch (etimestamp) {
                if (window.DEBUG) console.log(etimestamp);
            }
            // Get who the message was sent to when DMing
            let tousername = '';
            if (todm) {
                let todmobj = JSON.parse(sessionStorage.getItem(todm)) ?? {id: '', avatar: ''};
                tousername = displayName(todmobj, room);
                let todmnpub = getNpubFromInfo(todmobj);
                if (todmnpub != undefined) {
                    tousername = getRelationshipPetname(todmnpub, tousername);
                }
            }
            // set date header based on group strings
            let dateHeader = (textchatShowDates && groupTimeString != previousTimeString) ? groupTimeString : "";
            if (window.DEBUG) console.log('dateHeader', dateHeader);
            // skip duplicates
            if (previoususerid == userid && previoustext == thetext) {
                return (<span key={chatkey}></span>);
            }
            previoususerid = userid;
            previoustext = thetext;
            let emoting = thetext.startsWith("/me") || thetext.includes("has entered the chat");
            let sentv4v = (thetext.includes("zapped") || thetext.includes("tipped")) && thetext.includes("⚡");
            let iserror = (thetext.toUpperCase().includes("ERROR"));
            let chatLineTextColor = iserror ? 'rgb(192,192,0)' : (sentv4v ? 'rgb(255,155,55)' : (emoting ? 'rgb(59,130,246)' : 'rgb(255,255,255)'));
            let chatBackgroundColor = isdm ? (myId == userid ? 'rgb(24,64,24)' : 'rgb(24,24,64)') : 'rgb(55,65,81)';
            if(thetext.startsWith("cashu") && thetext.length > 200) {
                let cashuamount = '?';
                let cashuunit = 'sats';
                let cashumint = 'unknown mint';
                try {
                    let cashuobj = JSON.parse(atob(thetext.substring(6)));
                    cashuamount = cashuobj.token[0].proofs[0].amount;
                    if (cashuobj.unit) cashuunit = cashuobj.unit;
                    cashumint = cashuobj.token[0].mint;
                } catch(cashuerror) {
                    let m = `ERROR parsing cashu token: ${cashuerror}`;
                    console.log(m);
                    /* ignore */
                }
                previousTimeString = groupTimeString;
                return (<span key={chatkey}>
                    {dateHeader && (<div className="bg-gray-500 text-gray-700"><center>{dateHeader}</center></div>)}
                    <center className="text-xs text-gray-400 cursor-pointer">
                    <div style={{width:'330px',height:'60px',border:'3px solid lightgreen',backgroundColor: (cashuamount == '?' ? 'red' : 'green'),color:'white',textAlign:'center'}}
                        onClick={async () => {
                            await window.navigator.clipboard.writeText(thetext);
                            alert('Cashu token copied to clipboard. Paste in your wallet to redeem.');
                        }}
                    >
                        Cashu token. Click to copy. 
                        {cashuamount != '?' ? (
                            <>
                            <br/>{cashuamount} {cashuunit}
                            <br/>{cashumint}
                            </>
                        ) : (
                            <>
                            <br /><br />{thetext.substring(0,30)}...
                            </>
                        )}
                    </div>
                    </center>
                    </span>
                );
            }
            if(thetext.startsWith("/srfm")) {
                return (<span key={chatkey}></span>);
            }
            if(thetext.startsWith("/chatad")) {
                if (!jamConfig.handbill) {
                    return (<span key={chatkey}></span>);
                }
                let chatadparts = thetext.split(":");
                let adidx = chatadparts[1];
                let adreqdt = chatadparts[2];
                let adidnum = -1;
                let adlink = '';
                try {
                    adidnum = Math.floor(adidx);
                    const adskey = 'chatads';
                    const chatads = sessionStorage.getItem(adskey);
                    if (chatads != null && chatads != null) {
                        let adlist = JSON.parse(chatads);
                        if (adlist.length > 0) {
                            adidnum = adidnum % adlist.length;
                            let adimg = adlist[adidnum].image;
                            let adimgsrc = `${jamConfig.urls.pantry}/api/v1/cimg/${roomId}/${adimg}?r=${adreqdt}`;
                            previousTimeString = groupTimeString;
                            if (adlist[adidnum].hasLink) {
                                adlink = adlist[adidnum].link;
                                return (<span key={chatkey}>
                                    {dateHeader && (<div className="bg-gray-500 text-gray-700"><center>{dateHeader}</center></div>)}
                                    <center className="text-xs text-gray-400">linked advertisement
                                    <a href={`${adlink}`} target="_blank">
                                    <div style={{width:'330px',height:'60px',border:'3px solid orange'}}>
                                    <img style={{width:'320px',height:'50px',marginTop:'2px'}} src={adimgsrc} />
                                    </div>
                                    </a>
                                    </center>
                                    </span>
                                );                                
                            } else {
                                return (<span key={chatkey}>
                                    {dateHeader && (<div className="bg-gray-500 text-gray-700"><center>{dateHeader}</center></div>)}
                                    <center className="text-xs text-gray-400">advertisement
                                    <img style={{width:'320px',height:'50px'}} src={adimgsrc} />
                                    </center>
                                    </span>
                                );            
                            }
                        }
                    }             
                } catch (error) { /*ignore*/ }
                // still here? return empty
                return (<span key={chatkey}></span>);
            }
            
            previousTimeString = groupTimeString;
            if(userid != myId || textchatLayout == 'left') {
                // others : left aligned
                if (emoting) {
                    thetext = "*" + (textchatShowNames ? username : "") + " " + thetext.replace("/me","") + "*";
                } else {
                    thetext = (textchatShowNames ? username + ": " : "") + thetext;
                }
                return (
                    <span key={chatkey}>
                    {dateHeader && (<div className="bg-gray-500 text-gray-700"><center>{dateHeader}</center></div>)}
                    <div className="flex w-full justify-between bg-gray-700 text-white" 
                        style={{borderBottom: '1px solid rgb(55,65,81)', backgroundColor: chatBackgroundColor }}>
                        {textchatShowTimestamps && (
                        <div className="flex text-sm break-words mr-1"
                             style={{color: chatLineTextColor}}>{timestampString}</div>
                        )}
                        {textchatShowAvatar && (
                        <img className="flex w-6 h-6 human-radius" src={useravatar} 
                        onClick={() =>
                            openModal(Profile, {
                              info: identities[userid],
                              room,
                              peerId: userid,
                              iOwn,
                              iModerate,
                              actorIdentity: myIdentity,
                              iAmAdmin,
                            })
                          }                        
                        />
                        )}
                        <div className="flex-grow text-sm break-words ml-1" 
                             style={{color: chatLineTextColor}}
                             dangerouslySetInnerHTML={{ __html: createLinksSanitized(thetext) }} />
                        {isdm && (<span className="rounded" style={{backgroundColor: 'rgb(32,128,32)',color:'rgb(255,255,255)'}}>{myId==userid ? '>>' + (textchatShowNames ? tousername : "") : '<<'}</span>)}
                        {isNostrEvent && (
                            <img
                                style={{width:'24px',height:'24px'}}
                                title={'Published to nostr'}
                                src={'/img/symbols/nostr-icon-purple-256x256.png'}
                            />)}
                    </div>
                    </span>
                );
            } else {
                // me : avatar on right side
                if (emoting) {
                    thetext = "*" + (textchatShowNames ? username : "") + " " + thetext.replace("/me","") + "*";
                }
                
                return (
                    <span key={chatkey}>
                    {dateHeader && (<div className="bg-gray-500 text-gray-700"><center>{dateHeader}</center></div>)}
                    <div className="flex w-full justify-between bg-gray-700 text-white" 
                    style={{borderBottom: '1px solid rgb(55,65,81)', backgroundColor: chatBackgroundColor }}>
                        <div className="flex-grow text-sm text-right break-words mr-1" 
                             style={{color: chatLineTextColor}}
                             dangerouslySetInnerHTML={{ __html: createLinksSanitized(thetext) }} />
                        {isdm && (<span className="rounded" style={{backgroundColor: 'rgb(32,128,32)',color:'rgb(255,255,255)'}}>{myId==userid ? '>>' + (textchatShowNames ? tousername : "") : '<<'}</span>)}
                        {isNostrEvent && (
                            <img
                                style={{width:'24px',height:'24px'}}
                                title={'Published to nostr'}
                                src={'/img/symbols/nostr-icon-purple-256x256.png'}
                            />)}
                        {textchatShowAvatar && (
                        <img className="flex w-6 h-6 human-radius" src={useravatar} 
                        onClick={() =>
                            openModal(Profile, {
                              info: identities[userid],
                              room,
                              peerId: userid,
                              iOwn,
                              iModerate,
                              actorIdentity: myIdentity,
                              iAmAdmin,
                            })
                          }                        
                        />
                        )}
                        {textchatShowTimestamps && (
                        <div className="flex text-sm break-words ml-1"
                             style={{color: chatLineTextColor}}>{timestampString}</div>
                        )}
                    </div>
                    </span>
                );
            }
        })}
        </div>
        <div style={{height:'56px'}} className="bg-gray-700"></div>
        <div className="flex w-full justify-between"
            style={{position: 'absolute', bottom: '0px'}}
        >
            <select id="chattarget" defaultValue={chatTarget} onChange={e => {setChatTarget(e.target.value);}}
                className={mqp('rounded placeholder-black bg-gray-400 text-black w-24 mx-0')}
            >
                <option key="0" value="0">Everyone</option>
            {peers?.map((peerId, index) => {
                let chattargetkey = `chattargetkey_${index}`;
                let identity = identities[peerId];
                if (identity == undefined) {
                    return <option key={chattargetkey} value={peerId}>Unknown</option>
                } else {
                    let userDisplayName = displayName(identity, room);
                    let userNpub = getNpubFromInfo(identity);
                    if (userNpub != undefined) {
                    userDisplayName = getRelationshipPetname(userNpub, userDisplayName);
                    }
                    return <option key={chattargetkey} value={peerId} style={{}}>{userDisplayName}</option>
                }
            })}
            </select>
            <input id="chatentry"
                className={mqp('rounded placeholder-black bg-gray-400 text-black w-full mx-1')}
                type="text"
                placeholder=""
                value={chatText}
                autoComplete="off"
                style={{borderWidth: '0px',fontSize: '15px'}}
                onChange={(e) => {setChatText(e.target.value);}}
                onKeyPress={(e) => {if(e.key === "Enter") {e.preventDefault();sendText();}}}
            ></input>
            <button id="uploadbutton"
                className="px-2 mr-1 w-12 h-12 text-sm rounded-md"
                style={{color: iconColor, backgroundColor: roomColor.buttons.primary}}
                onClick={(e) => {e.preventDefault();uploadFile();}}
                onKeyPress={(e) => {if((e.key === " ") || (e.key === "Enter")) {e.preventDefault();uploadFile();}}}
            >
                <Upload color={iconColor} />
            </button>            
            <button id="sendbutton"
                className="px-2 w-12 h-12 text-sm rounded-md"
                style={{color: iconColor, backgroundColor: roomColor.buttons.primary}}
                onClick={(e) => {e.preventDefault();sendText();}}
                onKeyPress={(e) => {if((e.key === " ") || (e.key === "Enter")) {e.preventDefault();sendText();}}}
            >
                <Send color={iconColor} />
            </button>
        </div>
    </div>
  );
}
