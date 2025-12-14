const {
  ReferenceSolution,
  GameRound,
  AlgorithmRun,
  PlayerSubmission,
} = require("../../models");
const { solveEightQueensSequential } = require("../../algorithms/queens/sequentialSolver");
const { solveEightQueensThreaded } = require("../../algorithms/queens/threadedSolver");
const { Op } = require("sequelize");
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
  const count = await ReferenceSolution.count({
    where: { gameType: "queens" },
  });
  if (count > 0) return count;
  const { solutions } = await computeSequential();
  return solutions.length;
}

async function upsertSolutions(solutions) {
  for (const positions of solutions) {
    const solutionKey = normalizeSolution(positions);
    await ReferenceSolution.findOrCreate({
      where: { gameType: "queens", solutionKey },
      defaults: {
        gameType: "queens",
        solution: positions,
        solutionKey,
        recognized: false,
      },
    });
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

  // Get or create system player for computation runs
  const { Player } = require("../../models");
  let systemPlayer = await Player.findOne({ where: { name: "system" } });
  if (!systemPlayer) {
    systemPlayer = await Player.create({ name: "system" });
  }

  // Create a game round for this computation run
  const gameRound = await GameRound.create({
    playerId: systemPlayer.id,
    playerName: "system",
    gameType: "queens",
    gameConfig: { type: "computation_run" },
  });

  // Store algorithm runs
  await AlgorithmRun.create({
    gameRoundId: gameRound.id,
    algorithmName: "Sequential",
    executionTimeMs: sequentialResult.timeMs,
    algorithmResult: { totalSolutions: sequentialResult.solutions.length },
  });

  await AlgorithmRun.create({
    gameRoundId: gameRound.id,
    algorithmName: "Threaded",
    executionTimeMs: threadedResult.timeMs,
    algorithmResult: { totalSolutions: threadedResult.solutions.length },
  });

  return {
    sequentialTimeMs: sequentialResult.timeMs,
    threadedTimeMs: threadedResult.timeMs,
    totalSolutions: sequentialResult.solutions.length,
    runId: gameRound.id,
  };
}

async function getStats() {
  const totalSolutions = await ensureSolutionsSeeded();
  const recognizedCount = await ReferenceSolution.count({
    where: { gameType: "queens", recognized: true },
  });

  // Get latest algorithm run
  const latestRun = await AlgorithmRun.findOne({
    where: {
      algorithmName: "Sequential",
    },
    include: [
      {
        model: GameRound,
        as: "gameRound",
        where: { gameType: "queens" },
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  // Get sample solutions for display
  const sampleSolutions = await ReferenceSolution.findAll({
    where: { gameType: "queens" },
    limit: 6,
    attributes: ["solution"],
    raw: true,
  });

  const sequentialTimeMs = latestRun?.executionTimeMs ?? null;
  const threadedRun = latestRun
    ? await AlgorithmRun.findOne({
        where: {
          gameRoundId: latestRun.gameRoundId,
          algorithmName: "Threaded",
        },
      })
    : null;
  const threadedTimeMs = threadedRun?.executionTimeMs ?? null;

  return {
    totalSolutions,
    recognizedCount,
    sequentialTimeMs,
    threadedTimeMs,
    lastComputedAt: latestRun?.createdAt ?? null,
    solutions: sampleSolutions.map((s) => s.solution),
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
  const solution = await ReferenceSolution.findOne({
    where: { gameType: "queens", solutionKey },
  });

  // Create game round for this submission
  const gameRound = await GameRound.create({
    playerId,
    playerName: playerName.trim(),
    gameType: "queens",
    gameConfig: { solution: positions },
  });

  // Store algorithm runs
  if (algorithmTimes.sequential) {
    await AlgorithmRun.create({
      gameRoundId: gameRound.id,
      algorithmName: "Sequential",
      executionTimeMs: algorithmTimes.sequential,
    });
  }
  if (algorithmTimes.threaded) {
    await AlgorithmRun.create({
      gameRoundId: gameRound.id,
      algorithmName: "Threaded",
      executionTimeMs: algorithmTimes.threaded,
    });
  }

  if (!solution) {
    // Save incorrect attempt
    await PlayerSubmission.create({
      gameRoundId: gameRound.id,
      playerId,
      playerAnswer: { solution: positions },
      isCorrect: false,
      score: 0,
      submissionMetadata: { reason: "incorrect" },
    });

    throw new ErrorResponse("Incorrect solution. Try again.", 400);
  }

  if (solution.recognized) {
    // Save duplicate attempt
    await PlayerSubmission.create({
      gameRoundId: gameRound.id,
      playerId,
      playerAnswer: { solution: positions },
      isCorrect: false,
      score: 0,
      submissionMetadata: { reason: "duplicate" },
    });

    return {
      status: "duplicate",
      message: "This correct solution was already recognized. Try another one.",
    };
  }

  // Mark solution as recognized
  solution.recognized = true;
  solution.recognizedBy = playerName.trim();
  solution.recognizedAt = new Date();
  await solution.save();

  // Save successful submission
  await PlayerSubmission.create({
    gameRoundId: gameRound.id,
    playerId,
    playerAnswer: { solution: positions, solutionKey },
    isCorrect: true,
    score: 1,
    submissionMetadata: { solutionKey },
  });

  const totalSolutions = await ReferenceSolution.count({
    where: { gameType: "queens" },
  });
  const recognizedCount = await ReferenceSolution.count({
    where: { gameType: "queens", recognized: true },
  });

  if (recognizedCount === totalSolutions) {
    // Reset all solutions
    await ReferenceSolution.update(
      {
        recognized: false,
        recognizedBy: null,
        recognizedAt: null,
      },
      {
        where: { gameType: "queens" },
      }
    );
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
