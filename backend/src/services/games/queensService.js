const QueenSolution = require("../../models/queenSolutionModel");
const QueenRun = require("../../models/queenRunModel");
const GameResult = require("../../models/gameResultModel");
const { solveEightQueensSequential } = require("../../algorithms/queens/sequentialSolver");
const { solveEightQueensThreaded } = require("../../algorithms/queens/threadedSolver");
const ErrorResponse = require("../../utils/errorHandler");

const BOARD_SIZE = 8;

const normalizeSolution = (positions) => positions.join(",");

function isValidPositions(positions) {
  if (!Array.isArray(positions) || positions.length !== BOARD_SIZE) return false;
  const seen = new Set();
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    const col = positions[row];
    if (!Number.isInteger(col) || col < 0 || col >= BOARD_SIZE) return false;
    if (seen.has(col)) return false;
    seen.add(col);
  }
  // verify no diagonal attacks
  for (let i = 0; i < BOARD_SIZE; i += 1) {
    for (let j = i + 1; j < BOARD_SIZE; j += 1) {
      if (Math.abs(i - j) === Math.abs(positions[i] - positions[j])) return false;
    }
  }
  return true;
}

async function ensureSolutionsSeeded() {
  const count = await QueenSolution.countDocuments();
  if (count > 0) return count;
  const { solutions } = await computeSequential();
  return solutions.length;
}

async function upsertSolutions(solutions) {
  const bulkOps = solutions.map((positions) => ({
    updateOne: {
      filter: { solutionKey: normalizeSolution(positions) },
      update: {
        $setOnInsert: {
          positions,
        },
      },
      upsert: true,
    },
  }));
  if (bulkOps.length) {
    await QueenSolution.bulkWrite(bulkOps);
  }
}

async function computeSequential() {
  const start = process.hrtime.bigint();
  const solutions = solveEightQueensSequential(BOARD_SIZE);
  const end = process.hrtime.bigint();
  const timeMs = Number(end - start) / 1_000_000;
  await upsertSolutions(solutions);
  return { solutions, timeMs };
}

async function computeThreaded() {
  const { solutions, timeMs } = await solveEightQueensThreaded(BOARD_SIZE);
  await upsertSolutions(solutions);
  return { solutions, timeMs };
}

async function computeAndPersistRun() {
  const sequentialResult = await computeSequential();
  const threadedResult = await computeThreaded();

  const run = await QueenRun.create({
    sequentialTimeMs: sequentialResult.timeMs,
    threadedTimeMs: threadedResult.timeMs,
    totalSolutions: sequentialResult.solutions.length,
  });

  return {
    sequentialTimeMs: sequentialResult.timeMs,
    threadedTimeMs: threadedResult.timeMs,
    totalSolutions: sequentialResult.solutions.length,
    runId: run.id,
  };
}

async function getStats() {
  const totalSolutions = await ensureSolutionsSeeded();
  const recognizedCount = await QueenSolution.countDocuments({ recognized: true });
  const latestRun = await QueenRun.findOne().sort({ createdAt: -1 }).lean();

  // Get sample solutions for display
  const sampleSolutions = await QueenSolution.find()
    .limit(6)
    .select("positions -_id")
    .lean();

  return {
    totalSolutions,
    recognizedCount,
    sequentialTimeMs: latestRun?.sequentialTimeMs ?? null,
    threadedTimeMs: latestRun?.threadedTimeMs ?? null,
    lastComputedAt: latestRun?.computedAt ?? null,
    solutions: sampleSolutions.map(s => s.positions),
  };
}

async function submitSolution(playerId, playerName, positions, algorithmTimes = {}) {
  if (!playerId) {
    throw new ErrorResponse("Player ID is required", 400);
  }
  if (!playerName || typeof playerName !== "string") {
    throw new ErrorResponse("Player name is required", 400);
  }
  if (!isValidPositions(positions)) {
    throw new ErrorResponse("Invalid solution format", 400);
  }

  await ensureSolutionsSeeded();
  const solutionKey = normalizeSolution(positions);
  const solution = await QueenSolution.findOne({ solutionKey });

  if (!solution) {
    // Save incorrect attempt as game result
    await GameResult.create({
      playerId,
      playerName: playerName.trim(),
      gameType: "queens",
      score: 0,
      isCorrect: false,
      gameData: { solution: positions },
      algorithmTimes,
    });
    
    throw new ErrorResponse("Incorrect solution. Try again.", 400);
  }

  if (solution.recognized) {
    // Save duplicate attempt
    await GameResult.create({
      playerId,
      playerName: playerName.trim(),
      gameType: "queens",
      score: 0,
      isCorrect: false,
      gameData: { solution: positions, reason: "duplicate" },
      algorithmTimes,
    });
    
    return {
      status: "duplicate",
      message: "This correct solution was already recognized. Try another one.",
    };
  }

  solution.recognized = true;
  solution.recognizedBy = playerName.trim();
  solution.recognizedAt = new Date();
  await solution.save();

  // Save successful game result
  await GameResult.create({
    playerId,
    playerName: playerName.trim(),
    gameType: "queens",
    score: 1, // 1 point for correct solution
    isCorrect: true,
    gameData: { solution: positions, solutionKey },
    algorithmTimes,
  });

  const totalSolutions = await QueenSolution.estimatedDocumentCount();
  const recognizedCount = await QueenSolution.countDocuments({ recognized: true });

  if (recognizedCount === totalSolutions) {
    await QueenSolution.updateMany({}, { $set: { recognized: false, recognizedBy: null, recognizedAt: null } });
    return {
      status: "completed",
      message:
        "Congratulations! All solutions were identified. The slate has been cleared for the next round.",
    };
  }

  return {
    status: "accepted",
    message: "Correct! Your solution has been recorded.",
    remaining: totalSolutions - recognizedCount,
  };
}

module.exports = {
  computeAndPersistRun,
  getStats,
  submitSolution,
  isValidPositions,
  normalizeSolution,
};

