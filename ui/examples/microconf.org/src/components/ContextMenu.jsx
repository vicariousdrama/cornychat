import React from 'react';

import './ContextMenu.scss';

export const ContextMenu = ({menuItems = [], show = false, title}) => {
  return (
    show && (
      <ul className="context-menu">
        {title && <li className="context-menu-title">{title}</li>}
        {menuItems.map(({text, handler}, index) => {
          return (
            <li key={index} className="context-menu-item">
              <button className="context-menu-item-button" onClick={handler}>
                {text}
              </button>
            </li>
          );
        })}
      </ul>
    )
  );
};
