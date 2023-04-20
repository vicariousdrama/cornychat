import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom/client';
import {JamProvider, useJam} from 'jam-core-react';
import {Start} from './views/Start';
import {Conference} from './views/Conference';
import {Join} from './views/Join';
import {ConferenceProvider} from './ConferenceProvider';

import './App.scss';

const domain = window.location.host;

const jamConfig = {
  domain,
  urls: {
    stun: `stun:stun.jam.systems:3478`,
    turn: `turn:turn.jam.systems:3478`,
    turnCredentials: {username: 'test', credential: 'yieChoi0PeoKo8ni'},
  },
  sfu: true,
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <div className="microconf">
    <JamProvider options={{jamConfig}}>
      <App />
    </JamProvider>
  </div>
);

function App() {
  const [props, setProps] = useState(
    window.location.hash.substring(1).split('/')
  );

  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    let hashChange = () => {
      setProps(window.location.hash.substring(1).split('/'));
    };
    window.addEventListener('hashchange', hashChange);
    return () => {
      window.removeEventListener('hashchange', hashChange);
    };
  });

  const [conferenceId, roomId] = props;

  if (conferenceId) {
    return (
      <ConferenceProvider conferenceId={conferenceId} roomId={roomId}>
        {userInteracted ? (
          <Conference />
        ) : (
          <Join setUserInteracted={setUserInteracted} />
        )}
      </ConferenceProvider>
    );
  } else {
    return <Start setUserInteracted={setUserInteracted} />;
  }
}
