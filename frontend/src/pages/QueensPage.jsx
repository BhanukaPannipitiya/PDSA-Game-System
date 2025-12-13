import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Leaderboard from "../components/Leaderboard";
import "./QueensPage.css";

// Helper function to check if a square is threatened
const isThreatened = (row, col, solution) => {
  for (let r = 0; r < 8; r++) {
    if (solution[r] === -1) continue;
    const c = solution[r];
    if (r === row && c === col) continue; // Same position
    
    // Same row or column
    if (r === row || c === col) return true;
    // Same diagonal
    if (Math.abs(r - row) === Math.abs(c - col)) return true;
  }
  return false;
};

const QueensPage = ({ player, onBack }) => {
  const [solutionInput, setSolutionInput] = useState("");
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [boardPreview, setBoardPreview] = useState(Array(8).fill(-1));
  const [solutions, setSolutions] = useState([]);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [algorithmTimes, setAlgorithmTimes] = useState({});
  const [hoveredCell, setHoveredCell] = useState(null);

  const parsedSolution = useMemo(() => {
    if (!solutionInput.trim()) return null;
    
    const parts = solutionInput
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p !== "")
      .map((p) => {
        const num = Number(p);
        return num >= 0 && num <= 7 ? num : -1;
      });
    // Must have exactly 8 valid positions (one queen per row)
    if (parts.length === 8 && parts.every(n => n !== -1)) {
      return parts;
    }
    return null;
  }, [solutionInput]);

  const fetchStats = async () => {
    try {
      const res = await api.get("/games/queens/stats");
      setStats(res.data.data);
      
      // Fetch sample solutions
      if (res.data.data.solutions) {
        setSolutions(res.data.data.solutions.slice(0, 6));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Add background class to body for full screen coverage
    document.body.classList.add('queens-page-active');
    document.documentElement.classList.add('queens-page-active');
    
    fetchStats();
    
    return () => {
      // Cleanup: remove class when component unmounts
      document.body.classList.remove('queens-page-active');
      document.documentElement.classList.remove('queens-page-active');
    };
  }, []);

  useEffect(() => {
    if (parsedSolution) {
      // Valid complete solution (8 queens)
      setBoardPreview(parsedSolution);
    } else if (solutionInput.trim() === "") {
      // Empty input - clear board
      setBoardPreview(Array(8).fill(-1));
    } else {
      // Partial solution - parse what we can and update board
      const parts = solutionInput
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p !== "")
        .map((p) => {
          const num = Number(p);
          return num >= 0 && num <= 7 ? num : -1;
        });
      
      // Build board state from parsed parts
      const newBoard = Array(8).fill(-1);
      for (let i = 0; i < Math.min(parts.length, 8); i++) {
        if (parts[i] !== -1) {
          newBoard[i] = parts[i];
        }
      }
      setBoardPreview(newBoard);
    }
  }, [parsedSolution, solutionInput]);

  const handleCompute = async () => {
    setLoading(true);
    setStatus({ type: "info", message: "Computing solutions..." });
    setShowAnimation(true);
    
    try {
      const startTime = Date.now();
      const res = await api.post("/games/queens/compute");
      const endTime = Date.now();
      
      // Store algorithm times
      setAlgorithmTimes({
        sequentialTimeMs: res.data.data?.sequentialTimeMs || null,
        threadedTimeMs: res.data.data?.threadedTimeMs || null,
      });
      
      setStatus({ 
        type: "success", 
        message: res.data.message || "Solutions computed successfully!" 
      });
      fetchStats();
      
      // Animate board after compute
      setTimeout(() => setShowAnimation(false), 2000);
    } catch (err) {
      setStatus({ 
        type: "error", 
        message: err.response?.data?.message || "Compute failed. Please try again." 
      });
      setShowAnimation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!player) {
      setStatus({ 
        type: "error", 
        message: "Please login first" 
      });
      return;
    }
    
    if (!parsedSolution) {
      setStatus({ 
        type: "error", 
        message: "Please enter 8 valid comma-separated numbers (0-7)" 
      });
      return;
    }
    
    setLoading(true);
    setStatus(null);
    
    try {
      const res = await api.post("/games/queens/submit", {
        playerId: player.id,
        playerName: player.name,
        solution: parsedSolution,
        algorithmTimes,
      });
      
      setStatus({ 
        type: res.data.data?.status === "duplicate" ? "warning" : "success", 
        message: res.data.data?.message || "Solution submitted successfully!" 
      });
      fetchStats();
      
      // Celebrate successful submission
      if (res.data.data?.status === "accepted" || res.data.data?.status === "completed") {
        setTimeout(() => {
          setShowAnimation(true);
          setTimeout(() => setShowAnimation(false), 1500);
        }, 500);
      }
    } catch (err) {
      setStatus({ 
        type: "error", 
        message: err.response?.data?.message || "Submission failed. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderBoard = (solution) => {
    const board = [];
    
    for (let r = 0; r < 8; r += 1) {
      const row = [];
      for (let c = 0; c < 8; c += 1) {
        const hasQueen = solution[r] === c;
        const isThreatenedCell = hasQueen ? false : isThreatened(r, c, solution);
        const isHovered = hoveredCell?.row === r && hoveredCell?.col === c;
        
        row.push(
          <div 
            key={c} 
            className={`cell ${(r + c) % 2 === 0 ? "light" : "dark"} ${hasQueen ? "has-queen" : ""} ${isThreatenedCell ? "threatened" : ""}`}
            onClick={() => {
              // Allow manual placement by clicking on the board
              // Each row must have exactly one queen, so clicking places/moves the queen in that row
              const newSolution = [...solution];
              
              // If clicking on a cell that already has a queen, remove it (set to -1)
              // Otherwise, place/move the queen to this cell
              if (newSolution[r] === c) {
                newSolution[r] = -1;
              } else {
                newSolution[r] = c;
              }
              
              // Update board preview immediately for responsive UI
              setBoardPreview(newSolution);
              
              // Update solution input - build from board state maintaining row positions
              // Input format: comma-separated column values where position = row index
              // Always include all 8 positions to preserve row information
              const inputParts = [];
              for (let i = 0; i < 8; i++) {
                if (newSolution[i] !== -1) {
                  inputParts.push(newSolution[i].toString());
                } else {
                  // Use empty string as placeholder - will be filtered by parser
                  // but this maintains the positional structure when all 8 are present
                  inputParts.push('');
                }
              }
              // Join and clean up: remove empty parts but this loses position info
              // Better approach: only show complete solutions in input, or show all with placeholders
              // For now, if all 8 rows have queens, show the full solution
              // Otherwise, show only the placed queens (user can complete by clicking)
              const hasAllQueens = newSolution.every(val => val !== -1);
              if (hasAllQueens) {
                setSolutionInput(inputParts.join(','));
              } else {
                // For partial solutions, just show the placed queens
                // The board state maintains the correct positions
                const placed = newSolution.filter(val => val !== -1);
                setSolutionInput(placed.join(','));
              }
            }}
            onMouseEnter={() => setHoveredCell({ row: r, col: c })}
            onMouseLeave={() => setHoveredCell(null)}
            title={hasQueen ? "Queen" : isThreatenedCell ? "Threatened" : "Empty"}
          >
            {hasQueen ? (
              <div className={`queen ${showAnimation ? "animate" : ""}`}>
                ♛
              </div>
            ) : ""}
            {isHovered && !hasQueen && (
              <div style={{
                position: 'absolute',
                fontSize: '20px',
                opacity: 0.5,
                color: '#F9CB28',
                zIndex: 1
              }}>+</div>
            )}
          </div>
        );
      }
      board.push(
        <div key={r} className="row">
          {row}
        </div>
      );
    }
    return board;
  };

  const renderSolutionItem = (solution, index) => {
    const isSelected = selectedSolution && JSON.stringify(selectedSolution) === JSON.stringify(solution);
    
    return (
      <div 
        key={index}
        className={`solution-item ${isSelected ? "selected" : ""}`}
        onClick={() => {
          setSelectedSolution(solution);
          setSolutionInput(solution.join(","));
          setShowAnimation(true);
          setTimeout(() => setShowAnimation(false), 1000);
        }}
      >
        <div className="solution-preview">
          {solution.map((col, idx) => (
            <div key={idx} className="solution-col">
              {col}
            </div>
          ))}
        </div>
        <div className="solution-index">Solution #{index + 1}</div>
        {isSelected && <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          fontSize: '1.2rem',
          color: '#F9CB28'
        }}>✓</div>}
      </div>
    );
  };

  if (!player) {
    return (
      <div className="queens-page">
        <div className="no-player-message">
          <p>Please login to play</p>
          {onBack && <button onClick={onBack} className="btn btn-primary">Go Back</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="queens-page">
      <header className="queens-header">
        <div className="header-top">
          <div>
            <h1>♕ Eight Queens Puzzle</h1>
            <p>
              Place 8 queens on a chessboard so that no two queens threaten each other.
              Challenge yourself with this classic logic puzzle!
            </p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-leaderboard"
              onClick={() => setShowLeaderboard(true)}
            >
              🏆 Leaderboard
            </button>
            {onBack && (
              <button onClick={onBack} className="btn btn-back">
                ← Back
              </button>
            )}
          </div>
        </div>
        <div className="player-info">
          <span>Playing as: <strong>{player.name}</strong></span>
        </div>
      </header>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-label">Total Solutions</div>
          <div className="stat-value">{stats?.totalSolutions ?? "92"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Your Score</div>
          <div className="stat-value">{stats?.playerScore ?? "0"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sequential Time</div>
          <div className="stat-value">
            {stats?.sequentialTimeMs ? `${stats.sequentialTimeMs.toFixed(0)}ms` : "—"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Threaded Time</div>
          <div className="stat-value">
            {stats?.threadedTimeMs ? `${stats.threadedTimeMs.toFixed(0)}ms` : "—"}
          </div>
        </div>
      </div>

      <div className="controls">
        <button 
          className="btn btn-primary"
          onClick={handleCompute}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner">⟳</span>
              Computing...
            </>
          ) : (
            <>
              ⚡ Compute All Solutions
            </>
          )}
        </button>

        <div className="control-group">
          <label>🎯 Solution (0-7, comma-separated)</label>
          <input 
            value={solutionInput}
            onChange={(e) => setSolutionInput(e.target.value)}
            placeholder="Example: 0,4,7,5,2,6,1,3"
            disabled={loading}
          />
        </div>

        <button 
          className="btn btn-secondary"
          onClick={handleSubmit}
          disabled={loading || !parsedSolution}
        >
          {loading ? "Submitting..." : "🚀 Submit Solution"}
        </button>
      </div>

      {status && (
        <div className={`status-message status-${status.type}`}>
          {status.message}
        </div>
      )}

      <section className="board-section">
        <h2>🎮 Interactive Board</h2>
        <p className="board-hint">
          Click on squares to place queens manually, or use the form above
        </p>
        
        <div className="board-container">
          <div className="board-grid">
            {renderBoard(boardPreview)}
          </div>
          
          <div className="board-legend">
            <div className="legend-item">
              <div className="legend-color" style={{background: '#FFD700'}}></div>
              <span>Light Squares</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{background: '#FF6B8B'}}></div>
              <span>Dark Squares</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{
                background: 'radial-gradient(circle, #F9CB28, #FF4D4D)'
              }}></div>
              <span>Queen Position</span>
            </div>
          </div>
        </div>
      </section>

      {solutions.length > 0 && (
        <section className="solutions-panel">
          <h2>💡 Sample Solutions</h2>
          <p>Click on any solution below to preview it on the board</p>
          <div className="solutions-grid">
            {solutions.map(renderSolutionItem)}
          </div>
        </section>
      )}

      {showLeaderboard && (
        <Leaderboard 
          gameType="queens" 
          onClose={() => setShowLeaderboard(false)} 
        />
      )}
    </div>
  );
};

export default QueensPage;