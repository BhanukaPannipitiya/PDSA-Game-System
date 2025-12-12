import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Leaderboard from "../components/Leaderboard";
import "./QueensPage.css";

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

  const parsedSolution = useMemo(() => {
    const parts = solutionInput
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p !== "")
      .map((p) => {
        const num = Number(p);
        return num >= 0 && num <= 7 ? num : -1;
      });
    return parts.length === 8 && parts.every(n => n !== -1) ? parts : null;
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
    fetchStats();
  }, []);

  useEffect(() => {
    if (parsedSolution) {
      setBoardPreview(parsedSolution);
    } else {
      setBoardPreview(Array(8).fill(-1));
    }
  }, [parsedSolution]);

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
        const isSelected = selectedSolution && selectedSolution[r] === c;
        
        row.push(
          <div 
            key={c} 
            className={`cell ${(r + c) % 2 === 0 ? "light" : "dark"} ${hasQueen ? "has-queen" : ""}`}
            onClick={() => {
              // Allow manual placement in preview mode
              if (!parsedSolution) {
                const newSolution = [...solution];
                newSolution[r] = newSolution[r] === c ? -1 : c;
                setSolutionInput(newSolution.filter(n => n !== -1).join(","));
              }
            }}
          >
            {hasQueen ? (
              <div className={`queen ${showAnimation ? "animate" : ""}`}>
                ♛
              </div>
            ) : ""}
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

  const renderSolutionItem = (solution, index) => (
    <div 
      key={index}
      className="solution-item"
      onClick={() => {
        setSelectedSolution(solution);
        setSolutionInput(solution.join(","));
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
    </div>
  );

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