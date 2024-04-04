import React, {useState, useEffect} from 'react';
import {Modal} from '../Modal';
import {loadList} from '../../nostr/nostr';

export const ImportSlidesModal = ({
    close,
    textColor,
    roomColor,
    roomSlides,
    setRoomSlides,
}) => {
  const [loadingData, setLoadingData] = useState(true);
  const [slideLists, setSlideLists] = useState([]);
  const [selectedListID, setSelectedListID] = useState('');

  useEffect(() => {
    const loadData = async () => {
        setLoadingData(true);
        let pubkey = await window.nostr.getPublicKey();
        let loadedSlideLists = await loadList(30388, pubkey);
        setSlideLists(loadedSlideLists);
        setLoadingData(false);
    };
    loadData();
  }, []);

  async function addslides() {
    if (slideLists == undefined || slideLists.length == 0) {
      close();
      return;
    }
    let newSlides = roomSlides;
    slideLists.map((slideList, index) => {
      if (slideList.id == selectedListID) {
        for (let tag of slideList.tags) {
          if (tag.length < 3) continue;
          if (tag[0] != 'r') continue;
          let u = tag[1];
          let c = tag[2];
          // dont add duplicate urls
          let addit = true;
          for (let s of newSlides) {
            addit &= (s[0] != u);
          }
          if (addit) newSlides.push([u,c]);
        }
      }
    });
    setRoomSlides(newSlides);
    close();
    return;
  }

  function SlideListChoices() {
    if (slideLists == undefined || slideLists.length == 0) {
        return (
            <div className="text-md">
                There were no slide lists found to import from.  
                Use the export function to create a slide list before attempting to import it.
            </div>            
        );
    }
    return (<>
        {slideLists.map((slideList) => {
            let created_at = slideList.created_at;
            let id = slideList.id;
            let dTag = '';
            let name = '';
            let about = '';
            let image = '';
            let slidecount = 0;
            for (let tag of slideList.tags) {
                if (tag.length < 2) continue;
                if (tag[0] == 'd') dTag = tag[1];
                if (tag[0] == 'name') name = tag[1];
                if (tag[0] == 'about') about = tag[1];
                if (tag[0] == 'image') image = tag[1];
                if (tag[0] == 'r') slidecount += 1;
            }
            if (selectedListID == '') {
                // assign first
                setSelectedListID(id);
            } 
            const date = new Date(created_at * 1000);
            var dateOptions = { weekday: 'long', month: 'long', day: 'numeric' }; 
            const humanDate = new Intl.DateTimeFormat('en-us',dateOptions).format(date);
            if (slidecount > 0) {
                if (selectedListID == id) {
                    return (
                        <div className="select-none px-0 text-lg rounded-lg m-2 border-2 border-blue-500 w-full">
                            <table className="w-full" cellpadding="0" cellspacing="0" border="0" style={{maxWidth:'3500px'}}>
                            <tr>
                                <td rowspan="3" style={{width: '72px'}}>
                                    <img src={image}
                                        style={{width: '64px', height: '64px', objectFit: 'cover'}} />
                                </td>
                                <td align="left">{name}</td></tr>
                            <tr><td align="left" class="text-sm">about: {about}</td></tr>
                            <tr><td><table className="w-full" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="left" class="text-sm">id: {dTag}</td>
                                    <td align="right" class="text-sm">saved {humanDate}</td>
                                </tr>
                                </table></td></tr>
                            </table>
                        </div>
                    );
                } else {
                    return (
                        <div className="select-none px-0 text-lg rounded-lg m-2 border-2 hover:border-blue-500 w-full cursor-pointer"
                            onClick={() => setSelectedListID(id)}
                        >
                            <table className="w-full" cellpadding="0" cellspacing="0" border="0" style={{maxWidth:'3500px'}}>
                            <tr>
                                <td rowspan="3" style={{width: '72px'}}>
                                    <img src={image}
                                        style={{width: '64px', height: '64px', objectFit: 'cover'}} />
                                </td>
                                <td align="left">{name}</td></tr>
                            <tr><td align="left" class="text-sm">about: {about}</td></tr>
                            <tr><td><table className="w-full" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="left" class="text-sm">id: {dTag}</td>
                                    <td align="right" class="text-sm">saved {humanDate}</td>
                                </tr>
                                </table></td></tr>
                            </table>
                        </div>
                    );
                }
            }
        })}
    </>);
  }

  return (
    <Modal close={close}>
      <div className="bg-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold">Import Slides</h2>
        <>
        <p>
          Slide Lists
        </p>
        <div className="flex flex-wrap justify-between">
          { loadingData ? (<h4>Loading...</h4>) : ( <SlideListChoices /> )}
        </div>
        {(slideLists.length > 0) && (
        <button
          className="py-2 px-4 rounded text-center w-full"
          style={{
            backgroundColor: roomColor.buttons.primary,
            color: textColor,
          }}
          onClick={async () => {
            if (slideLists != undefined) {
                await addslides();
            }
          }}
        >
          Add slides to room from selected slide list
        </button>
        )}
        </>
      </div>  
    </Modal>
  );
};
