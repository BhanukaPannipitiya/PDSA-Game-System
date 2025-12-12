const mongoose = require("mongoose");

const queenSolutionSchema = new mongoose.Schema(
  {
    solutionKey: { type: String, unique: true, index: true },
    positions: { type: [Number], required: true },
    recognized: { type: Boolean, default: false },
    recognizedBy: { type: String, default: null },
    recognizedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QueenSolution", queenSolutionSchema);

