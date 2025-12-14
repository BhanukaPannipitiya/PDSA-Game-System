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
    setStatus({ type: "info", message: "Computing all solutions..." });
    setAnimate(true);

    try {
      const res = await api.post("/games/queens/compute");
      setAlgorithmTimes({
        sequentialTimeMs: res.data.data?.sequentialTimeMs,
        threadedTimeMs: res.data.data?.threadedTimeMs,
      });
      setStatus({ type: "success", message: "Solutions computed successfully!" });
      fetchStats();
    } catch {
      setStatus({ type: "error", message: "Computation failed" });
    } finally {
      setLoading(false);
      setTimeout(() => setAnimate(false), 1500);
    }
  };

  const handleSubmit = async () => {
    if (!parsedSolution) {
      setStatus({ type: "error", message: "Complete all 8 rows first" });
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
        message: res.data.data?.message,
      });

      fetchStats();
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1200);
    } catch (e) {
      setStatus({ type: "error", message: e.response?.data?.message });
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
          <div className="stat-label">Sequential</div>
          <div className="stat-value">
            {stats?.sequentialTimeMs ? `${stats.sequentialTimeMs.toFixed(0)}ms` : "—"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Threaded</div>
          <div className="stat-value">
            {stats?.threadedTimeMs ? `${stats.threadedTimeMs.toFixed(0)}ms` : "—"}
          </div>
        </div>
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

      {status && <div className={`status-message status-${status.type}`}>{status.message}</div>}

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
