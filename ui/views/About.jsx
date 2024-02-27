import React from 'react';

export default function About() {
  return (
    <div className="p-6 md:p-10 bg-slate-500" style={{color:'white'}}>
      <h1>About Corny Chat</h1>

      <p className="text-lg">
      Corny Chat is built upon Nostr Live Audio Spaces as a fork of Jam.  The source of these projects is available at:
      </p>
      <ul>
        <li>Corny Chat: <a href="https://github.com/vicariousdrama/cornychat">https://github.com/vicariousdrama/cornychat</a></li>
        <li>Nostr Live Audio Spaces: <a href="https://github.com/diamsa/jam">https://github.com/diamsa/jam</a></li>
        <li>Jam: <a href="https://gitlab.com/jam-systems/jam/">https://gitlab.com/jam-systems/jam/</a></li>
      </ul>
      <p className="text-lg">
      The software is licensed under GNU AGPLv3, an open source license.
      </p>

      <h2>Contributors</h2>
      <p>Developers: Diego, Vic</p>
      <p>Art: Kajoozie, Noshole, Puzzles</p>
      <p>Known Financial Supporters: Frank, Kajoozie, New1, Noshole, Propaganda Daily, Ralf, Sai, Séimí, Vic</p>
    </div>
  );
}
