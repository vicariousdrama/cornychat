import React, {useState, useEffect} from 'react';
import {Modal} from '../Modal';
import {loadList, requestDeletionById} from '../../nostr/nostr';

export const ImportLinksModal = ({
    close,
    textColor,
    roomColor,
    roomLinks,
    setRoomLinks,
}) => {
  const [loadingData, setLoadingData] = useState(true);
  const [linkLists, setLinkLists] = useState([]);
  const [selectedListID, setSelectedListID] = useState('');

  useEffect(() => {
    const loadData = async () => {
        setLoadingData(true);
        let pubkey = await window.nostr.getPublicKey();
        let loadedLinkLists = await loadList(31388, pubkey);
        setLinkLists(loadedLinkLists);
        setLoadingData(false);
    };
    loadData();
  }, []);

  async function addlinks() {
    if (linkLists == undefined || linkLists.length == 0) {
        close();
        return;
    }
    let newLinks = roomLinks;
    linkLists.map((linkList, index) => {
      if (linkList.id == selectedListID) {
        for (let tag of linkList.tags) {
          if (tag.length < 3) continue;
          if (tag[0] != 'r') continue;
          let u = tag[1];
          let c = tag[2];
          // dont add duplicate urls
          let addit = true;
          if (u != '') { // links can have empty url for section groups
            for (let l of newLinks) {
              addit &= (l[1] != u);
            }
          }
          if (addit) newLinks.push([c,u]);
        }
      }
    });
    setRoomLinks(newLinks);
    close();
    return;
  }

  async function deleteSelected() {
    let newLinkLists = [];
    for (let linkList of linkLists) {
      if (linkList.id != selectedListID) {
        newLinkLists.push(linkList)
      } else {
        requestDeletionById(linkList.id);
      }
    }
    setLinkLists(newLinkLists);
  }

  function LinkListChoices() {
    if (linkLists == undefined || linkLists.length == 0) {
        return (
            <div className="text-md">
                There were no link lists found on relays to import from.  
                Use the export function to create a link list before attempting to import it.
            </div>            
        );
    }
    return (<>
        {linkLists.map((linkList) => {
            let created_at = linkList.created_at;
            let id = linkList.id;
            let dTag = '';
            let name = '';
            let about = '';
            let image = '';
            let linkcount = 0;
            for (let tag of linkList.tags) {
                if (tag.length < 2) continue;
                if (tag[0] == 'd') dTag = tag[1];
                if (tag[0] == 'name') name = tag[1];
                if (tag[0] == 'about') about = tag[1];
                if (tag[0] == 'image') image = tag[1];
                if (tag[0] == 'r') linkcount += 1;
            }
            if (selectedListID == '') {
                // assign first
                setSelectedListID(id);
            }
            image = image.replaceAll('/localhost/','/cornychat.com/');
            const date = new Date(created_at * 1000);
            var dateOptions = { weekday: 'long', month: 'long', day: 'numeric' }; 
            const humanDate = new Intl.DateTimeFormat('en-us',dateOptions).format(date);
            if (linkcount > 0) {
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
                                    <td align="right" class="text-sm text-nowrap">saved {humanDate}</td>
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
      <div className="bg-gray-700 text-gray-200 p-6 rounded-lg">
        <h2 className="text-2xl font-bold">Import Links</h2>
        <>
        <p>
          Link Lists
        </p>
        <div className="flex flex-wrap justify-between">
          { loadingData ? (<h4>Loading...</h4>) : ( <LinkListChoices /> )}
        </div>
        <div className="flex justify-between">
        {(linkLists.length > 0 && selectedListID != '') && (
          <button
          className="py-2 px-4 rounded text-center"
          style={{
            backgroundColor: roomColor.buttons.primary,
            color: textColor,
          }}
          onClick={async () => {
            if (linkLists != undefined) {
              let result = confirm('Are you sure you want to delete this link set?');
              if (result != true) return;
              await deleteSelected();
            }
          }}
        >
          Delete
        </button>
        )}
        {(linkLists.length > 0) && (
        <button
          className="py-2 px-4 rounded text-center"
          style={{
            backgroundColor: roomColor.buttons.primary,
            color: textColor,
          }}
          onClick={async () => {
            if (linkLists != undefined) {
                await addlinks();
            }
          }}
        >
          Add links to room from selected link list
        </button>
        )}
        </div>
        </>
      </div>  
    </Modal>
  );
};
