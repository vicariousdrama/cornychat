import React, {useState, useEffect} from 'react';
import {nip19} from 'nostr-tools';
import {Modal} from '../Modal';
import {loadZapGoals, requestDeletionById} from '../../nostr/nostr';

export const ImportZapGoalModal = ({
    close,
    textColor,
    roomColor,
    setZapGoal,
}) => {
  const [loadingData, setLoadingData] = useState(true);
  const [zapGoalList, setZapGoalList] = useState([]);
  const [selectedZapGoalID, setSelectedZapGoalID] = useState('x');

  useEffect(() => {
    const loadData = async () => {
        setLoadingData(true);
        let loadedZapGoals = await loadZapGoals();
        setZapGoalList(loadedZapGoals);
        setLoadingData(false);
    };
    loadData();
  }, []);

  async function setGoal() {
    if (zapGoalList.length > 1 && selectedZapGoalID != '') {
        zapGoalList.map((zg, index) => {
            if (zg.id == selectedZapGoalID) {
                let amount = 0;
                let npub = nip19.npubEncode(zg.pubkey);
                for (let tag of zg.tags) {
                    if (tag.length < 2) continue;
                    if (tag[0] == 'amount') 
                    {
                        amount = Math.floor(String(Math.floor(tag[1])).replace("NaN",0));
                        amount = Math.floor(amount / 1000);
                    }
                }
                setZapGoal({content:zg.content,amount:String(amount),id:zg.id,npub:npub});
            }
        });
    }
    close();
    return;
  }

  async function deleteSelected() {
    let newGoals = [];
    for (let item of zapGoalList) {
      if (item.id != selectedZapGoalID) {
        newGoals.push(item);
      } else {
        requestDeletionById(item.id);
      }
    }
    setZapGoalList(newGoals);
  }

  function ZapGoalChoices() {
    if (zapGoalList == undefined || zapGoalList.length == 0) {
        return (
            <div className="text-md">
                No zap goals were found.  Close this window and click the Create Goal button to make one.  
            </div>            
        );
    }
    return (<>
        {zapGoalList.map((zg, index) => {
            let k = `zapgoal_${index}`;
            let created_at = zg.created_at;
            let id = zg.id;
            let content = zg.content;
            let amount = 0;
            for (let tag of zg.tags) {
                if (tag.length < 2) continue;
                if (tag[0] == 'amount') {
                    amount = Math.floor(String(Math.floor(tag[1])).replace("NaN",0));
                    amount = Math.floor(amount / 1000);
                }                 
            }
            if (selectedZapGoalID == '') {
                // assign first
                setSelectedZapGoalID(id);
            }
            const date = new Date(created_at * 1000);
            var dateOptions = { weekday: 'long', month: 'long', day: 'numeric' }; 
            const humanDate = new Intl.DateTimeFormat('en-us',dateOptions).format(date);
            let theclass = 'select-none px-2 text-sm rounded-sm m-2 border-2 w-full ' + (selectedZapGoalID == id ? ' border-blue-500' : ' hover:border-blue-500 cursor-pointer');
            return (
                <div key={k} className={theclass}
                onClick={() => setSelectedZapGoalID(id)}                        
                >
                <div className="flex">{content}</div>
                <div className="flex">goal amount: {amount} sats</div>
                <div className="flex">created: {humanDate}</div>
                </div>
            );
        })}
    </>);
  }

  return (
    <Modal close={close}>
      <div className="bg-gray-700 text-gray-200 p-2 rounded-lg">
        <h2 className="text-2xl font-bold">Attach Zap Goal</h2>
        <>
        <p>
          Select from your previously created zap goals
        </p>
        <div className="flex flex-wrap justify-between">
          { loadingData ? (<h4>Loading...</h4>) : ( <ZapGoalChoices /> )}
        </div>
        <div className="flex justify-between">
        {(zapGoalList.length > 0 && selectedZapGoalID != '') && (
        <>
          <button
          className="py-2 px-4 rounded text-center"
          style={{
            backgroundColor: roomColor.buttons.primary,
            color: textColor,
          }}
          onClick={async () => {
            let result = confirm('Are you sure you want to delete this zap goal?');
            if (result != true) return;
            await deleteSelected();
          }}
        >
          Delete
        </button>
        <button
          className="py-2 px-4 rounded text-center"
          style={{
            backgroundColor: roomColor.buttons.primary,
            color: textColor,
          }}
          onClick={async () => {
            if (zapGoalList != undefined) {
                await setGoal();
            }
          }}
        >
          Attach
        </button>
        </>
        )}
        </div>
        </>
      </div>  
    </Modal>
  );
};
