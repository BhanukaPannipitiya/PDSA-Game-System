import React from 'react';

const ResultModal = ({ result, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className={`result-header ${result.isCorrect ? 'success' : 'error'}`}>
          {result.isCorrect ? (
            <>
              <span className="icon">🎉</span>
              <h2>Congratulations!</h2>
            </>
          ) : (
            <>
              <span className="icon">😔</span>
              <h2>Try Again!</h2>
            </>
          )}
        </div>

        <div className="result-body">
          <p className="result-message">{result.message}</p>
          
          <div className="result-details">
            <div className="detail-row">
              <span>Your Moves:</span>
              <strong>{result.userMoves}</strong>
            </div>
            <div className="detail-row">
              <span>Correct Moves:</span>
              <strong>{result.correctMoves}</strong>
            </div>
            {result.gameResult && (
              <>
                <div className="detail-row">
                  <span>{result.gameResult.algorithm1Name}:</span>
                  <strong>{result.gameResult.algorithm1Time.toFixed(4)} ms</strong>
                </div>
                <div className="detail-row">
                  <span>{result.gameResult.algorithm2Name}:</span>
                  <strong>{result.gameResult.algorithm2Time.toFixed(4)} ms</strong>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="result-footer">
          <button className="btn btn-primary" onClick={onClose}>
            {result.isCorrect ? 'Play Again' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
