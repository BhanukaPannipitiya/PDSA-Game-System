import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5002/api",
});

export const startGame = (boardSize) => {
    return api.post("/games/snakeladder/start", { boardSize });
};

export const submitAnswer = (payload) => {
    return api.post("/games/snakeladder/answer", payload);
};

export const getLeaderboard = () => {
    return api.get("/games/snakeladder/leaderboard");
};


export default api;
