import React, {useState} from 'react';
import {rawTimeZones, getTimeZones} from '@vvo/tzdb';

export function Schedule({
  myId,
  nostrNpub,
  iOwn,
  name,
  description,
  schedule,
  setSchedule,
  textColor,
  roomColor,
}) {
  let makeUnixTime = (d,t,z) => {
    let ny = parseInt(d.split('-')[0]);
    let nm = parseInt(d.split('-')[1]) - 1; // month index is zero based
    let nd = parseInt(d.split('-')[2]);
    let nh = (parseInt(t.split(':')[0]));
    let nn = (parseInt(t.split(':')[1]));
    let nhs = (nh * 60 * 60); // hours in seconds
    let nns = (nn * 60);      // minutes in seconds
    let nts = (nhs + nns);
    let nz = 0;
    if(z != undefined) {
      for (let r of rawTimeZones) {
        if (r.name == z) {
          //console.log(`Using ltzo ${r.abbreviation} with offset ${r.rawOffsetInMinutes}`);
          nz = r.rawOffsetInMinutes * 60;
        }
      }
    }
    // Get local time zone offset
    let ltz = Intl.DateTimeFormat().resolvedOptions().timeZone; // Europe/London
    let ltzo = 0;
    for (let r of rawTimeZones) {
      if (r.name == ltz) {
        //console.log(`Using ltzo ${r.abbreviation} with offset ${r.rawOffsetInMinutes}`);
        ltzo = r.rawOffsetInMinutes * 60;
      }
    }
    //console.log(`making unix time from ${d} ${t} ${z} -> year: ${ny}, month: ${nm}, day: ${nd}, hour: ${nh}, minute: ${nn}, offset seconds: ${nz}, ltzo seconds: ${ltzo}`)
    let o = new Date(ny,nm,nd,nh,nn);
    let p = (o.getTime() / 1000);
    let u = (o.getTime() / 1000) + (ltzo - nz);
    //console.log(`computed unix utc time: ${u} (local timestamp ${p} + (localoffset ${ltzo} - utc offset ${nz}))`);
    return u;
  }

  let iCanSchedule = (nostrNpub.length > 0); // iOwn
  let sd = schedule?.startdate ?? new Date().toISOString().split('T')[0];
  let st = schedule?.starttime ?? '00:00';
  let sz = schedule?.timezone ?? "Europe/London";
  let sut = makeUnixTime(sd,st,sz);
  let ed = schedule?.enddate ?? new Date().toISOString().split('T')[0];
  let et = schedule?.endtime ?? '00:00';
  let ez = schedule?.timezone ?? "Europe/London";
  let eut = makeUnixTime(ed,et,ez);
  let [scheduleCandidate, setScheduleCandidate] = useState({
    title: schedule?.title ?? name,
    summary: schedule?.summary ?? description,
    startdate: sd,
    starttime: st,
    startUnixTime: sut,
    timezone: sz,
    enddate: ed,
    endtime: et,
    endUnixTime: eut,
  });
  let [expanded, setExpanded] = useState(false);
  let [editing, setEditing] = useState(false);
  let [showTimezoneSelect, setShowTimezoneSelect] = useState(false);
  let [showRepeatSelect, setShowRepeatSelect] = useState(false);
  let handleScheduleChange = e => {
    setScheduleCandidate({
      ...scheduleCandidate,
      [e.target.name]: e.target.value,
    });
  };
  let removeSchedule = e => {
    e.preventDefault();
    setSchedule(undefined);
  };
  let submitSchedule = e => {
    e.preventDefault();
    if (scheduleCandidate) {
      let schedule = scheduleCandidate;
      let sd = scheduleCandidate?.startdate ?? new Date().toISOString().split('T')[0];
      let st = scheduleCandidate?.starttime ?? '00:00';
      let sz = scheduleCandidate?.timezone ?? "Europe/London";
      scheduleCandidate.startUnixTime = makeUnixTime(sd,st,sz);
      let ed = scheduleCandidate?.enddate ?? new Date().toISOString().split('T')[0];
      let et = scheduleCandidate?.endtime ?? '00:00';
      let ez = scheduleCandidate?.timezone ?? "Europe/London";
      scheduleCandidate.endUnixTime = makeUnixTime(ed,et,ez);
      scheduleCandidate.setById = myId;
      scheduleCandidate.setByNpub = nostrNpub;
      scheduleCandidate.setOn = Date.now();
      let data = sessionStorage.getItem(myId);
      setSchedule(scheduleCandidate);
      setEditing(false);
    }
  };
    
  return (
    <div>
      <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpanded(!expanded)}>
      {expanded ? '🔽' : '▶️'} Schedule
      </p>
      <div className={expanded ? 'bg-gray-700' : 'hidden'}>
      <div className="mb-2 bg-gray-700 my-5 rounded-lg text-gray-300">
        <form className="bg-gray-700 text-gray-200">
            {iCanSchedule &&(
          <div className={schedule && !editing ? 'hidden' : 'w-full'}>
            <div className="flex">
                <span className="flex-none p-2">
                    Title
                </span>
            </div>
            <div className="flex">
                <input
                    type="text"
                    className="flex-grow p-2 border rounded bg-gray-400 text-black"
                    name="title"
                    placeholder="Title for scheduled event"
                    value={scheduleCandidate?.title || `${name}`}
                    onChange={handleScheduleChange}
                />
            </div>
            <div className="flex my-2">
                <span className="flex-none p-2">
                    Description
                </span>
            </div>
            <div className="flex">
                <input
                    type="text"
                    className="flex-grow p-2 border rounded bg-gray-400 text-black"
                    name="summary"
                    placeholder="Summary for scheduled event"
                    value={scheduleCandidate?.summary || `${description}`}
                    onChange={handleScheduleChange}
                />
            </div>
            <div className="flex">
              <span className="flex-none p-2 text-sm font-medium">
                Starting
              </span>
            </div>
            <div className="flex">
              <input
                type="date"
                className="flex-grow border rounded bg-gray-400 text-black"
                name="startdate"
                placeholder="yyyy-mm-dd"
                min={`${
                  new Date(new Date() - 86400000).toISOString().split('T')[0]
                }`}
                value={
                  scheduleCandidate?.startdate ||
                  `${new Date().toISOString().split('T')[0]}`
                }
                onChange={handleScheduleChange}
              />
              <input
                type="time"
                className="flex-none ml-3 border rounded bg-gray-400 text-black"
                name="starttime"
                placeholder="hh:mm"
                value={scheduleCandidate?.starttime || '09:00'}
                onChange={handleScheduleChange}
              />
            </div>
            <div
              className={
                showTimezoneSelect ? 'hidden' : 'p-2 pt-4 text-gray-500 text-sm font-medium'
              }
            >
              Timezone: {scheduleCandidate.timezone}{' '}
            </div>
            <div className="flex">
              <span
                className="underline"
                onClick={() => setShowTimezoneSelect(true)}
              >
                change
              </span>
            </div>
            <select
              name="timezone"
              defaultValue={scheduleCandidate.timezone}
              onChange={handleScheduleChange}
              className={
                showTimezoneSelect ? 'w-full border mt-3 p-2 rounded bg-gray-400 text-black' : 'hidden'
              }
            >
              {rawTimeZones.map(tz => {
                return (
                  <option key={tz.rawFormat} value={tz.name}>
                    {tz.rawFormat}
                  </option>
                );
              })}
            </select>
            <div className="flex">
              <span className="flex-none p-2 text-sm font-medium">
                Ending
              </span>
            </div>
            <div className="flex">
              <input
                type="date"
                className="flex-grow p-2 border rounded bg-gray-400 text-black"
                name="enddate"
                placeholder="yyyy-mm-dd"
                min={`${
                  new Date(new Date() - 86400000).toISOString().split('T')[0]
                }`}
                value={
                  scheduleCandidate?.enddate ||
                  `${new Date().toISOString().split('T')[0]}`
                }
                onChange={handleScheduleChange}
              />
              <input
                type="time"
                className="flex-none ml-3 p-2 border rounded bg-gray-400 text-black"
                name="endtime"
                placeholder="hh:mm"
                value={scheduleCandidate?.endtime || '17:00'}
                onChange={handleScheduleChange}
              />
            </div>
            <span className="hidden">
            <div className={showRepeatSelect ? 'hidden' : 'p-2 text-gray-500'}>
              <span
                className="underline"
                onClick={() => setShowRepeatSelect(true)}
              >
                repeat?
              </span>
            </div>
            <select
              name="repeat"
              defaultValue="never"
              onChange={handleScheduleChange}
              className={
                showRepeatSelect ? 'border mt-3 p-2 rounded' : 'hidden'
              }
            >
              {['never', 'weekly', 'monthly'].map(rep => {
                return (
                  <option key={rep} value={rep}>
                    {rep}
                  </option>
                );
              })}
            </select>
            </span>
          </div>
            )}
          <div
            className={schedule || !editing ? 'rounded bg-gray-700 border mt-4 w-full' : 'hidden'}
          >
            <div className="text-gray-300 p-3 font-medium">
              Starting {schedule?.startdate} at {schedule?.starttime}
              <br />
              Ending {schedule?.enddate} at {schedule?.endtime}
              <br />
              Timezone: {schedule?.timezone}
              <br />
              Title: {schedule?.title}
              <br />
              Summary: {schedule?.summary}
              <br />
              {schedule?.repeat == 'weekly' || schedule?.repeat == 'monthly'
                ? schedule?.repeat
                : ''}
            </div>
            {iCanSchedule && (
            <div className={schedule && !editing ? 'p-3 text-gray-500' : 'hidden'}>
              <span
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  let result = confirm('Are you sure you want to remove the schedule?');
                  if (result != true) {
                    return;
                  }
                  removeSchedule(e);
                }}
              >
                ❌ Clear Existing Schedule
              </span>
            </div>
            )}
            {iCanSchedule && (
            <div className={schedule && !editing ? 'p-3 text-gray-500' : 'hidden'}>
              <span
                className="rounded-lg bg-gray-300 px-3 py-2 mx-1 my-1 text-xs cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  setEditing(true);
                }}
              >
                📝 Edit Existing Schedule
              </span>
            </div>
            )}
          </div>
          {!iCanSchedule && !schedule && (
            <div className="text-gray-500 p-3">
                No future event is scheduled
            </div>
          )}
          {iCanSchedule && (
          <div className={!schedule || editing ? 'flex bg-gray-700' : 'hidden'}>
            <button
              onClick={submitSchedule}
              className="flex-grow mt-5 h-12 px-6 text-lg bg-gray-600 rounded-lg mr-2"
              style={{
                color: textColor,
                backgroundColor: roomColor.buttons.primary,
              }}
            >
              Set Schedule
            </button>
          </div>
          )}
          {(nostrNpub.length == 0) && (
          <div className="h-12 mx-2 text-sm rounded-md border-2 border-gray-300 w-full text-center text-gray-200">
            Use a nostr extension to schedule an event
          </div>
        )}
        </form>
      </div>
      </div>
    </div>
  );
}
