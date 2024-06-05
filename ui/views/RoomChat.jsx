import {update} from 'minimal-state';
import React, {useState, useEffect} from 'react';
import EmojiConvertor from 'emoji-js';
import {useMqParser} from '../lib/tailwind-mqp';
import {colors, isDark} from '../lib/theme';
import {useJam} from '../jam-core-react';
import {avatarUrl, displayName} from '../lib/avatar';
import {getNpubFromInfo, getRelationshipPetname} from '../nostr/nostr';
import {time4Ad, value4valueAdSkip} from '../lib/v4v';

export default function RoomChat({
    room,
}) {
    const mqp = useMqParser();
    const [state, {sendTextChat}] = useJam();
    let {textchats,roomId, myIdentity} = state;
    let [chatText, setChatText] = useState('');
    let [chatScrollPosition, setChatScrollPosition] = useState(sessionStorage.getItem(`${roomId}.textchat.scrollpos`) ?? -999);
    let myId = myIdentity.info.id;
    let textchatLayout = localStorage.getItem("textchat.layout") ?? 'versus';
    let textchatShowNames = ((localStorage.getItem('textchat.showNames') ?? 'true') == 'true');
    let textchatShowAvatar = ((localStorage.getItem('textchat.showAvatars') ?? 'true') == 'true');
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
        let c = document.getElementById('chatlines');
        if (c) {
            let p = sessionStorage.getItem(`${roomId}.textchat.scrollpos`) ?? -999;
            let n = (p>=0) ? p : c.scrollHeight;
            if (c.scrollTop != n) c.scrollTop = n;
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
            //console.log(`scrolled to scrollTop: ${scrollTop}, scrollHeight: ${scrollHeight}, clientHeight: ${clientHeight}`);
            let newpos = ((scrollTop) >= (scrollHeight - clientHeight)) ? -1 : scrollTop;
            sessionStorage.setItem(`${roomId}.textchat.scrollpos`, newpos);
            setChatScrollPosition(newpos);
            //console.log('saving position as ', newpos);
        }
    }

    function sendText() {
        if (chatText.length == 0) return;                   // ignore if no text
        chatText = chatText.substring(0,615);               // cashu is about 355
        if (chatText.startsWith("/clear")) {
            textchats = [];
            state.textchats = textchats;
            update(state, 'textchats');
        } else if (chatText.startsWith("/help")) {
            textchats.push([myId, "Supported markdown"]);
            textchats.push([myId, "• To **bold** surround with 2 *"]);
            textchats.push([myId, "• To *italicize* surround with 1 *"]);
            textchats.push([myId, "• To hide spoilers, surround with 1 |"]);
            textchats.push([myId, "• Emoji shortcodes are surrounded by 1 :"]);
            textchats.push([myId, "• /help shows this guidance"]);
            textchats.push([myId, "• /clear resets your text buffer"]);
            textchats.push([myId, "• /me emotes a statement"]);
            state.textchats = textchats;
            update(state, 'textchats');
        } else {
            (async () => {await sendTextChat(chatText);})(); // send to swarm (including us) as text-chat
        }
        setChatText('');                                    // clear the field
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
        // Convert ||spoilertext|| to <a class="spoiler" id="spoilerlink" href="#spoilerlink" title="Tap to reveal">spoilertext</a>
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
            // Return the <a> tag with the base URL and a second <a> tag for the full URL including the query string
            const baseUrlTag = `<a href="${url}" target="_blank" style="text-decoration:underline;">${url}</a>`;
            const fullUrlTag = queryString ? `<a href="${url}${queryString}" target="_blank" style="font-weight:300; text-decoration:underline;">${queryString}</a>` : '';
            return baseUrlTag + (queryString ? fullUrlTag: '');
        });
    }
    
    let previoususerid = '';
    let previoustext = '';
    return (
    <div id="roomChat" className="max-h-96 h-full w-full bg-gray-700"
        style={{position: 'relative'}}
    >
        <div
            id="chatlines" 
            className="flex-col-reverse justify-end mb-2 overflow-y-scroll"
            style={{maxHeight: '21rem', height: '21rem'}}
            onScroll={handleUserChatScroll}
            onTouchEnd={handleUserChatScroll}
            onMouseUp={handleUserChatScroll}
            onWheel={handleUserChatScroll}
        >
        {textchats.map((textentry, index) => {
            let userid = textentry[0];
            let userobj = JSON.parse(sessionStorage.getItem(userid)) ?? {id: '', avatar: ''};
            let username = displayName(userobj, room);
            const userNpub = getNpubFromInfo(userobj);
            if (userNpub != undefined) {
                username = getRelationshipPetname(userNpub, username);
              }            
            let useravatar = avatarUrl(userobj, room);
            let thetext = textentry[1];
            // skip duplicates
            if (previoususerid == userid && previoustext == thetext) {
                return (<></>);
            }
            previoususerid = userid;
            previoustext = thetext;
            let emoting = thetext.startsWith("/me");
            let sentv4v = (thetext.includes("zapped") || thetext.includes("tipped")) && thetext.includes("⚡");
            let chatLineTextColor = emoting ? 'rgb(59,130,246)' : (sentv4v ? 'rgb(255,155,55)' : 'rgb(255,255,255)');
            if(thetext.startsWith("cashu") && thetext.length > 350) {

                let cashuamount = '?';
                let cashuunit = 'sats';
                let cashumint = 'unknown mint';
                try {
                    let cashuobj = JSON.parse(atob(thetext.substring(6)));
                    cashuamount = cashuobj.token[0].proofs[0].amount;
                    if (cashuobj.unit) cashuunit = cashuobj.unit;
                    cashumint = cashuobj.token[0].mint;
                } catch(cashuerror) {
                    console.log(`Error parsing cashu token:`, cashuerror);
                    /* ignore */
                }
                return (
                    <center className="text-xs text-gray-400 cursor-pointer">
                    <div style={{width:'330px',height:'60px',border:'3px solid lightgreen',backgroundColor:'green',color:'white',textAlign:'center'}}
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
                );
            }
            if(thetext.startsWith("/srfm")) {
                return (<></>);
            }
            if(thetext.startsWith("/chatad")) {
                if (!jamConfig.handbill) {
                    return (
                      <></>  
                    );
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
                            if (adlist[adidnum].hasLink) {
                                adlink = adlist[adidnum].link;
                                return (
                                    <center className="text-xs text-gray-400">linked advertisement
                                    <a href={`${adlink}`} target="_blank">
                                    <div style={{width:'330px',height:'60px',border:'3px solid orange'}}>
                                    <img style={{width:'320px',height:'50px',marginTop:'2px'}} src={adimgsrc} />
                                    </div>
                                    </a>
                                    </center>
                                );                                
                            } else {
                                return (
                                    <center className="text-xs text-gray-400">advertisement
                                    <img style={{width:'320px',height:'50px'}} src={adimgsrc} />
                                    </center>
                                );            
                            }
                        }
                    }             
                } catch (error) { /*ignore*/ }
                // still here? return empty
                return (<></>);
            }
            
            if(userid != myId || textchatLayout == 'left') {
                // others : left aligned
                if (emoting) {
                    thetext = "*" + (textchatShowNames ? username : "") + " " + thetext.replace("/me","") + "*";
                } else {
                    thetext = (textchatShowNames ? username + ": " : "") + thetext;
                }
                return (
                    <div className="flex w-full justify-between bg-gray-700 text-white" style={{borderBottom: '1px solid rgb(55,65,81)'}}>
                        {textchatShowAvatar && (
                        <img className="flex w-6 h-6 human-radius" src={useravatar} />
                        )}
                        <div className="flex-grow text-sm break-words ml-1" 
                             style={{color: chatLineTextColor}}
                             dangerouslySetInnerHTML={{ __html: createLinksSanitized(thetext) }} />
                    </div>
                );
            } else {
                // me : avatar on right side
                if (emoting) {
                    thetext = "*" + (textchatShowNames ? username : "") + " " + thetext.replace("/me","") + "*";
                }
                
                return (
                    <div className="flex w-full justify-between bg-gray-700 text-white" style={{borderBottom: '1px solid rgb(55,65,81)'}}>
                        <div className="flex-grow text-sm text-right break-words mr-1" 
                             style={{color: chatLineTextColor}}
                             dangerouslySetInnerHTML={{ __html: createLinksSanitized(thetext) }} />
                        {textchatShowAvatar && (
                        <img className="flex w-6 h-6 human-radius" src={useravatar} />
                        )}
                    </div>
                );
            }
        })}
        </div>
        <div className="flex w-full justify-between"
            style={{position: 'absolute', bottom: '0px'}}
        >
            <input id="chatentry"
                className={mqp('rounded placeholder-black bg-gray-400 text-black flex-grow mx-1')}
                type="text"
                placeholder=""
                value={chatText}
                autoComplete="off"
                style={{borderWidth: '0px',fontSize: '15px'}}
                onChange={(e) => {setChatText(e.target.value);}}
                onKeyPress={(e) => {if(e.key === "Enter") {e.preventDefault();sendText();}}}
            ></input>
            <button id="sendbutton"
                className="px-5 h-12 text-sm rounded-md"
                style={{color: iconColor, backgroundColor: roomColor.buttons.primary}}
                onClick={(e) => {e.preventDefault();sendText();}}
                onKeyPress={(e) => {if((e.key === " ") || (e.key === "Enter")) {e.preventDefault();sendText();}}}
            >
                Send
            </button>
        </div>
    </div>
  );
}
