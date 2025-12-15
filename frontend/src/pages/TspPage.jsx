import { useEffect, useState } from "react";
import api from "../services/api";
import Leaderboard from "../components/Leaderboard";
import WinLoseModal from "../components/WinLoseModal";
import "./TspPage.css";

const TspPage = ({ player, onBack }) => {
  const [cities, setCities] = useState([]);
  const [distanceMatrix, setDistanceMatrix] = useState({});
  const [homeCity, setHomeCity] = useState(null);
  const [selectedCities, setSelectedCities] = useState([]);
  const [tspResults, setTspResults] = useState(null);
  const [userRoute, setUserRoute] = useState([]);
  const [userDistance, setUserDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [solving, setSolving] = useState(false);
  const [gameStatus, setGameStatus] = useState("selecting"); // 'selecting', 'solved', 'submitted', 'won', 'lost'
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalResult, setModalResult] = useState(null);
  const [error, setError] = useState("");
  const [complexityAnalysis, setComplexityAnalysis] = useState(null);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = async () => {
    setLoading(true);
    setError("");
    setGameStatus("selecting");
    setSelectedCities([]);
    setTspResults(null);
    setUserRoute([]);
    setUserDistance(null);
    setShowModal(false);
    setModalResult(null);

    try {
      const response = await api.post("/games/tsp/start");
      const data = response.data.data;

      setCities(data.cities);
      setDistanceMatrix(data.distanceMatrix);
      setHomeCity(data.homeCity);
      setComplexityAnalysis(data.complexityAnalysis);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start game. Please try again.");
      console.error("Error starting game:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCityToggle = (city) => {
    if (city === homeCity) return; // Can't select home city

    if (gameStatus !== "selecting") return; // Can't change selection after solving

    setSelectedCities((prev) => {
      if (prev.includes(city)) {
        return prev.filter((c) => c !== city);
      } else {
        return [...prev, city];
      }
    });
  };

  const handleSolve = async () => {
    if (selectedCities.length === 0) {
      setError("Please select at least one city to visit");
      return;
    }

    setSolving(true);
    setError("");

    try {
      const response = await api.post("/games/tsp/solve", {
        homeCity,
        citiesToVisit: selectedCities,
        distanceMatrix,
      });

      const data = response.data.data;
      setTspResults(data.results);
      setGameStatus("solved");
      // Initialize user route with home city at start and end
      setUserRoute([homeCity, ...Array(selectedCities.length).fill(""), homeCity]);
      setUserDistance(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to solve TSP. Please try again.");
      console.error("Error solving TSP:", err);
    } finally {
      setSolving(false);
    }
  };

  const calculateUserRouteDistance = (route) => {
    if (route.length < 2) return 0;
    let distance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      distance += distanceMatrix[route[i]]?.[route[i + 1]] || 0;
    }
    return distance;
  };

  const handleRouteChange = (index, newCity) => {
    if (gameStatus !== "solved") return;

    const newRoute = [...userRoute];
    newRoute[index] = newCity;
    setUserRoute(newRoute);
    
    // Calculate distance only if all cities are selected
    if (newRoute.every((city, idx) => idx === 0 || idx === newRoute.length - 1 || city !== "")) {
      setUserDistance(calculateUserRouteDistance(newRoute));
    } else {
      setUserDistance(null);
    }
  };

  const handleSubmit = async () => {
    if (!userRoute.length || userRoute[0] !== homeCity || userRoute[userRoute.length - 1] !== homeCity) {
      setError("Route must start and end with the home city");
      return;
    }

    // Check if all cities are selected
    const routeCities = userRoute.slice(1, -1);
    if (routeCities.some(city => city === "")) {
      setError("Please select all cities in your route");
      return;
    }

    // Check if all selected cities are visited
    const routeSet = new Set(routeCities);
    const citiesSet = new Set(selectedCities);
    if (routeSet.size !== citiesSet.size) {
      setError("Route must visit all selected cities exactly once");
      return;
    }

    for (const city of citiesSet) {
      if (!routeSet.has(city)) {
        setError(`Route must visit all selected cities. Missing: ${city}`);
        return;
      }
    }

    if (!player) {
      setError("Please login first");
      return;
    }

    if (!tspResults) {
      setError("Please solve the TSP first");
      return;
    }

    if (userDistance === null) {
      setError("Please complete your route");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const algorithmTimes = {
        bruteForce: tspResults.bruteForce?.time || null,
        nearestNeighbor: tspResults.nearestNeighbor?.time || null,
        dynamicProgramming: tspResults.dynamicProgramming?.time || null,
      };

      const response = await api.post("/games/tsp/answer", {
        playerId: player.id,
        playerName: player.name,
        homeCity,
        citiesToVisit: selectedCities,
        selectedRoute: userRoute,
        selectedDistance: userDistance,
        correctDistance: tspResults.shortestDistance,
        algorithmTimes,
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

  const renderDistanceMatrix = () => {
    if (!distanceMatrix || Object.keys(distanceMatrix).length === 0) return null;

    const cityList = Object.keys(distanceMatrix).sort();

    return (
      <div className="distance-matrix-container">
        <h3 className="matrix-title">Distance Matrix (km)</h3>
        <div className="matrix-table">
          <div className="matrix-header">
            <div className="matrix-cell header-cell"></div>
            {cityList.map((city) => (
              <div key={city} className="matrix-cell header-cell">
                {city}
              </div>
            ))}
          </div>
          {cityList.map((fromCity) => (
            <div key={fromCity} className="matrix-row">
              <div className="matrix-cell header-cell">{fromCity}</div>
              {cityList.map((toCity) => (
                <div
                  key={toCity}
                  className={`matrix-cell ${
                    fromCity === toCity ? "zero-cell" : ""
                  } ${fromCity === homeCity ? "home-row" : ""} ${
                    toCity === homeCity ? "home-col" : ""
                  }`}
                >
                  {distanceMatrix[fromCity][toCity]}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAlgorithmResults = () => {
    if (!tspResults) return null;

    return (
      <div className="algorithm-results">
        <h3 className="section-title">Algorithm Results</h3>
        
        {tspResults.bruteForce?.route && (
          <div className="algorithm-result-card">
            <div className="algorithm-header">
              <h4>Brute Force</h4>
              <span className="complexity-badge">O(n!)</span>
            </div>
            <div className="algorithm-details">
              <p>
                <strong>Route:</strong> {tspResults.bruteForce.route.join(" → ")}
              </p>
              <p>
                <strong>Distance:</strong> {tspResults.bruteForce.distance} km
              </p>
              <p>
                <strong>Time:</strong> {tspResults.bruteForce.time?.toFixed(4) || "N/A"} ms
              </p>
            </div>
          </div>
        )}

        {tspResults.bruteForce?.note && (
          <div className="algorithm-result-card skipped">
            <div className="algorithm-header">
              <h4>Brute Force</h4>
              <span className="complexity-badge">O(n!)</span>
            </div>
            <p className="skipped-note">{tspResults.bruteForce.note}</p>
          </div>
        )}

        {tspResults.nearestNeighbor && (
          <div className="algorithm-result-card">
            <div className="algorithm-header">
              <h4>Nearest Neighbor</h4>
              <span className="complexity-badge">O(n²)</span>
            </div>
            <div className="algorithm-details">
              <p>
                <strong>Route:</strong> {tspResults.nearestNeighbor.route.join(" → ")}
              </p>
              <p>
                <strong>Distance:</strong> {tspResults.nearestNeighbor.distance} km
              </p>
              <p>
                <strong>Time:</strong> {tspResults.nearestNeighbor.time?.toFixed(4) || "N/A"} ms
              </p>
            </div>
          </div>
        )}

        {tspResults.dynamicProgramming?.route && (
          <div className="algorithm-result-card optimal">
            <div className="algorithm-header">
              <h4>Dynamic Programming</h4>
              <span className="complexity-badge">O(2^n × n²)</span>
            </div>
            <div className="algorithm-details">
              <p>
                <strong>Route:</strong> {tspResults.dynamicProgramming.route.join(" → ")}
              </p>
              <p>
                <strong>Distance:</strong> {tspResults.dynamicProgramming.distance} km
              </p>
              <p>
                <strong>Time:</strong> {tspResults.dynamicProgramming.time?.toFixed(4) || "N/A"} ms
              </p>
              <p className="optimal-badge">⭐ Optimal Solution</p>
            </div>
          </div>
        )}

        {tspResults.dynamicProgramming?.note && (
          <div className="algorithm-result-card skipped">
            <div className="algorithm-header">
              <h4>Dynamic Programming</h4>
              <span className="complexity-badge">O(2^n × n²)</span>
            </div>
            <p className="skipped-note">{tspResults.dynamicProgramming.note}</p>
          </div>
        )}

        <div className="shortest-distance-info">
          <p>
            <strong>Shortest Distance:</strong> {tspResults.shortestDistance} km
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="tsp-page">
      <div className="tsp-header">
        <div className="header-content">
          <h1 className="tsp-title">🧮 Traveling Salesman Problem</h1>
          <p className="tsp-subtitle">
            Find the shortest route from {homeCity || "home city"} visiting selected cities and returning home
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

      {loading && !cities.length ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading game...</p>
        </div>
      ) : (
        <div className="tsp-game-container">
          {/* Left Column: City Selection & Distance Matrix */}
          <div className="tsp-left-column">
            <div className="city-selection-section">
              <h2 className="section-title">Select Cities to Visit</h2>
              <p className="section-description">
                Home City: <strong className="home-city-badge">{homeCity}</strong>
              </p>
              <div className="cities-grid">
                {cities.map((city) => (
                  <button
                    key={city}
                    className={`city-button ${
                      city === homeCity ? "home-city" : ""
                    } ${selectedCities.includes(city) ? "selected" : ""} ${
                      gameStatus !== "selecting" ? "disabled" : ""
                    }`}
                    onClick={() => handleCityToggle(city)}
                    disabled={city === homeCity || gameStatus !== "selecting"}
                  >
                    {city}
                    {city === homeCity && <span className="home-label">HOME</span>}
                    {selectedCities.includes(city) && (
                      <span className="checkmark">✓</span>
                    )}
                  </button>
                ))}
              </div>

              {selectedCities.length > 0 && (
                <div className="selected-cities-info">
                  <p>
                    Selected: <strong>{selectedCities.join(", ")}</strong>
                  </p>
                </div>
              )}

              {gameStatus === "selecting" && (
                <button
                  className="solve-button"
                  onClick={handleSolve}
                  disabled={selectedCities.length === 0 || solving}
                >
                  {solving ? "Solving..." : "Solve TSP"}
                </button>
              )}
            </div>

            {renderDistanceMatrix()}
          </div>

          {/* Right Column: Results & Answer Submission */}
          <div className="tsp-right-column">
            {tspResults && (
              <>
                {renderAlgorithmResults()}

                <div className="user-answer-section">
                  <h3 className="section-title">Your Answer</h3>
                  <p className="section-description">
                    Enter your route (must start and end with {homeCity})
                  </p>

                  <div className="route-builder">
                    <div className="route-inputs">
                      {userRoute.map((city, index) => (
                        <div key={index} className="route-select-wrapper">
                          <select
                            className={`route-select ${
                              index === 0 || index === userRoute.length - 1
                                ? "home-select"
                                : ""
                            }`}
                            value={city}
                            onChange={(e) => handleRouteChange(index, e.target.value)}
                            disabled={
                              index === 0 ||
                              index === userRoute.length - 1 ||
                              gameStatus !== "solved"
                            }
                          >
                            <option value="">
                              {index === 0 || index === userRoute.length - 1
                                ? homeCity
                                : "Select city"}
                            </option>
                            {index === 0 || index === userRoute.length - 1 ? (
                              <option value={homeCity}>{homeCity}</option>
                            ) : (
                              selectedCities.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))
                            )}
                          </select>
                          {index < userRoute.length - 1 && (
                            <span className="route-arrow">→</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {userDistance !== null && (
                      <div className="user-distance-info">
                        <p>
                          Your Route Distance: <strong>{userDistance} km</strong>
                        </p>
                      </div>
                    )}

                    <button
                      className="submit-button"
                      onClick={handleSubmit}
                      disabled={loading || !userRoute.length || userDistance === null}
                    >
                      {loading ? "Submitting..." : "Submit Answer"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {complexityAnalysis && (
              <div className="complexity-section">
                <h3 className="section-title">Algorithm Complexity</h3>
                <div className="complexity-cards">
                  <div className="complexity-card">
                    <h4>Brute Force</h4>
                    <p className="complexity-time">Time: {complexityAnalysis.bruteForce.time}</p>
                    <p className="complexity-space">Space: {complexityAnalysis.bruteForce.space}</p>
                    <p className="complexity-desc">
                      {complexityAnalysis.bruteForce.description}
                    </p>
                  </div>
                  <div className="complexity-card">
                    <h4>Nearest Neighbor</h4>
                    <p className="complexity-time">Time: {complexityAnalysis.nearestNeighbor.time}</p>
                    <p className="complexity-space">Space: {complexityAnalysis.nearestNeighbor.space}</p>
                    <p className="complexity-desc">
                      {complexityAnalysis.nearestNeighbor.description}
                    </p>
                  </div>
                  <div className="complexity-card">
                    <h4>Dynamic Programming</h4>
                    <p className="complexity-time">Time: {complexityAnalysis.dynamicProgramming.time}</p>
                    <p className="complexity-space">Space: {complexityAnalysis.dynamicProgramming.space}</p>
                    <p className="complexity-desc">
                      {complexityAnalysis.dynamicProgramming.description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {gameStatus === "won" || gameStatus === "lost" ? (
        <button className="new-game-button" onClick={startNewGame}>
          🎮 New Game
        </button>
      ) : null}

      {showLeaderboard && (
        <Leaderboard
          gameType="tsp"
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {showModal && modalResult && (
        <WinLoseModal
          isWin={modalResult.isCorrect}
          onClose={handleModalClose}
          message={
            modalResult.isCorrect
              ? `Congratulations! You found the correct shortest route of ${tspResults?.shortestDistance} km!`
              : `Incorrect. The shortest route is ${tspResults?.shortestDistance} km.`
          }
        />
      )}
    </div>
  );
};

export default TspPage;

