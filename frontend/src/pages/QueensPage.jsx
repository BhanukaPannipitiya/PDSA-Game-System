import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Leaderboard from "../components/Leaderboard";
import "./QueensPage.css";

const EMPTY_BOARD = Array(8).fill(-1);

/* -------------------- Helpers -------------------- */

const isThreatened = (row, col, board) => {
  for (let r = 0; r < 8; r++) {
    const c = board[r];
    if (c === -1) continue;
    if (r === row && c === col) continue;
    if (r === row || c === col) return true;
    if (Math.abs(r - row) === Math.abs(c - col)) return true;
  }
  return false;
};

// Validate if a complete solution is valid (no conflicts)
const validateSolution = (positions) => {
  if (!Array.isArray(positions) || positions.length !== 8) {
    return { valid: false, reason: "Solution must have exactly 8 positions" };
  }

  // Check for invalid column values
  for (let i = 0; i < positions.length; i++) {
    const col = positions[i];
    if (!Number.isInteger(col) || col < 0 || col >= 8) {
      return { valid: false, reason: `Invalid column value at row ${i}: must be between 0 and 7` };
    }
  }

  // Check for duplicate columns (same column used twice)
  const columns = new Set();
  for (let i = 0; i < positions.length; i++) {
    const col = positions[i];
    if (columns.has(col)) {
      return { valid: false, reason: `Duplicate column ${col} found. Each queen must be in a different column.` };
    }
    columns.add(col);
  }

  // Check for diagonal conflicts
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const rowDiff = Math.abs(i - j);
      const colDiff = Math.abs(positions[i] - positions[j]);
      if (rowDiff === colDiff) {
        return {
          valid: false,
          reason: `Queens at rows ${i} and ${j} are on the same diagonal. They attack each other!`,
        };
      }
    }
  }

  return { valid: true };
};

const boardToInput = (board) =>
  board.map(v => (v === -1 ? "" : v)).join(",");

const inputToBoard = (input) => {
  const parts = input.split(",");
  const board = [...EMPTY_BOARD];

  for (let i = 0; i < Math.min(parts.length, 8); i++) {
    const n = Number(parts[i]);
    board[i] = Number.isInteger(n) && n >= 0 && n <= 7 ? n : -1;
  }
  return board;
};

/* -------------------- Component -------------------- */

