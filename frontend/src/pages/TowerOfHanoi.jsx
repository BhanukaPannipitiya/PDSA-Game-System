// TowerOfHanoi.jsx - Enhanced Version
import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api.js';
import ResultModal from "../components/ResultModal.jsx";
import './TowerOfHanoi.css';

const TowerOfHanoi = ({ player, onBack }) => {
  const [numDisks, setNumDisks] = useState(5);
  const [numPegs, setNumPegs] = useState(3);
  const [userMoves, setUserMoves] = useState('');
  const [userSequence, setUserSequence] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState(null);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [disksPositions, setDisksPositions] = useState([]);
  const gameBoardRef = useRef(null);

  const pegLabels = ['A', 'B', 'C', 'D'];

  // Initialize disk positions
  useEffect(() => {
    // Add background class to body for full screen coverage
    document.body.classList.add('tower-of-hanoi-active');
    document.documentElement.classList.add('tower-of-hanoi-active');
    
    return () => {
      // Cleanup: remove class when component unmounts
      document.body.classList.remove('tower-of-hanoi-active');
      document.documentElement.classList.remove('tower-of-hanoi-active');
    };
  }, []);

  useEffect(() => {
    if (gameStarted) {
      const initialPositions = Array.from({ length: numDisks }, (_, i) => ({
        id: i,
        size: i + 1,
        peg: 0,
        color: getDiskColor(i)
      }));
      setDisksPositions(initialPositions);
    }
  }, [numDisks, numPegs, gameStarted]);

  const getDiskColor = (index) => {
    const colors = [
      '#FF8A00', '#FF2070', '#6A11CB', '#2575FC', '#FF416C',
      '#FF4B2B', '#7B2CBF', '#00B4DB', '#FF6B6B', '#4ECDC4'
    ];
    return colors[index % colors.length];
  };

  const loadGame = async () => {
    try {
      const response = await api.get('/games/hanoi/generate');
      const disks = response.data.data.numDisks || 5;
      setNumDisks(Math.min(disks, 10)); // Limit to 10 for better visualization
    } catch (error) {
      console.error('Error loading game:', error);
    }
  };

  const validateInputs = () => {
    const newErrors = {};
    
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
    setGameStarted(true);
    setCurrentMoveIndex(0);
    setErrors({});
    setShowSolution(false);
    setSolution(null);
  };

  const animateMove = async (fromPeg, toPeg, diskIndex) => {
    setIsAnimating(true);
    
    // Animate disk lifting
    const disk = document.querySelector(`.disk-${diskIndex}`);
    disk.style.transform = 'translateY(-100px)';
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Animate moving horizontally
    const fromPegPos = document.querySelector(`.peg-${fromPeg}`).getBoundingClientRect();
    const toPegPos = document.querySelector(`.peg-${toPeg}`).getBoundingClientRect();
    const boardRect = gameBoardRef.current.getBoundingClientRect();
    
    const deltaX = toPegPos.left - fromPegPos.left;
    disk.style.transform = `translate(${deltaX}px, -100px)`;
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Animate placing
    disk.style.transform = 'translate(0, 0)';
    
    // Update positions
    setDisksPositions(prev => prev.map(disk => 
      disk.id === diskIndex ? { ...disk, peg: toPeg } : disk
    ));
    
    setIsAnimating(false);
  };

  const handleShowSolution = async () => {
    try {
      setLoading(true);
      const response = await api.post('/games/hanoi/solve', {
        numDisks,
        numPegs
      });
      const solutionData = response.data.data;
      setSolution(solutionData);
      setShowSolution(true);
      
      // Reset to initial state
      const initialPositions = Array.from({ length: numDisks }, (_, i) => ({
        id: i,
        size: i + 1,
        peg: 0,
        color: getDiskColor(i)
      }));
      setDisksPositions(initialPositions);
      setCurrentMoveIndex(0);
    } catch (error) {
      console.error('Error getting solution:', error);
      alert('Error getting solution. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const playNextMove = () => {
    if (!solution?.sequence || currentMoveIndex >= solution.sequence.length || isAnimating) return;
    
    const move = solution.sequence[currentMoveIndex];
    const [fromPeg, toPeg] = move.split(' -> ');
    const fromIndex = pegLabels.indexOf(fromPeg);
    const toIndex = pegLabels.indexOf(toPeg);
    
    // Find top disk on fromPeg
    const disksOnPeg = disksPositions
      .filter(d => d.peg === fromIndex)
      .sort((a, b) => b.id - a.id);
    
    if (disksOnPeg.length > 0) {
      const diskToMove = disksOnPeg[0];
      animateMove(fromIndex, toIndex, diskToMove.id);
    }
    
    setCurrentMoveIndex(prev => prev + 1);
  };

  const playAllMoves = async () => {
    if (!solution?.sequence) return;
    
    for (let i = currentMoveIndex; i < solution.sequence.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      playNextMove();
    }
  };

  const parseSequence = (sequenceString) => {
    if (!sequenceString || typeof sequenceString !== 'string') {
      throw new Error('Invalid sequence format. Use format: A -> B, C -> D');
    }

    const moves = sequenceString
      .split(/[,\n]+/)
      .map(move => move.trim())
      .filter(move => move.length > 0);

    const moveRegex = /^[A-D]\s*->\s*[A-D]$/i;
    const validMoves = moves.every(move => moveRegex.test(move));

    if (!validMoves) {
      throw new Error('Invalid sequence format. Use format: A -> B, C -> D');
    }

    return moves.map(m => m.replace(/\s*[-]+>\s*/i, ' -> ').toUpperCase());
  };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);
      const sequence = parseSequence(userSequence);
      
      const response = await api.post('/games/hanoi/submit', {
        playerName: player?.name || 'Player',
        numDisks,
        numPegs,
        userMoves: parseInt(userMoves),
        userSequence: sequence
      });
      
      setResult(response.data.data);
      setShowResult(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
      if (error.response?.data?.message?.includes('Invalid sequence')) {
        setErrors({ userSequence: error.response.data.message });
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
    setCurrentMoveIndex(0);
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
        <div className="header-content">
          <div className="title-section">
            <h1>🗼 Tower of Hanoi</h1>
            <p className="game-description">
              Move all disks from peg A to {numPegs === 3 ? 'peg C' : 'peg D'} following the rules! 
              Larger disks cannot be placed on smaller ones.
            </p>
          </div>
          {onBack && (
            <button 
              onClick={onBack}
              className="btn-back"
            >
              ← Back to Menu
            </button>
          )}
        </div>
      </div>

      {!gameStarted ? (
        <div className="game-setup">
          <div className="setup-card">
            <h2>⚙️ Game Setup</h2>
            
            <div className="form-group">
              <label className="player-label">🎮 Player</label>
              <div className="player-display">{player?.name || 'Player'}</div>
            </div>

            <div className="form-group">
              <label>🔢 Number of Disks</label>
              <div className="disk-counter">
                <button 
                  className="counter-btn" 
                  onClick={() => setNumDisks(Math.max(3, numDisks - 1))}
                  disabled={numDisks <= 3}
                >
                  -
                </button>
                <span className="counter-value">{numDisks}</span>
                <button 
                  className="counter-btn" 
                  onClick={() => setNumDisks(Math.min(10, numDisks + 1))}
                  disabled={numDisks >= 10}
                >
                  +
                </button>
              </div>
              <p className="info-text">
                (Each additional disk doubles the minimum moves!)
              </p>
            </div>

            <div className="form-group">
              <label>🎯 Select Number of Pegs *</label>
              <div className="peg-selector">
                {[3, 4].map(pegCount => (
                  <div 
                    key={pegCount}
                    className={`peg-option ${numPegs === pegCount ? 'selected' : ''}`}
                    onClick={() => setNumPegs(pegCount)}
                  >
                    <div className="peg-visual">
                      {Array.from({ length: pegCount }).map((_, i) => (
                        <div key={i} className="mini-peg"></div>
                      ))}
                    </div>
                    <div className="peg-info">
                      <span className="peg-count">{pegCount} Pegs</span>
                      <span className="peg-desc">
                        {pegCount === 3 ? 'Classic Challenge' : 'Frame-Stewart Puzzle'}
                      </span>
                    </div>
                    {numPegs === pegCount && <div className="selection-indicator">✓</div>}
                  </div>
                ))}
              </div>
              {errors.numPegs && <span className="error-text">{errors.numPegs}</span>}
            </div>

            <div className="difficulty-indicator">
              <div className="difficulty-label">Difficulty:</div>
              <div className="difficulty-bars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i}
                    className={`difficulty-bar ${i < Math.min(5, Math.floor(numDisks / 2)) ? 'active' : ''}`}
                  ></div>
                ))}
              </div>
            </div>

            <button className="btn btn-primary start-game-btn" onClick={handleStartGame}>
              🎮 Start Game
            </button>
          </div>
        </div>
      ) : (
        <div className="game-play">
          <div className="game-info-bar">
            <div className="info-item">
              <span className="info-icon">👤</span>
              <strong>Player:</strong> {player?.name || 'Player'}
            </div>
            <div className="info-item">
              <span className="info-icon">📊</span>
              <strong>Disks:</strong> {numDisks}
            </div>
            <div className="info-item">
              <span className="info-icon">🎯</span>
              <strong>Pegs:</strong> {numPegs}
            </div>
            <div className="info-item">
              <span className="info-icon">⚡</span>
              <strong>Min Moves:</strong> {Math.pow(2, numDisks) - 1}
            </div>
          </div>

          <div className="game-board-section" ref={gameBoardRef}>
            <h3 className="board-title">Tower Visualization</h3>
            <div className="towers-container">
              {Array.from({ length: numPegs }).map((_, pegIndex) => (
                <div key={pegIndex} className={`peg-container peg-${pegIndex}`}>
                  <div className="peg-label">Peg {pegLabels[pegIndex]}</div>
                  <div className="peg">
                    <div className="peg-stand"></div>
                    <div className="peg-base"></div>
                  </div>
                  <div className="disks-stack">
                    {disksPositions
                      .filter(disk => disk.peg === pegIndex)
                      .sort((a, b) => b.size - a.size)
                      .map(disk => (
                        <div 
                          key={disk.id}
                          className={`disk disk-${disk.id}`}
                          style={{
                            width: `${Math.min(100, 30 + disk.size * 8)}%`,
                            maxWidth: '140px',
                            background: `linear-gradient(135deg, ${disk.color} 0%, ${disk.color}80 100%)`,
                            boxShadow: `0 4px 15px ${disk.color}40`
                          }}
                        >
                          <div className="disk-inner"></div>
                          <div className="disk-number">{disk.size}</div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="game-rules">
              <div className="rule-item">🚫 No larger disk on smaller disk</div>
              <div className="rule-item">📏 Move only one disk at a time</div>
              <div className="rule-item">🎯 Goal: Move all disks to last peg</div>
            </div>
          </div>

          <div className="answer-section">
            <h3>✏️ Enter Your Answer</h3>
            
            <div className="form-group">
              <label>🎲 Number of Moves Required *</label>
              <div className="input-with-icon">
                <span className="input-icon">↔️</span>
                <input
                  type="number"
                  value={userMoves}
                  onChange={(e) => setUserMoves(e.target.value)}
                  placeholder="Enter minimum number of moves"
                  min="1"
                  className={errors.userMoves ? 'error' : ''}
                />
              </div>
              {errors.userMoves && <span className="error-text">{errors.userMoves}</span>}
              <p className="help-text">
                Minimum moves for {numDisks} disks with {numPegs} pegs: {Math.pow(2, numDisks) - 1}
              </p>
            </div>

            <div className="form-group">
              <label>🔄 Move Sequence *</label>
              <div className="textarea-with-icon">
                <span className="textarea-icon">🔤</span>
                <textarea
                  value={userSequence}
                  onChange={(e) => setUserSequence(e.target.value)}
                  placeholder="Enter moves in format: A -> B, A -> C, B -> C, ..."
                  rows="5"
                  className={errors.userSequence ? 'error' : ''}
                />
              </div>
              {errors.userSequence && <span className="error-text">{errors.userSequence}</span>}
              <p className="help-text">
                Format: A → B (separate moves with commas or new lines)
              </p>
            </div>

            <div className="button-group">
              <button 
                className="btn btn-primary" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? '📤 Submitting...' : '✅ Submit Answer'}
              </button>
              
              <button 
                className="btn btn-secondary" 
                onClick={handleShowSolution}
                disabled={loading}
              >
                {loading ? '⏳ Loading...' : '🧠 Show Solution'}
              </button>
              
              <button 
                className="btn btn-outline" 
                onClick={handleNewGame}
              >
                🆕 New Game
              </button>
            </div>
          </div>

          {showSolution && solution && (
            <div className="solution-panel">
              <h3>🎯 Solution</h3>
              <div className="solution-controls">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={playNextMove}
                  disabled={currentMoveIndex >= solution.sequence.length || isAnimating}
                >
                  ▶️ Play Next Move
                </button>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={playAllMoves}
                  disabled={currentMoveIndex >= solution.sequence.length || isAnimating}
                >
                  ⏭️ Play All Moves
                </button>
                <div className="move-counter">
                  Move: {currentMoveIndex} / {solution.sequence.length}
                </div>
              </div>
              
              <div className="solution-content">
                <div className="solution-stats">
                  <div className="stat-item">
                    <strong>🎯 Minimum Moves:</strong> {solution.minMoves}
                  </div>
                  <div className="stat-item">
                    <strong>⚡ {solution.algorithm1?.name ?? 'Recursive'}:</strong>{' '}
                    {typeof solution.algorithm1?.time === 'number' ? `${solution.algorithm1.time.toFixed(4)} ms` : 'N/A'}
                  </div>
                  <div className="stat-item">
                    <strong>🚀 {solution.algorithm2?.name ?? 'Iterative'}:</strong>{' '}
                    {typeof solution.algorithm2?.time === 'number' ? `${solution.algorithm2.time.toFixed(4)} ms` : 'N/A'}
                  </div>
                  <div className="stat-item">
                    <strong>📈 Efficiency:</strong>{' '}
                    {solution.algorithm1?.time && solution.algorithm2?.time 
                      ? `${(solution.algorithm1.time / solution.algorithm2.time).toFixed(2)}x faster`
                      : 'N/A'}
                  </div>
                </div>
                
                <div className="solution-sequence">
                  <h4>🔄 Move Sequence:</h4>
                  <div className="sequence-list">
                    {Array.isArray(solution.sequence) ? (
                      solution.sequence.map((move, index) => (
                        <div 
                          key={index} 
                          className={`move-item ${index < currentMoveIndex ? 'completed' : ''}`}
                        >
                          <span className="move-number">{index + 1}.</span>
                          <span className="move-text">{move}</span>
                          {index < currentMoveIndex && (
                            <span className="move-status">✓</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="no-sequence">No sequence available</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="solution-footer">
                <button 
                  className="btn btn-outline" 
                  onClick={() => setShowSolution(false)}
                >
                  👁️ Hide Solution
                </button>
              </div>
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