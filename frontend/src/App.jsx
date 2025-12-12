import { useEffect, useState } from "react";
import GameMenu from "./components/GameMenu";
import LoginSignup from "./components/LoginSignup";
import QueensPage from "./pages/QueensPage";
import "./App.css";

function App() {
  const [hash, setHash] = useState(
    typeof window !== "undefined" ? window.location.hash : ""
  );
  const [player, setPlayer] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);

  useEffect(() => {
    // Check for stored player data
    const storedPlayer = localStorage.getItem("player");
    if (storedPlayer) {
      try {
        setPlayer(JSON.parse(storedPlayer));
      } catch (e) {
        localStorage.removeItem("player");
      }
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleLogin = (playerData) => {
    setPlayer(playerData);
    localStorage.setItem("player", JSON.stringify(playerData));
    // Clear any hash route and reset current game to show menu
    setCurrentGame(null);
    window.location.hash = "";
  };

  const handleLogout = () => {
    setPlayer(null);
    localStorage.removeItem("player");
    setCurrentGame(null);
    window.location.hash = "";
  };

  const handleGameSelect = (gameType) => {
    setCurrentGame(gameType);
    if (gameType === "queens") {
      window.location.hash = "#/queens";
    }
  };

  const handleBackToMenu = () => {
    setCurrentGame(null);
    window.location.hash = "";
  };

  // Show login if not authenticated
  if (!player) {
    return <LoginSignup onLogin={handleLogin} />;
  }

  // Show game based on route or current game
  if (hash === "#/queens" || currentGame === "queens") {
    return (
      <QueensPage 
        player={player} 
        onBack={handleBackToMenu}
      />
    );
  }

  // Show game menu
  return (
    <div className="main-page">
      <div className="app-header">
        <div className="player-info-header">
          <span>👤 {player.name}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
      <GameMenu onGameSelect={handleGameSelect} />
    </div>
  );
}

export default App;
