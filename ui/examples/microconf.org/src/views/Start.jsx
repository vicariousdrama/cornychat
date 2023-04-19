import React from 'react';
import {createConference, randomConferenceName} from '../lib/conference';
import {useJam, use} from 'jam-core-react';

import './Start.scss';

export const Start = ({setUserInteracted}) => {
  const [state, api] = useJam();

  let [myIdentity] = use(state, ['myIdentity']);

  const [conferenceName, setConferenceName] = React.useState(
    randomConferenceName
  );

  const [displayName, setDisplayName] = React.useState(
    myIdentity?.info?.name || ''
  );
  const [theme, setTheme] = React.useState('scifi');

  const [errorMessage, setErrorMessage] = React.useState('');

  const checkErrors = () => {
    if (conferenceName === '') {
      setErrorMessage('Please enter a conference name!');
      return false;
    }

    if (displayName === '') {
      setErrorMessage('Please enter your name!');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const createNewConference = async () => {
    if (!checkErrors()) {
      return;
    }

    await api.updateInfo({name: displayName});
    setUserInteracted(true);

    const conference = await createConference(
      conferenceName,
      theme,
      state,
      api
    );
    window.location.hash = `${conference.id}/${Object.keys(conference.rooms).at(
      0
    )}`;
  };

  document.getElementById('theme-variables').href = `/themes/${theme}.css`;

  return (
    <div className="start">
      <h1>
        microconf
        <div className="legend">create your own conference</div>
      </h1>
      <div className="conference-info">
        <span className="legend">conference name</span>
        <input
          type="text"
          value={conferenceName}
          onChange={e => {
            checkErrors();
            setConferenceName(e.target.value);
          }}
        />
        <br />
        <span className="legend">theme</span>
        <select value={theme} onChange={e => setTheme(e.target.value)}>
          <option>scifi</option>
          <option>whiteboard</option>
        </select>
        <br />
        <span className="legend">your name</span>
        <input
          type="text"
          value={displayName}
          onChange={e => {
            checkErrors();
            setDisplayName(e.target.value);
          }}
        />
        <br />
        {errorMessage !== '' && (
          <>
            <span className="error">{errorMessage}</span>
            <br />
          </>
        )}
        <button className="main-button" onClick={createNewConference}>
          Create Conference
        </button>
      </div>
    </div>
  );
};
