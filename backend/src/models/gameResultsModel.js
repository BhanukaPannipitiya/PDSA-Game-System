const mongoose = require("mongoose");

const gameResultSchema = new mongoose.Schema({
  // game: { type: String, required: true },
  // playerName: { type: String, required: true },

  // correctAnswer: Number,
  // selectedOption: Number,

  // isCorrect: Boolean,

  // algo1Time: Number, // BFS
  // algo2Time: Number, // Bidirectional BFS

  playerName: {
    type: String,
    required: true,
    trim: true
  },
  numDisks: {
    type: Number,
    required: true,
    min: 5,
    max: 10
  },
  numPegs: {
    type: Number,
    required: true,
    enum: [3, 4]
  },
  userMoves: {
    type: Number,
    required: true
  },
  userSequence: {
    type: [String],
    required: true
  },
  correctMoves: {
    type: Number,
    required: true
  },
  correctSequence: {
    type: [String],
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  algorithm1Name: {
    type: String,
    required: true
  },
  algorithm1Time: {
    type: Number,
    required: true
  },
  algorithm2Name: {
    type: String,
    required: true
  },
  algorithm2Time: {
    type: Number,
    required: true
  },

  createdAt: { type: Date, default: Date.now },
});

// Use a different model name to avoid conflict with the unified gameResultModel
// Prevent model overwrite error during hot reloading
module.exports = mongoose.models.HanoiGameResult || mongoose.model("HanoiGameResult", gameResultSchema);
