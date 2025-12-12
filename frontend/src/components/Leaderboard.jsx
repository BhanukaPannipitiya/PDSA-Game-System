import { useEffect, useState } from "react";
import api from "../services/api";
import "./Leaderboard.css";

const Leaderboard = ({ gameType, onClose }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const gameNames = {
    queens: "Eight Queens Puzzle",
    snakeLadder: "Snake & Ladder",
    traffic: "Traffic Simulation",
    tsp: "Traveling Salesman Problem",
    hanoi: "Tower of Hanoi",
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get(`/leaderboard/${gameType}`);
        setLeaderboard(response.data.data.leaderboard || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };

    if (gameType) {
      fetchLeaderboard();
    }
  }, [gameType]);

  const getRankIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="leaderboard-overlay" onClick={onClose}>
      <div className="leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="leaderboard-header">
          <h2>🏆 {gameNames[gameType] || "Leaderboard"}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="leaderboard-loading">
            <span className="spinner">⟳</span>
            <p>Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="leaderboard-error">
            <p>{error}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="leaderboard-empty">
            <p>No players yet. Be the first to play!</p>
          </div>
        ) : (
          <div className="leaderboard-content">
            <div className="leaderboard-table">
              <div className="leaderboard-row header">
                <div className="rank-col">Rank</div>
                <div className="name-col">Player</div>
                <div className="score-col">Total Score</div>
                <div className="games-col">Games</div>
                <div className="best-col">Best Score</div>
              </div>
              {leaderboard.map((player, index) => (
                <div key={player.playerId} className="leaderboard-row">
                  <div className="rank-col">
                    <span className="rank-icon">{getRankIcon(index + 1)}</span>
                  </div>
                  <div className="name-col">{player.playerName}</div>
                  <div className="score-col">{player.totalScore}</div>
                  <div className="games-col">{player.gamesPlayed}</div>
                  <div className="best-col">{player.bestScore}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

