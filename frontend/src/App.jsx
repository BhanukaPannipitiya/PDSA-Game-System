import { useEffect, useState } from "react";
import GameMenu from "./components/GameMenu";
import LoginSignup from "./components/LoginSignup";
import QueensPage from "./pages/QueensPage";
import TowerOfHanoi from "./pages/TowerOfHanoi";
import "./App.css";
import SnakeLadderPage from "./pages/SnakeLadderPage";

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
    const onHashChange = () => {
      const newHash = window.location.hash;
      setHash(newHash);
      // Sync currentGame with hash
      if (newHash === "#/queens") {
        setCurrentGame("queens");
      } else if (newHash === "#/hanoi") {
        setCurrentGame("hanoi");
      } else if (newHash === "" || newHash === "#") {
        setCurrentGame(null);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    // Also check initial hash
    onHashChange();
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
    } else if (gameType === "hanoi") {
      window.location.hash = "#/hanoi";
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
  if (hash === "#/snake-ladder" || currentGame === "snakeLadder") {
    return (
      <SnakeLadderPage 
        player={player} 
        onBack={handleBackToMenu}
      />
    );
  }

  if (hash === "#/hanoi" || currentGame === "hanoi") {
    return (
      <TowerOfHanoi 
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
