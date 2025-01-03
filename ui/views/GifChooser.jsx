import React, {useState, useEffect} from 'react';
import {Modal, openModal} from './Modal';
import {useJam, useApiQuery} from '../jam-core-react';
import {use} from 'use-minimal-state';
import {useMqParser} from '../lib/tailwind-mqp';
import {colors, isDark} from '../lib/theme';

export function GifChooser({chatTarget, room, phrase, close}) {
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageList, setImageList] = useState([]);
  const [upstreamStatus, setUpstreamStatus] = useState(0);

  const [state, api] = useJam();
  const {
    sendTextChat,
    sendCSAR,
    listGifs,
  } = api;

  let mqp = useMqParser();
  let [myId, roomId] = use(state, ['myId', 'roomId']);

  const colorTheme = room?.color ?? 'default';
  const roomColor = colors(colorTheme, room.customColor);
  const textColor = isDark(roomColor.buttons.primary) ? roomColor.text.light : roomColor.text.dark;

  useEffect(async () => {
    const loadImages = async () => {
        setLoadingImages(true);
        let imagelist = await(listGifs(encodeURIComponent(phrase), ""));
        console.log(imagelist);
        if (imagelist[1]) {
            let imagelistobj = imagelist[0];
            let transformlist = [];
            for (let [key, value] of Object.entries(imagelistobj)) {
                console.log('key: ', key);
                console.log('value: ', value);
                //value.id = key;
                transformlist.push(value);
            }
            console.log(transformlist);
            setImageList(transformlist);
        } else {
            setImageList([]);
        }
        setUpstreamStatus(imagelist[2]);
        setLoadingImages(false);
        
      };
      loadImages();    
  }, []);

  async function imageClicked(url) {
    (async () => {
        await sendTextChat(url, chatTarget);
        close();
    })();
  }

  return (
    <Modal close={close}>
      <div>
        <h1><img src="https://gifbuddy.lol/static/icons/gifbuddy/icon_144x144.png" style={{display:'inline',width:'20px',height:'20px',border:'0px'}} /> GIF Buddy </h1>
        <p>Images containing the phrase: <b>{phrase}</b>.</p>
        {imageList.length > 0 && (
        <>
        <p>Click on an image to send to the text chat.</p>
        <div className="flex flex-wrap justify-between">
            {imageList.map((imageInfo,i) => {
                if(imageInfo.gifUrl) {
                    return ((
                        <div
                            key={i}
                            onClick={() => imageClicked(imageInfo.gifUrl)}
                            className="w-24 h-24 cursor-pointer hover:border-blue-500"
                        >
                        <img
                        src={imageInfo.gifUrl}
                        className="w-full h-full"
                        />
                    </div>
                    ))
                } else {
                    return <></>
                }
            })}
        </div>
        </>
        )}
        {(imageList.length == 0 && upstreamStatus != 200) && (
        <>
        <p>No images were returned due to an error.</p>
        <p>Service response status code: {upstreamStatus}</p>
        </>
        )}

      </div>
    </Modal>
  );
}
