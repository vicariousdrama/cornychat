import React from 'react';

export default function About() {
  return (
    <div className="p-6 md:p-10 bg-slate-500" style={{color:'white'}}>
      <h1>About Corny Chat</h1>

      <p className="text-lg">
      Corny Chat is built upon Nostr Live Audio Spaces as a fork of Jam.  The source of these projects is available at:
      </p>
      <ul>
        <li>Corny Chat: <a href="https://github.com/vicariousdrama/cornychat" style={{textDecoration: 'underline'}}>https://github.com/vicariousdrama/cornychat</a></li>
        <li>Nostr Live Audio Spaces: <a href="https://github.com/diamsa/jam" style={{textDecoration: 'underline'}}>https://github.com/diamsa/jam</a></li>
        <li>Jam: <a href="https://gitlab.com/jam-systems/jam/" style={{textDecoration: 'underline'}}>https://gitlab.com/jam-systems/jam/</a></li>
      </ul>
      <p className="text-lg">
      The software is licensed under GNU AGPLv3, an open source license.
      </p>

      <h2>Contributors</h2>
      <p>Developers: Diego, Vic</p>
      <p>Art: Kajoozie, Noshole, Puzzles</p>
      <p>Known Financial Supporters: ₿², Bevo, chef4₿rains, Frank, Kajoozie, Marie, New1, Noshole, Oobiyou, Propaganda Daily, Puzzles, Ralf, Rex, Sai, Séimí, Tekkadan, TheRupertDamnit, Tigs, Vic</p>
      <p>Super Testers: ₿², Spiral Crunch</p>

      <h2>Development</h2>
      <p><a href="/datatypes" style={{textDecoration: 'underline'}}>Corny Chat Data Types</a> - Detailed information about the 
      nostr kind data types used in Corny Chat</p>


      <h2>Build Date</h2>
      <p>This version of Corny Chat was built on BUILD_DATE</p>

      <p><a href="/" style={{textDecoration: 'underline'}}>Home</a></p>
    </div>
  );
}
