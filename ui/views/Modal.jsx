import React from 'react';
import {use} from 'use-minimal-state';
import state from '../logic/state';

export default function Modals() {
  let modals = use(state, 'modals');
  if (!modals) return null;
  return [...modals].map(([id, Modal, props]) => <Modal key={id} {...props} />);
}

export function Modal({close, children}) {
  return (
    <div
      className="p-0 md:p-5 items-stretch sm:items-center"
      style={{
        position: 'absolute',
        zIndex: '10',
        top: '0',
        left: '0',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#00000033',
        display: 'flex',
      }}
      onClick={close}
    >
      <div
        className="relative p-1 pt-10 pb-10 sm:rounded-xl w-sm"
        style={{
          flex: 'none',
          display: 'flex',
          flexDirection: 'column',
          margin: '0 auto',
          maxWidth: '100%',
          maxHeight: '100%',
          overflowY: 'hidden',
          backgroundColor: 'white',
        }}
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <div className="absolute top-2 right-2">
          <div
            onClick={close}
            style={{padding: '0.75rem', borderRadius: '50%', cursor: 'pointer'}}
          >
            <CloseSvg />
          </div>
        </div>
        <div
          className="px-5 sm:px-8"
          style={{
            flex: '0 1 auto',
            overflowY: 'auto',
            minHeight: '0',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function openModal(Component, props, id) {
  id = id || Math.random();
  let modal = [id, Component];
  let close = () => {
    state.modals.delete(modal);
    state.update('modals');
  };
  props = {...(props || null), close};
  modal.push(props);
  state.modals.add(modal);
  state.update('modals');
  return close;
}

export function closeModal(id) {
  for (let modal of state.modals) {
    if (modal[0] === id) {
      state.modals.delete(modal);
      break;
    }
  }
  state.update('modals');
}

function CloseSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
