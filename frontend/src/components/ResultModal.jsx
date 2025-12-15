import React from 'react';

const formatTime = (time) => (typeof time === 'number' ? `${time.toFixed(4)} ms` : 'N/A');

const ResultModal = ({ result, onClose }) => {
  const message = result?.message || (result?.isCorrect ? 'Great job!' : 'Please try again.');
  const algorithmStats = result?.gameResult;
  const showAlgorithmStats =
    algorithmStats?.algorithm1Name &&
    algorithmStats?.algorithm2Name &&
    (typeof algorithmStats.algorithm1Time === 'number' || typeof algorithmStats.algorithm2Time === 'number');

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
          <p className="result-message">{message}</p>
          
          <div className="result-details">
            <div className="detail-row">
              <span>Your Moves:</span>
              <strong>{result.userMoves}</strong>
            </div>
            <div className="detail-row">
              <span>Correct Moves:</span>
              <strong>{result.correctMoves}</strong>
            </div>
            {showAlgorithmStats && (
              <>
                <div className="detail-row">
                  <span>{algorithmStats.algorithm1Name}:</span>
                  <strong>{formatTime(algorithmStats.algorithm1Time)}</strong>
                </div>
                <div className="detail-row">
                  <span>{algorithmStats.algorithm2Name}:</span>
                  <strong>{formatTime(algorithmStats.algorithm2Time)}</strong>
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
