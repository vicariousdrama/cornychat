import React from 'react';
import {useJamState} from '../jam-core-react';

export default function Me() {
  let myId = useJamState('myId');
  return (
    <div className="p-6 md:p-10 bg-slate-500 text-gray-200">
      <h1>Your Identity</h1>

      <p className="mt-4 text-gray-200">
        This is your identity on {window.location.hostname}
      </p>

      <pre className="rounded-md bg-yellow-50 not-italic text-xs text-center py-2 -ml-2 mt-4 md:text-base">
        {myId}
      </pre>
    </div>
  );
}
