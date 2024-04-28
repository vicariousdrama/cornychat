import {update} from 'minimal-state';
import React, {useState, useEffect} from 'react';
import EmojiConvertor from 'emoji-js';
import {useMqParser} from '../lib/tailwind-mqp';
import {colors, isDark} from '../lib/theme';
import {useJam} from '../jam-core-react';
import {avatarUrl, displayName} from '../lib/avatar';

export default function RoomChat({
    room,
}) {
    const mqp = useMqParser();
    const [state, {sendTextChat}] = useJam();
    let {textchats,roomId, myIdentity} = state;
    let [chatText, setChatText] = useState('');
    let [chatScrollPosition, setChatScrollPosition] = useState(sessionStorage.getItem(`${roomId}.chatScrollPosition`) ?? -999);
    let myId = myIdentity.info.id;
    let textchatLayout = localStorage.getItem("textchat.layout") ?? 'versus';
    const colorTheme = room?.color ?? 'default';
    const roomColor = colors(colorTheme, room.customColor);
    const textColor = isDark(roomColor.avatarBg) ? roomColor.text.light : roomColor.text.dark;
    const iconColor = isDark(roomColor.buttons.primary) ? roomColor.icons.light : roomColor.icons.dark;
    let spoilercount = 0;
    const emoji = new EmojiConvertor();

    const [time, setTime] = useState(Date.now());
    useEffect(() => {
      const interval = setInterval(() => {
        setTime(Date.now());    // forces update ?
        let c = document.getElementById('chatlines');
        if (c) {
            let p = sessionStorage.getItem(`${roomId}.chatScrollPosition`) ?? -999;
            let n = (p>=0) ? p : c.scrollHeight;
            if (c.scrollTop != n) c.scrollTop = n;
        }
      }, 1000);
      return () => {
        clearInterval(interval);
      };
    }, []);

    function handleUserChatScroll(e) {
        let c = document.getElementById('chatlines');
        if (c) {
            let scrollTop = c.scrollTop;
            let scrollHeight = c.scrollHeight;
            let clientHeight = c.clientHeight;
            //console.log(`scrolled to scrollTop: ${scrollTop}, scrollHeight: ${scrollHeight}, clientHeight: ${clientHeight}`);
            let newpos = ((scrollTop) >= (scrollHeight - clientHeight)) ? -1 : scrollTop;
            sessionStorage.setItem(`${roomId}.chatScrollPosition`, newpos);
            setChatScrollPosition(newpos);
            //console.log('saving position as ', newpos);
        }
    }

    function sendText() {
        if (chatText.length == 0) return;                   // ignore if no text
        chatText = chatText.substring(0,280);               // sanity length limit 140, 512
        if (chatText.startsWith("/clear")) {
            textchats = [];
            state.textchats = textchats;
            update(state, 'textchats');
        } else if (chatText.startsWith("/help")) {
            textchats.push([myId, "Supported markdown"]);
            textchats.push([myId, "• To **bold** surround with **"]);
            textchats.push([myId, "• To *italicize* surround with *"]);
            textchats.push([myId, "• To hide spoilers, surround with ||"]);
            textchats.push([myId, "• Emoji shortcodes are surrounded by :"]);
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
            onTouchEnd={handleUserChatScroll}
            onMouseUp={handleUserChatScroll}
            onWheel={handleUserChatScroll}
        >
        {textchats.map((textentry, index) => {
            let userid = textentry[0];
            let userobj = JSON.parse(sessionStorage.getItem(userid)) ?? {id: '', avatar: ''};
            let username = displayName(userobj, room);
            let useravatar = avatarUrl(userobj, room);
            let thetext = textentry[1];
            // skip duplicates
            if (previoususerid == userid && previoustext == thetext) {
                return (<></>);
            }
            previoususerid = userid;
            previoustext = thetext;
            let emoting = false;
            
            if(userid != myId || textchatLayout == 'left') {
                // others : left aligned
                if (thetext.startsWith("/me")) {
                    emoting = true;
                    thetext = "*" + username + " " + thetext.replace("/me","") + "*";
                } else {
                    thetext = username + ": " + thetext;
                }
                return (
                    <div className="flex w-full justify-between bg-gray-700 text-white" style={{borderBottom: '1px solid rgb(55,65,81)'}}>
                        <img className="flex w-6 h-6 human-radius" src={useravatar} />
                        <div className="flex-grow text-sm break-words ml-1" 
                             style={{color: emoting ? 'rgb(59 130 246)' : 'rgb(255 255 255)'}}
                             dangerouslySetInnerHTML={{ __html: createLinksSanitized(thetext) }} />
                    </div>
                );
            } else {
                // me : avatar on right side
                if (thetext.startsWith("/me")) {
                    emoting = true;
                    thetext = "*" + username + " " + thetext.replace("/me","") + "*";
                }
                return (
                    <div className="flex w-full justify-between bg-gray-700 text-white" style={{borderBottom: '1px solid rgb(55,65,81)'}}>
                        <div className="flex-grow text-sm text-right break-words mr-1" 
                             style={{color: emoting ? 'rgb(59 130 246)' : 'rgb(255 255 255)'}}
                             dangerouslySetInnerHTML={{ __html: createLinksSanitized(thetext) }} />
                        <img className="flex w-6 h-6 human-radius" src={useravatar} />
                    </div>
                );                
            }
        })}
        </div>
        <div className="flex w-full justify-between my-3 absolute mb-0"
            style={{position: 'absolute', bottom: '0px'}}
        >
            <input id="chatentry"
                className={mqp('rounded placeholder-black bg-gray-400 text-black w-full mx-1 md:w-full')}
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
