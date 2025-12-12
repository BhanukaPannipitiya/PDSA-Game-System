const mongoose = require("mongoose");

const queenRunSchema = new mongoose.Schema(
  {
    sequentialTimeMs: { type: Number, required: true },
    threadedTimeMs: { type: Number, required: true },
    totalSolutions: { type: Number, required: true },
    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QueenRun", queenRunSchema);

