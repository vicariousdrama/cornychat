import React, {useState} from 'react';
import {AudienceAvatar, StageAvatar} from './MiniAvatar';
import {use} from 'use-minimal-state';
import {userAgent} from '../lib/user-agent';
import {openModal} from './Modal';
import {Profile} from './Profile';

export default function MiniRoomMembers({
  audienceBarBG,
  audienceBarFG,
  audiencePeers,
  hasMicFailed,
  identities,
  iModerate,
  iOwn,
  iSpeak,
  iAmAdmin,
  moderators,
  myIdentity,
  myInfo,
  myPeerId,
  myPeerState,
  owners,
  peerState,
  reactions,
  room,
  speaking,
  stageOnly,
  stagePeers,
  state,
}) {
  const nJoinedAudiencePeers = audiencePeers.filter(id => peerState[id]?.inRoom)
    .length;

  return (
    <div
      onClick={e => {
        e.preventDefault();
        let ps = sessionStorage.getItem('peerSelected');
        if (ps && ps.length > 0) {
          document.getElementById('div_' + ps).style.border = '0px';
        }
        sessionStorage.setItem('peerSelected', '');
      }}
    >
      {/* Main Area */}
      <div className="h-full rounded-lg mx-4">
        {/* Stage */}
        <div className="">
          <ol className="flex flex-wrap justify-center">
            {iSpeak && (
              <StageAvatar
                key={myPeerId}
                peerId={myPeerId}
                {...{speaking, moderators, owners, reactions, room}}
                canSpeak={!hasMicFailed}
                peerState={myPeerState}
                info={myInfo}
                iAmAdmin={iAmAdmin}
                onClick={() => {
                  openModal(Profile, {
                    info: state.myIdentity.info,
                    room,
                    peerId: myPeerId,
                    iOwn,
                    iModerate,
                    actorIdentity: myIdentity,
                    iAmAdmin,
                  });
                }}
              />
            )}
            {stagePeers.map(peerId => (
              <StageAvatar
                key={peerId}
                {...{speaking, moderators, owners, room}}
                {...{peerId, peerState, reactions}}
                canSpeak={true}
                peerState={peerState[peerId]}
                info={identities[peerId]}
                iAmAdmin={iAmAdmin}
                onClick={() => {
                  openModal(Profile, {
                    info: identities[peerId],
                    room,
                    peerId,
                    iOwn,
                    iModerate,
                    actorIdentity: myIdentity,
                    iAmAdmin,
                  });
                }}
              />
            ))}
          </ol>
        </div>

        {/* Audience */}
        {!stageOnly &&
          (!iSpeak ||
            nJoinedAudiencePeers > 0 ||
            (audiencePeers.length > 0 && (iOwn || iModerate))) && (
            <>
              <div
                className="rounded-md m-0 p-0 mt-2 mb-4"
                style={{backgroundColor: audienceBarBG, color: audienceBarFG}}
              >
                Audience
              </div>

              <ol className="flex flex-wrap justify-center">
                {!iSpeak && (
                  <AudienceAvatar
                    {...{moderators, owners, reactions, room}}
                    canSpeak={false}
                    peerId={myPeerId}
                    peerState={myPeerState}
                    info={myInfo}
                    iAmAdmin={iAmAdmin}
                    onClick={() => {
                      openModal(Profile, {
                        info: state.myIdentity.info,
                        room,
                        peerId: myPeerId,
                        iOwn,
                        iModerate,
                        actorIdentity: myIdentity,
                        iAmAdmin,
                      });
                    }}
                  />
                )}
                {audiencePeers.map(peerId => (
                  <AudienceAvatar
                    key={peerId}
                    {...{
                      peerId,
                      peerState,
                      moderators,
                      owners,
                      reactions,
                      room,
                    }}
                    canSpeak={false}
                    peerState={peerState[peerId]}
                    info={identities[peerId]}
                    iAmAdmin={iAmAdmin}
                    onClick={() =>
                      openModal(Profile, {
                        info: identities[peerId],
                        room,
                        peerId,
                        iOwn,
                        iModerate,
                        actorIdentity: myIdentity,
                        iAmAdmin,
                      })
                    }
                  />
                ))}
              </ol>
            </>
          )}
      </div>
    </div>
  );
}
