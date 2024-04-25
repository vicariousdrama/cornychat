import React, {useState, useEffect} from 'react';
import {useMqParser} from '../lib/tailwind-mqp';
import {colors, isDark} from '../lib/theme';
import {useJam} from '../jam-core-react';
import {avatarUrl, displayName} from '../lib/avatar';

export default function RoomChat({
    room,
}) {
    const mqp = useMqParser();
    const [state, {sendTextChat}] = useJam();
    let {textchats,roomId} = state;
    let [chatText, setChatText] = useState('');
    let [chatScrollPosition, setChatScrollPosition] = useState(sessionStorage.getItem(`${roomId}.chatScrollPosition`) ?? -999);

    const colorTheme = room?.color ?? 'default';
    const roomColor = colors(colorTheme, room.customColor);
    const textColor = isDark(roomColor.avatarBg) ? roomColor.text.light : roomColor.text.dark;
    const iconColor = isDark(roomColor.buttons.primary) ? roomColor.icons.light : roomColor.icons.dark;

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
        chatText = chatText.substring(0,140);               // sanity length limit 140, 512
        (async () => {await sendTextChat(chatText);})();    // send to swarm (including us) as text-chat
        setChatText('');                                    // clear the field
    }
    let previoususerid = '';
    let previoustext = '';
    return (
    <div id="roomChat" className="h-full w-full bg-gray-700"
        style={{position: 'relative', flex: 1}}
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
            let isitalic = false;
            let isbold = false;
            while (thetext.substring(0,2) == "~i") {
                isitalic = true;
                thetext = thetext.substring(2);
            }
            while (thetext.substring(0,2) == "~b") {
                isbold = true;
                thetext = thetext.substring(2);
            }
            if (previoususerid == userid && previoustext == thetext) {
                return (<></>);
            }
            previoususerid = userid;
            previoustext = thetext;
            return (
                <div className="flex w-full justify-between bg-gray-700 text-white" style={{borderBottom: '1px solid rgb(55,65,81)'}}>
                    <img className="flex w-6 h-6 human-radius cursor-pointer" src={useravatar} />
                    <div className="flex mx-2 text-sm font-bold">{username}</div>
                    {isbold && isitalic && (<div className="flex-grow text-sm font-bold italic">{thetext}</div>)}
                    {isbold && !isitalic && (<div className="flex-grow text-sm font-bold">{thetext}</div>)}
                    {!isbold && isitalic && (<div className="flex-grow text-sm italic">{thetext}</div>)}
                    {!isbold && !isitalic && (<div className="flex-grow text-sm">{thetext}</div>)}
                </div>
            );
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
