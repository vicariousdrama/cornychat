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
  const [slideSetId, setSlideSetId] = useState('');
  const [slidesets, setSlidesets] = useState([]);

  useEffect(() => {
    const loadData = async () => {
        setLoadingData(true);
        let pubkey = await window.nostr.getPublicKey();
        let loadedSlidesets = await loadList(30388, pubkey);
        setSlidesets(loadedSlidesets);
        setLoadingData(false);
    };
    loadData();
  }, []);

  async function addslides() {
    if (slidesets == undefined) {
        return;
    }
    let newSlides = roomSlides;
    slidesets.map((slideset, index) => {
      if (slideset.id == slideSetId) {
        for (let tag of slideset.tags) {
          if (tag.length < 3) continue;
          if (tag[0] != 'r') continue;
          let u = tag[1];
          let c = tag[2];
          newSlides.push([u,c]);
        }
      }
    });
    setRoomSlides(newSlides);
    close();
    return;
  }

  function SlideSetChoices() {
    if (slidesets == undefined || slidesets.length == 0) {
        return (
            <div className="text-md">
                There were no slidesets found to import from.  
                Use the export function to create a slideset before attempting to import it.
            </div>            
        );
    }
    let currentSlideSetId = '';
    return (<>
        {slidesets.map((slideset) => {
            let created_at = slideset.created_at;
            let id = slideset.id;
            let dTag = '';
            let name = '';
            let about = '';
            let image = '';
            let slidecount = 0;
            for (let tag of slideset.tags) {
                if (tag.length < 2) continue;
                if (tag[0] == 'd') dTag = tag[1];
                if (tag[0] == 'name') name = tag[1];
                if (tag[0] == 'about') about = tag[1];
                if (tag[0] == 'image') image = tag[1];
                if (tag[0] == 'r') slidecount += 1;
            }
            if (currentSlideSetId == '') {
                // assign first
                currentSlideSetId = id;
                setSlideSetId(currentSlideSetId);
            } 
            const date = new Date(created_at * 1000);
            var dateOptions = { weekday: 'long', month: 'long', day: 'numeric' }; 
            const humanDate = new Intl.DateTimeFormat('en-us',dateOptions).format(date);
            if (slidecount > 0) {
                if (currentSlideSetId == id) {
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
                            onClick={() => setSlideSetId(id)}
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
          Slide Set
        </p>
        <div className="flex flex-wrap justify-between">
          { loadingData ? (<h4>Loading...</h4>) : ( <SlideSetChoices /> )}
        </div>
        {(slidesets.length > 0) && (
        <button
          className="py-2 px-4 rounded text-center w-full"
          style={{
            backgroundColor: roomColor.buttons.primary,
            color: textColor,
          }}
          onClick={async () => {
            if (slidesets != undefined) {
                await addslides();
            }
          }}
        >
          Add slides from chosen slide set
        </button>
        )}
        </>
      </div>  
    </Modal>
  );
};
