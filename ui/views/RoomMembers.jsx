import React, {useState} from 'react';
import {AudienceAvatar, StageAvatar} from './Avatar';
import {use} from 'use-minimal-state';
import {userAgent} from '../lib/user-agent';
import {openModal} from './Modal';
import {Profile} from './Profile';


export default function RoomMembers({
  audienceBarBG,
  audienceBarFG,
  audiencePeers,
  handRaised,
  handType,
  hasMicFailed,
  identities,
  iModerate,
  iOwn,
  iSpeak,
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


  return (
    <div>

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
                  handRaised={handRaised}
                  handType={handType}
                  onClick={() => {
                    openModal(Profile, {
                      info: state.myIdentity.info,
                      room,
                      peerId: myPeerId,
                      iOwn,
                      iModerate,
                      actorIdentity: myIdentity,
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
                  handRaised={peerState[peerId]?.handRaised}
                  handType={peerState[peerId]?.handType}
                  onClick={() => {
                    openModal(Profile, {
                      info: identities[peerId],
                      room,
                      peerId,
                      iOwn,
                      iModerate,
                      actorIdentity: myIdentity,
                    });
                  }}
                />
              ))}
            </ol>
          </div>

          {/* Audience */}
          {!stageOnly &&  (!iSpeak || audiencePeers.length > 0) && (
            <>
          <div className="rounded-md m-0 p-0 mt-2 mb-4" style={{backgroundColor: audienceBarBG, color: audienceBarFG}}>
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
                    handRaised={handRaised}
                    handType={handType}
                    onClick={() => {
                      openModal(Profile, {
                        info: state.myIdentity.info,
                        room,
                        peerId: myPeerId,
                        iOwn,
                        iModerate,
                        actorIdentity: myIdentity,
                      });
                    }}
                  />
                )}
                {audiencePeers.map(peerId => (
                  <AudienceAvatar
                    key={peerId}
                    {...{peerId, peerState, moderators, owners, reactions, room}}
                    canSpeak={false}
                    peerState={peerState[peerId]}
                    info={identities[peerId]}
                    handRaised={peerState[peerId]?.handRaised}
                    handType={peerState[peerId]?.handType}
                    onClick={() =>
                      openModal(Profile, {
                        info: identities[peerId],
                        room,
                        peerId,
                        iOwn,
                        iModerate,
                        actorIdentity: myIdentity,
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
