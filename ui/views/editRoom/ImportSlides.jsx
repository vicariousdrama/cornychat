import React, {useState, useEffect} from 'react';
import {Modal} from '../Modal';
import {getPublicKey, loadList, requestDeletionById} from '../../nostr/nostr';

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
        let pubkey = await getPublicKey();
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

  async function deleteSelected() {
    let newSlideLists = [];
    for (let slideList of slideLists) {
      if (slideList.id != selectedListID) {
        newSlideLists.push(slideList);
      } else {
        requestDeletionById(slideList.id);
      }
    }
    setSlideLists(newSlideLists);
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
        {slideLists.map((slideList, index) => {
            let slidelistkey = `slidelistkey_${index}`;
            let created_at = slideList.created_at;
            let id = slideList.id;
            let dTag = '';
            let name = '';
            let about = '';
            let image = '';
            let slidecount = 0;
            let firstimage = undefined;
            for (let tag of slideList.tags) {
                if (tag.length < 2) continue;
                if (tag[0] == 'd') dTag = tag[1];
                if (tag[0] == 'name') name = tag[1];
                if (tag[0] == 'about') about = tag[1];
                if (tag[0] == 'image') image = tag[1];
                if (tag[0] == 'r') {
                  slidecount += 1;
                  if (!firstimage) {
                    firstimage = tag[1];
                  }
                }
            }
            if (image.length == 0 && firstimage) image = firstimage;
            if (selectedListID == '') {
                // assign first
                setSelectedListID(id);
            } 
            const date = new Date(created_at * 1000);
            var dateOptions = { weekday: 'long', month: 'long', day: 'numeric' }; 
            const humanDate = new Intl.DateTimeFormat('en-us',dateOptions).format(date);
            if (slidecount > 0) {
              let slideclass = 'select-none px-2 text-sm rounded-sm m-2 border-2 w-full ' + (selectedListID == id ? ' border-blue-500' : ' hover:border-blue-500 cursor-pointer');
              return (
                <div key={slidelistkey} className={slideclass}
                onClick={() => setSelectedListID(id)}                        
                >
                  <div className="flex">
                    <img src={image} style={{width: '64px', height: '64px', objectFit: 'cover'}} />
                    {name}
                  </div>
                  <div className="flex">id: {dTag}</div>
                  {about.length > 0 && (
                  <div className="flex">about: {about}</div>
                  )}
                  <div className="flex">saved: {humanDate}</div>
                </div>
              );
            }
        })}
    </>);
  }

  return (
    <Modal close={close}>
      <div className="bg-gray-700 text-gray-200 p-2 rounded-lg">
        <h2 className="text-2xl font-bold">Import Slides</h2>
        <>
        <p>
        Select from your previously saved slide lists
        </p>
        <div className="flex flex-wrap justify-between">
          { loadingData ? (<h4>Loading...</h4>) : ( <SlideListChoices /> )}
        </div>
        <div className="flex justify-between">
        {(slideLists.length > 0 && selectedListID != '') && (
          <button
          className="py-2 px-4 rounded text-center"
          style={{
            backgroundColor: roomColor.buttons.primary,
            color: textColor,
          }}
          onClick={async () => {
            if (slideLists != undefined) {
              let result = confirm('Are you sure you want to delete this slide set?');
              if (result != true) return;
              await deleteSelected();
            }
          }}
        >
          Delete
        </button>
        )}
        {(slideLists.length > 0) && (
        <button
          className="py-2 px-4 rounded text-center"
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
          Import
        </button>
        )}
        </div>
        </>
      </div>  
    </Modal>
  );
};
