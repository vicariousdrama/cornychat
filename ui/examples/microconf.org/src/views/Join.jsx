import React from 'react';
import {useJam, use} from 'jam-core-react';

import './Join.scss';
import {useConference} from '../ConferenceProvider';

export const Join = ({setUserInteracted}) => {
  const [{conference}] = useConference();
  const theme = conference?.theme || 'default';

  document.getElementById('theme-variables').href = `/themes/${theme}.css`;
  document.title = `microconf - ${conference?.name}`;

  const [jamState, jamApi] = useJam();

  let [myIdentity] = use(jamState, ['myIdentity']);
  let {updateInfo} = jamApi;

  const [displayName, setDisplayName] = React.useState(
    myIdentity?.info?.name || ''
  );

  const [errorMessage, setErrorMessage] = React.useState('');

  const checkErrors = () => {
    if (displayName === '') {
      setErrorMessage('Please enter your name!');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const join = async () => {
    if (checkErrors()) {
      await updateInfo({name: displayName});
      setUserInteracted(true);
    }
  };

  return (
    <div className="join">
      <div className="plug">
        This microconference is powered by{' '}
        <a href="https://microconf.org">microconf</a> and{' '}
        <a href="https://jamshelf.com">Jam</a>
      </div>
      <h1 className="conference-title">
        {conference?.name}
        <div className="legend">
          set your name to join conference {conference?.name}
        </div>
      </h1>
      <div className="conference-info">
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
        <button className="main-button" onClick={join}>
          Join
        </button>
      </div>
    </div>
  );
};
