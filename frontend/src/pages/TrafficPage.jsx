import { useEffect, useState } from "react";
import api from "../services/api";
import Leaderboard from "../components/Leaderboard";
import WinLoseModal from "../components/WinLoseModal";
import "./TrafficPage.css";

const TrafficPage = ({ player, onBack }) => {
  const [network, setNetwork] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [algoTimes, setAlgoTimes] = useState({});
  const [loading, setLoading] = useState(false);
  const [gameStatus, setGameStatus] = useState(null); // 'playing', 'submitted', 'won', 'lost'
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalResult, setModalResult] = useState(null);
  const [error, setError] = useState("");

  // Node positions for graph visualization
  const nodePositions = {
    A: { x: 100, y: 200 },
    B: { x: 250, y: 100 },
    C: { x: 250, y: 200 },
    D: { x: 250, y: 300 },
    E: { x: 400, y: 100 },
    F: { x: 400, y: 250 },
    G: { x: 550, y: 100 },
    H: { x: 550, y: 250 },
    T: { x: 700, y: 175 },
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = async () => {
    setLoading(true);
    setError("");
    setGameStatus("playing");
    setSelectedAnswer(null);
    setShowModal(false);
    setModalResult(null);

    try {
      const response = await api.post("/games/traffic/start");
      const data = response.data.data;

      setNetwork(data.network);
      setOptions(data.options);
      setCorrectAnswer(data.correctAnswer);
      setAlgoTimes(data.algoTimes);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start game. Please try again.");
      console.error("Error starting game:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    if (gameStatus === "playing") {
      setSelectedAnswer(answer);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) {
      setError("Please select an answer");
      return;
    }

    if (!player) {
      setError("Please login first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/games/traffic/answer", {
        playerId: player.id,
        playerName: player.name,
        selectedAnswer: selectedAnswer,
        correctAnswer: correctAnswer,
        algoTimes: algoTimes,
      });

      const result = response.data.data;
      setGameStatus(result.isCorrect ? "won" : "lost");
      setModalResult(result);
      setShowModal(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit answer. Please try again.");
      console.error("Error submitting answer:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalResult(null);
  };

  const renderGraph = () => {
    if (!network || !network.edges) return null;

    const edges = network.edges;
    const nodes = network.nodes || [];

    return (
      <div className="traffic-graph-container">
        <svg
          width="100%"
          height="400"
          viewBox="0 0 800 400"
          preserveAspectRatio="xMidYMid meet"
          className="traffic-graph-svg"
        >
          {/* Render edges */}
          {edges.map((edge, index) => {
            const fromPos = nodePositions[edge.from];
            const toPos = nodePositions[edge.to];
            if (!fromPos || !toPos) return null;

            // Calculate control points for curved edges
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const midX = fromPos.x + dx / 2;
            const midY = fromPos.y + dy / 2;
            const curvature = 30;
            const cp1x = midX + (dy / Math.sqrt(dx * dx + dy * dy)) * curvature;
            const cp1y = midY - (dx / Math.sqrt(dx * dx + dy * dy)) * curvature;

            return (
              <g key={`edge-${index}`}>
                <path
                  d={`M ${fromPos.x} ${fromPos.y} Q ${cp1x} ${cp1y} ${toPos.x} ${toPos.y}`}
                  stroke="#00D4AA"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.6"
                  markerEnd="url(#arrowhead)"
                />
                <text
                  x={midX}
                  y={midY - 10}
                  fill="#F9CB28"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="edge-capacity-label"
                >
                  {edge.capacity}
                </text>
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#00D4AA" />
            </marker>
          </defs>

          {/* Render nodes */}
          {nodes.map((node) => {
            const pos = nodePositions[node];
            if (!pos) return null;

            const isSource = node === "A";
            const isSink = node === "T";

            return (
              <g key={`node-${node}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSource || isSink ? 25 : 20}
                  fill={isSource ? "#00D4AA" : isSink ? "#FF6B8B" : "#4A90E2"}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  className="traffic-node"
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  fill="#FFFFFF"
                  fontSize="16"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {node}
                </text>
                {(isSource || isSink) && (
                  <text
                    x={pos.x}
                    y={pos.y + 35}
                    fill="#F9CB28"
                    fontSize="12"
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {isSource ? "SOURCE" : "SINK"}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="traffic-page">
      <div className="traffic-header">
        <div className="header-content">
          <h1 className="traffic-title">🚦 Traffic Simulation Problem</h1>
          <p className="traffic-subtitle">
            Find the maximum flow from source (A) to sink (T)
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn-leaderboard"
            onClick={() => setShowLeaderboard(true)}
          >
            📊 Leaderboard
          </button>
          <button className="btn-back" onClick={onBack}>
            ← Back to Menu
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && !network ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Generating traffic network...</p>
        </div>
      ) : (
        <div className="traffic-game-container">
          <div className="traffic-graph-section">
            <h2 className="section-title">Traffic Network</h2>
            <p className="section-description">
              Each edge shows its capacity (vehicles per minute). Find the maximum flow from A to T.
            </p>
            {renderGraph()}
          </div>

          <div className="traffic-quiz-section">
            <h2 className="section-title">Select Maximum Flow</h2>
            <div className="options-grid">
              {options.map((option, index) => (
                <button
                  key={index}
                  className={`option-button ${
                    selectedAnswer === option ? "selected" : ""
                  } ${gameStatus !== "playing" ? "disabled" : ""}`}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={gameStatus !== "playing"}
                >
                  {option} vehicles/min
                </button>
              ))}
            </div>

            {selectedAnswer && gameStatus === "playing" && (
              <button
                className="submit-button"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Answer"}
              </button>
            )}

            {gameStatus === "won" || gameStatus === "lost" ? (
              <div className="result-info">
                <p className="correct-answer-info">
                  Correct Answer: <strong>{correctAnswer} vehicles/min</strong>
                </p>
                <div className="algorithm-times">
                  <h3>Algorithm Performance:</h3>
                  <div className="time-item">
                    <span>Edmonds-Karp:</span>
                    <span>{algoTimes.edmondsKarp?.toFixed(4) || "N/A"} ms</span>
                  </div>
                  <div className="time-item">
                    <span>Ford-Fulkerson:</span>
                    <span>{algoTimes.fordFulkerson?.toFixed(4) || "N/A"} ms</span>
                  </div>
                </div>
                <button className="new-game-button" onClick={startNewGame}>
                  🎮 New Game
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {showLeaderboard && (
        <Leaderboard
          gameType="traffic"
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {showModal && modalResult && (
        <WinLoseModal
          isWin={modalResult.isCorrect}
          onClose={handleModalClose}
          message={
            modalResult.isCorrect
              ? `Congratulations! You found the correct maximum flow of ${correctAnswer} vehicles/min!`
              : `Incorrect. The correct maximum flow is ${correctAnswer} vehicles/min.`
          }
        />
      )}
    </div>
  );
};

export default TrafficPage;

