const mongoose = require("mongoose");

const gameResultSchema = new mongoose.Schema({
  game: { type: String, required: true },
  playerName: { type: String, required: true },

  correctAnswer: Number,
  selectedOption: Number,

  isCorrect: Boolean,

  algo1Time: Number, // BFS
  algo2Time: Number, // Bidirectional BFS

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GameResult", gameResultSchema);
