import React, {useState} from 'react';

import './ConfirmationModal.scss';

export const ConfirmationModal = ({question, answer, onYes, onNo}) => {
  const [enteredAnswer, setEnteredAnswer] = useState('');

  return (
    <div className="modal-container">
      <div className="confirmation-box">
        <div className="confirmation-question">
          <h3>{question}</h3>
        </div>
        {answer && (
          <div className="confirmation-answer">
            <div className="legend">
              Type "{answer}" and click "yes" to confirm.
            </div>
            <input type="text" onBlur={e => setEnteredAnswer(e.target.value)} />
          </div>
        )}
        <div className="confirmation-actions">
          <button
            className="main-button"
            onClick={() => (!answer || answer === enteredAnswer) && onYes()}
          >
            yes
          </button>
          <button className="main-button" onClick={onNo}>
            no
          </button>
        </div>
      </div>
    </div>
  );
};