const QueensPage = ({ player, onBack }) => {
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [input, setInput] = useState("");
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [solutions, setSolutions] = useState([]);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [animate, setAnimate] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [algorithmTimes, setAlgorithmTimes] = useState({});

  /* ---------- Derived ---------- */

  const parsedSolution = useMemo(() => {
    return board.every(v => v !== -1) ? board : null;
  }, [board]);

  /* ---------- Effects ---------- */

  useEffect(() => {
    document.body.classList.add("queens-page-active");
    document.documentElement.classList.add("queens-page-active");

    fetchStats();

    return () => {
      document.body.classList.remove("queens-page-active");
      document.documentElement.classList.remove("queens-page-active");
    };
  }, []);

  useEffect(() => {
    setInput(boardToInput(board));
  }, [board]);

  /* ---------- API ---------- */

  const fetchStats = async () => {
    try {
      const res = await api.get("/games/queens/stats");
      setStats(res.data.data);
      setSolutions(res.data.data.solutions?.slice(0, 6) || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompute = async () => {
    setLoading(true);
    setStatus({ type: "info", message: "Computing all solutions with Sequential and Threaded algorithms..." });
    setAnimate(true);

    try {
      const res = await api.post("/games/queens/compute");
      const data = res.data.data;
      setAlgorithmTimes({
        sequentialTimeMs: data?.sequentialTimeMs,
        threadedTimeMs: data?.threadedTimeMs,
      });
      
      // Display comparison if available
      if (data?.comparison) {
        const comparison = data.comparison;
        const message = `Solutions computed! Found ${data.totalSolutions} solutions. ` +
          `${comparison.fasterAlgorithm} was faster by ${comparison.timeDifference}ms ` +
          `(${comparison.fasterAlgorithm === "Threaded" ? `${comparison.speedup}x` : `1/${comparison.speedup}`} speedup).`;
        setStatus({ type: "success", message });
      } else {
        setStatus({ type: "success", message: "Solutions computed successfully!" });
      }
      fetchStats();
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.response?.data?.error || e.message || "Computation failed";
      setStatus({ type: "error", message: errorMessage });
    } finally {
      setLoading(false);
      setTimeout(() => setAnimate(false), 1500);
    }
  };

  const handleSubmit = async () => {
    // Clear any previous status
    setStatus(null);

    // Check if solution is complete
    if (!parsedSolution) {
      setStatus({
        type: "error",
        message: "⚠️ Please complete all 8 rows before submitting. Place a queen in each row.",
      });
      return;
    }

    // Check player information
    if (!player?.id || !player?.name) {
      setStatus({
        type: "error",
        message: "⚠️ Player information is missing. Please login again.",
      });
      return;
    }

    // Ensure solution is an array of integers
    if (!Array.isArray(parsedSolution) || parsedSolution.length !== 8) {
      setStatus({
        type: "error",
        message: "❌ Invalid solution format. Solution must be an array of 8 integers.",
      });
      return;
    }

    // Convert to numbers and validate format
    const validSolution = parsedSolution.map(v => Number(v));
    if (validSolution.some(v => !Number.isInteger(v) || v < 0 || v >= 8)) {
      setStatus({
        type: "error",
        message: "❌ Invalid values detected. Each position must be an integer between 0 and 7.",
      });
      return;
    }

    // Client-side validation before submitting
    const validation = validateSolution(validSolution);
    if (!validation.valid) {
      setStatus({
        type: "error",
        message: `❌ Invalid Solution: ${validation.reason}`,
      });
      // Add a visual shake animation
      setAnimate(true);
      setTimeout(() => setAnimate(false), 600);
      return;
    }

    setLoading(true);

    try {
      // Transform algorithmTimes to match backend expectations
      const transformedAlgorithmTimes = {};
      if (algorithmTimes?.sequentialTimeMs != null) {
        transformedAlgorithmTimes.sequential = Number(algorithmTimes.sequentialTimeMs);
      }
      if (algorithmTimes?.threadedTimeMs != null) {
        transformedAlgorithmTimes.threaded = Number(algorithmTimes.threadedTimeMs);
      }

      const payload = {
        playerId: Number(player.id) || player.id,
        playerName: String(player.name).trim(),
        solution: validSolution,
      };

      // Only include algorithmTimes if it has values
      if (Object.keys(transformedAlgorithmTimes).length > 0) {
        payload.algorithmTimes = transformedAlgorithmTimes;
      }

      const res = await api.post("/games/queens/submit", payload);
      const result = res.data.data;

      // Handle different response statuses
      if (result?.status === "duplicate") {
        setStatus({
          type: "warning",
          message: `⚠️ ${result.message || "This solution was already recognized by another player. Try another one."}`,
        });
      } else if (result?.status === "completed") {
        setStatus({
          type: "success",
          message: `🎉 ${result.message || "Congratulations! All solutions found!"}`,
        });
        setAnimate(true);
        setTimeout(() => setAnimate(false), 2000);
      } else if (result?.status === "accepted") {
        const remaining = result.remaining ?? 0;
        setStatus({
          type: "success",
          message: `✅ ${result.message || "Correct!"} ${remaining} solution${remaining !== 1 ? 's' : ''} remaining.`,
        });
        setAnimate(true);
        setTimeout(() => setAnimate(false), 1200);
      } else {
        setStatus({
          type: "success",
          message: `✅ ${result?.message || "Solution submitted successfully!"}`,
        });
      }

      fetchStats();
    } catch (e) {
      console.error("Submit error:", e);
      
      // Extract error message from response
      let errorMessage = "Submission failed. Please try again.";
      let errorType = "error";

      if (e.response) {
        // Server responded with error
        const responseData = e.response.data;
        errorMessage = responseData?.message || responseData?.error || errorMessage;
        
        // Check if it's an incorrect solution error
        if (
          errorMessage.toLowerCase().includes("incorrect") ||
          errorMessage.toLowerCase().includes("not a valid") ||
          errorMessage.toLowerCase().includes("invalid solution")
        ) {
          errorType = "error";
          errorMessage = `❌ Incorrect Solution: ${errorMessage.replace(/incorrect|not a valid|invalid solution/gi, "").trim() || "This is not a valid eight queens solution. Queens are attacking each other!"}`;
        } else if (errorMessage.toLowerCase().includes("duplicate")) {
          errorType = "warning";
          errorMessage = `⚠️ ${errorMessage}`;
        } else if (e.response.status === 400) {
          // Bad request - validation error
          errorMessage = `❌ ${errorMessage}`;
        } else if (e.response.status === 500) {
          // Server error
          errorMessage = `🔧 Server error: ${errorMessage}. Please try again later.`;
        }
      } else if (e.request) {
        // Request was made but no response received
        errorMessage = "❌ Network error: Could not reach the server. Please check your connection.";
      } else {
        // Something else happened
        errorMessage = `❌ Error: ${e.message || "An unexpected error occurred"}`;
      }

      setStatus({ type: errorType, message: errorMessage });
      
      // Add visual feedback for errors
      setAnimate(true);
      setTimeout(() => setAnimate(false), 600);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Board Interaction ---------- */

  const toggleQueen = (row, col) => {
    setBoard(prev => {
      const next = [...prev];
      next[row] = next[row] === col ? -1 : col;
      return next;
    });
  };

  /* ---------- Render ---------- */

  const renderBoard = () =>
    board.map((_, r) => (
      <div key={r} className="row">
        {Array.from({ length: 8 }).map((_, c) => {
          const hasQueen = board[r] === c;
          return (
            <div
              key={c}
              className={`cell ${(r + c) % 2 === 0 ? "light" : "dark"} 
                ${hasQueen ? "has-queen" : ""} 
                ${!hasQueen && isThreatened(r, c, board) ? "threatened" : ""}`}
              onClick={() => toggleQueen(r, c)}
              onMouseEnter={() => setHovered({ r, c })}
              onMouseLeave={() => setHovered(null)}
            >
              {hasQueen && (
                <div className={`queen ${animate ? "animate" : ""}`}>♛</div>
              )}
              {!hasQueen && hovered?.r === r && hovered?.c === c && (
                <span style={{ opacity: 0.5, fontSize: 20 }}>+</span>
              )}
            </div>
          );
        })}
      </div>
    ));

  /* ---------- Guards ---------- */

  if (!player) {
    return (
      <div className="queens-page no-player-message">
        <p>Please login to play</p>
        {onBack && <button className="btn btn-primary" onClick={onBack}>Go Back</button>}
      </div>
    );
  }

  /* ---------- JSX ---------- */

  return (
    <div className="queens-page">
      {/* Header */}
      <header className="queens-header">
        <div className="header-top">
          <div>
            <h1>♕ Eight Queens Puzzle</h1>
            <p>Place 8 queens so that none attack each other.</p>
          </div>
          <div className="header-actions">
            {onBack && (
              <button className="btn btn-back" onClick={onBack}>
                ← Back
              </button>
            )}
            <button 
              className="btn btn-leaderboard" 
              onClick={() => setShowLeaderboard(true)}
            >
              🏆 Leaderboard
            </button>
          </div>
        </div>
        <div className="player-info">Playing as <strong>{player.name}</strong></div>
      </header>

      {/* Stats */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-label">Total Solutions</div>
          <div className="stat-value">{stats?.totalSolutions ?? "92"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Recognized</div>
          <div className="stat-value">{stats?.recognizedCount ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Remaining</div>
          <div className="stat-value">{stats?.remainingSolutions ?? stats?.totalSolutions ?? "92"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sequential Time</div>
          <div className="stat-value">
            {stats?.sequentialTimeMs != null ? `${Number(stats.sequentialTimeMs).toFixed(2)}ms` : "—"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Threaded Time</div>
          <div className="stat-value">
            {stats?.threadedTimeMs != null ? `${Number(stats.threadedTimeMs).toFixed(2)}ms` : "—"}
          </div>
        </div>
        {stats?.comparison && (
          <div className="stat-card comparison-card">
            <div className="stat-label">Faster Algorithm</div>
            <div className="stat-value">{stats.comparison.fasterAlgorithm}</div>
            <div className="stat-subtext">
              {stats.comparison.fasterAlgorithm === "Threaded" 
                ? `${stats.comparison.speedup}x faster`
                : `1/${stats.comparison.speedup} speedup`}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="controls">
        <button className="btn btn-primary" onClick={handleCompute} disabled={loading}>
          {loading ? "⏳ Computing..." : "⚡ Compute Solutions"}
        </button>

        <div className="control-group">
          <label>Solution Input</label>
          <input 
            value={input} 
            onChange={e => setBoard(inputToBoard(e.target.value))}
            placeholder="e.g., 0,4,7,5,2,6,1,3"
          />
        </div>

        <button
          className="btn btn-secondary"
          disabled={!parsedSolution || loading}
          onClick={handleSubmit}
        >
          🚀 Submit Solution
        </button>
      </div>

      {status && (
        <div 
          className={`status-message status-${status.type}`}
          role="alert"
          aria-live="polite"
        >
          {status.message}
        </div>
      )}

      {/* Board */}
      <section className="board-section">
        <h2>Interactive Board</h2>
        <p className="board-hint">Click on cells to place or remove queens</p>
        <div className="board-grid">{renderBoard()}</div>
      </section>

      {/* Sample Solutions */}
      {solutions.length > 0 && (
        <section className="solutions-panel">
          <h2>Sample Solutions</h2>
          <div className="solutions-grid">
            {solutions.map((s, i) => (
              <div
                key={i}
                className={`solution-item ${selectedSolution === i ? "selected" : ""}`}
                onClick={() => {
                  setBoard(s);
                  setSelectedSolution(i);
                  setAnimate(true);
                  setTimeout(() => setAnimate(false), 1000);
                }}
              >
                {s.join(",")}
              </div>
            ))}
          </div>
        </section>
      )}

      {showLeaderboard && <Leaderboard gameType="queens" onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
};

export default QueensPage;
