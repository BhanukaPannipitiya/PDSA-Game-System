import React, { useState, useEffect } from 'react';
import { generateGame, solveHanoi, submitAnswer } from '../services/api.js';
import GameBoard from "../components/GameBoard.jsx";
import ResultModal from "../components/ResultModal.jsx";
import '../App.css';

const TowerOfHanoi = () => {
  const [numDisks, setNumDisks] = useState(5);
  const [numPegs, setNumPegs] = useState(3);
  const [playerName, setPlayerName] = useState('');
  const [userMoves, setUserMoves] = useState('');
  const [userSequence, setUserSequence] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState(null);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadGame();
  }, []);

  const loadGame = async () => {
    try {
      const response = await generateGame();
      setNumDisks(response.data.numDisks);
    } catch (error) {
      console.error('Error loading game:', error);
    }
  };

  const validateInputs = () => {
    const newErrors = {};
    
    if (!playerName.trim()) {
      newErrors.playerName = 'Player name is required';
    }
    
    if (!numPegs || (numPegs !== 3 && numPegs !== 4)) {
      newErrors.numPegs = 'Please select number of pegs (3 or 4)';
    }
    
    if (!userMoves || userMoves < 1) {
      newErrors.userMoves = 'Please enter a valid number of moves';
    }
    
    if (!userSequence.trim()) {
      newErrors.userSequence = 'Please enter the move sequence';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartGame = () => {
    if (!playerName.trim()) {
      setErrors({ playerName: 'Player name is required to start' });
      return;
    }
    setGameStarted(true);
    setErrors({});
  };

  const handleShowSolution = async () => {
    try {
      setLoading(true);
      const response = await solveHanoi(numDisks, numPegs);
      setSolution(response.data);
      setShowSolution(true);
    } catch (error) {
      console.error('Error getting solution:', error);
      alert('Error getting solution. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const parseSequence = (sequenceString) => {
    // Defensive parsing: ensure we have a string
    if (!sequenceString || typeof sequenceString !== 'string') {
      throw new Error('Invalid sequence format. Use format: A -> B, C -> D');
    }

    // Split by comma or newline and clean up (allow multiple separators)
    const moves = sequenceString
      .split(/[,\n]+/)
      .map(move => move.trim())
      .filter(move => move.length > 0);

    // Validate format (e.g., "A -> B") and allow lowercase letters
    const moveRegex = /^[A-D]\s*->\s*[A-D]$/i;
    const validMoves = moves.every(move => moveRegex.test(move));

    if (!validMoves) {
      throw new Error('Invalid sequence format. Use format: A -> B, C -> D');
    }

    // Normalize moves to consistent format (uppercase and single arrow spacing)
    return moves.map(m => m.replace(/\s*[-]+>\s*/i, ' -> ').toUpperCase());
  };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);
      const sequence = parseSequence(userSequence);
      
      const response = await submitAnswer(
        playerName,
        numDisks,
        numPegs,
        parseInt(userMoves),
        sequence
      );
      
      setResult(response.data);
      setShowResult(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
      if (error.message.includes('Invalid sequence')) {
        setErrors({ userSequence: error.message });
      } else {
        alert('Error submitting answer. Please check your input.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewGame = () => {
    setGameStarted(false);
    setShowSolution(false);
    setSolution(null);
    setResult(null);
    setShowResult(false);
    setUserMoves('');
    setUserSequence('');
    setErrors({});
    loadGame();
  };

  const handleCloseResult = () => {
    setShowResult(false);
    if (result?.isCorrect) {
      handleNewGame();
    }
  };

  return (
    <div className="tower-of-hanoi-container">
      <div className="game-header">
        <h1>🗼 Tower of Hanoi Game</h1>
        <p className="game-description">
          Move all disks from peg A to peg D following the rules!
        </p>
      </div>

      {!gameStarted ? (
        <div className="game-setup">
          <div className="setup-card">
            <h2>Game Setup</h2>
            
            <div className="form-group">
              <label>Player Name *</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className={errors.playerName ? 'error' : ''}
              />
              {errors.playerName && <span className="error-text">{errors.playerName}</span>}
            </div>

            <div className="form-group">
              <label>Number of Disks: {numDisks}</label>
              <p className="info-text">
                (Randomly selected between 5-10)
              </p>
            </div>

            <div className="form-group">
              <label>Select Number of Pegs *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    value={3}
                    checked={numPegs === 3}
                    onChange={() => setNumPegs(3)}
                  />
                  3 Pegs (Classic)
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value={4}
                    checked={numPegs === 4}
                    onChange={() => setNumPegs(4)}
                  />
                  4 Pegs (Frame-Stewart)
                </label>
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleStartGame}>
              Start Game
            </button>
          </div>
        </div>
      ) : (
        <div className="game-play">
          <div className="game-info-bar">
            <div className="info-item">
              <strong>Player:</strong> {playerName}
            </div>
            <div className="info-item">
              <strong>Disks:</strong> {numDisks}
            </div>
            <div className="info-item">
              <strong>Pegs:</strong> {numPegs}
            </div>
          </div>

          <GameBoard numDisks={numDisks} numPegs={numPegs} />

          <div className="answer-section">
            <h3>Enter Your Answer</h3>
            
            <div className="form-group">
              <label>Number of Moves Required *</label>
              <input
                type="number"
                value={userMoves}
                onChange={(e) => setUserMoves(e.target.value)}
                placeholder="Enter minimum number of moves"
                min="1"
                className={errors.userMoves ? 'error' : ''}
              />
              {errors.userMoves && <span className="error-text">{errors.userMoves}</span>}
            </div>

            <div className="form-group">
              <label>Move Sequence *</label>
              <textarea
                value={userSequence}
                onChange={(e) => setUserSequence(e.target.value)}
                placeholder="Enter moves in format: A -> B, A -> C, B -> C, ..."
                rows="5"
                className={errors.userSequence ? 'error' : ''}
              />
              {errors.userSequence && <span className="error-text">{errors.userSequence}</span>}
              <p className="help-text">
                Format: A -&gt; B (separate moves with commas or new lines)
              </p>
            </div>

            <div className="button-group">
              <button 
                className="btn btn-primary" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Answer'}
              </button>
              
              <button 
                className="btn btn-secondary" 
                onClick={handleShowSolution}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Show Solution'}
              </button>
              
              <button 
                className="btn btn-outline" 
                onClick={handleNewGame}
              >
                New Game
              </button>
            </div>
          </div>

          {showSolution && solution && (
            <div className="solution-panel">
              <h3>Solution</h3>
              <div className="solution-content">
                <div className="solution-stats">
                  <div className="stat-item">
                    <strong>Minimum Moves:</strong> {solution.minMoves}
                  </div>
                  <div className="stat-item">
                    <strong>{solution.algorithm1?.name ?? 'Algorithm 1'}:</strong>{' '}
                    {typeof solution.algorithm1?.time === 'number' ? `${solution.algorithm1.time.toFixed(4)} ms` : 'N/A'}
                  </div>
                  <div className="stat-item">
                    <strong>{solution.algorithm2?.name ?? 'Algorithm 2'}:</strong>{' '}
                    {typeof solution.algorithm2?.time === 'number' ? `${solution.algorithm2.time.toFixed(4)} ms` : 'N/A'}
                  </div>
                </div>
                
                <div className="solution-sequence">
                  <h4>Move Sequence:</h4>
                    <div className="sequence-list">
                    {Array.isArray(solution.sequence) ? (
                      solution.sequence.map((move, index) => (
                        <span key={index} className="move-item">
                          {index + 1}. {move}
                        </span>
                      ))
                    ) : (
                      <div>No sequence available</div>
                    )}
                  </div>
                </div>
              </div>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowSolution(false)}
              >
                Hide Solution
              </button>
            </div>
          )}
        </div>
      )}

      {showResult && result && (
        <ResultModal 
          result={result} 
          onClose={handleCloseResult}
        />
      )}
    </div>
  );
};

export default TowerOfHanoi;