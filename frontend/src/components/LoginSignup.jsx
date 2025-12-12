import { useState } from "react";
import api from "../services/api";
import "./LoginSignup.css";

const LoginSignup = ({ onLogin }) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/signup", { name: name.trim() });
      const playerData = response.data.data.player;
      
      // Store player data in localStorage
      localStorage.setItem("player", JSON.stringify(playerData));
      
      // Call the onLogin callback
      if (onLogin) {
        onLogin(playerData);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-signup-container">
      <div className="login-signup-card">
        <div className="login-header">
          <h1>🎮 Welcome to AlgoVerse</h1>
          <p>Enter your name to start playing</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="playerName">Player Name</label>
            <input
              id="playerName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              disabled={loading}
              maxLength={50}
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <>
                <span className="spinner">⟳</span>
                Signing in...
              </>
            ) : (
              "Start Playing"
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>No password required - just enter your name!</p>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;

