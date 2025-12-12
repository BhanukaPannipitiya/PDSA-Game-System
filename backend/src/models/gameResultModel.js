const mongoose = require("mongoose");

const gameResultSchema = new mongoose.Schema(
  {
    playerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Player", 
      required: true 
    },
    playerName: { 
      type: String, 
      required: true 
    },
    gameType: { 
      type: String, 
      required: true,
      enum: ["queens", "snakeLadder", "traffic", "tsp", "hanoi"]
    },
    score: { 
      type: Number, 
      default: 0 
    },
    isCorrect: { 
      type: Boolean, 
      default: false 
    },
    // Game-specific data
    gameData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // Algorithm performance metrics
    algorithmTimes: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes for faster queries
gameResultSchema.index({ playerId: 1, gameType: 1 });
gameResultSchema.index({ gameType: 1, score: -1 });
gameResultSchema.index({ gameType: 1, createdAt: -1 });

// Prevent model overwrite error during hot reloading
module.exports = mongoose.models.GameResult || mongoose.model("GameResult", gameResultSchema);

