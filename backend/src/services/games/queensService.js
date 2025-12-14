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
  try {
    // Validate that both algorithms will run
    if (BOARD_SIZE < 1 || BOARD_SIZE > 20) {
      throw new ErrorResponse("Board size must be between 1 and 20", 400);
    }

    // Run sequential algorithm
    const sequentialResult = await computeSequential();
    if (!sequentialResult.solutions || sequentialResult.solutions.length === 0) {
      throw new ErrorResponse("Sequential algorithm failed to find solutions", 500);
    }

    // Run threaded algorithm
    const threadedResult = await computeThreaded();
    if (!threadedResult.solutions || threadedResult.solutions.length === 0) {
      throw new ErrorResponse("Threaded algorithm failed to find solutions", 500);
    }

    // Verify both found the same number of solutions
    if (sequentialResult.solutions.length !== threadedResult.solutions.length) {
      console.warn(
        `Warning: Sequential found ${sequentialResult.solutions.length} solutions, ` +
        `Threaded found ${threadedResult.solutions.length} solutions`
      );
    }

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
      gameConfig: { type: "computation_run", boardSize: BOARD_SIZE },
    });

    // Store algorithm runs with detailed results
    await AlgorithmRun.create({
      gameRoundId: gameRound.id,
      algorithmName: "Sequential",
      executionTimeMs: sequentialResult.timeMs,
      algorithmResult: {
        totalSolutions: sequentialResult.solutions.length,
        boardSize: BOARD_SIZE,
        algorithmType: "sequential",
      },
    });

    await AlgorithmRun.create({
      gameRoundId: gameRound.id,
      algorithmName: "Threaded",
      executionTimeMs: threadedResult.timeMs,
      algorithmResult: {
        totalSolutions: threadedResult.solutions.length,
        boardSize: BOARD_SIZE,
        algorithmType: "threaded",
      },
    });

    // Calculate comparison metrics
    const timeDifference = Math.abs(sequentialResult.timeMs - threadedResult.timeMs);
    const fasterAlgorithm = sequentialResult.timeMs < threadedResult.timeMs ? "Sequential" : "Threaded";
    const speedup = fasterAlgorithm === "Threaded"
      ? (sequentialResult.timeMs / threadedResult.timeMs).toFixed(2)
      : (threadedResult.timeMs / sequentialResult.timeMs).toFixed(2);

    return {
      sequentialTimeMs: sequentialResult.timeMs,
      threadedTimeMs: threadedResult.timeMs,
      totalSolutions: sequentialResult.solutions.length,
      runId: gameRound.id,
      comparison: {
        fasterAlgorithm,
        timeDifference: timeDifference.toFixed(4),
        speedup: fasterAlgorithm === "Threaded" ? speedup : `1/${speedup}`,
        sequentialSolutions: sequentialResult.solutions.length,
        threadedSolutions: threadedResult.solutions.length,
      },
    };
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    throw new ErrorResponse(
      `Error computing solutions: ${error.message}`,
      500
    );
  }
}

async function getStats() {
  try {
    const totalSolutions = await ensureSolutionsSeeded();
    const recognizedCount = await ReferenceSolution.count({
      where: { gameType: "queens", recognized: true },
    });
    const remainingSolutions = totalSolutions - recognizedCount;

    // Get latest algorithm run (from computation run)
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

    // Get sample solutions for display (prefer unrecognized ones)
    const sampleSolutions = await ReferenceSolution.findAll({
      where: { gameType: "queens" },
      limit: 6,
      attributes: ["solution", "recognized", "recognizedBy"],
      order: [["recognized", "ASC"], ["id", "ASC"]],
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

    // Calculate comparison if both times are available
    let comparison = null;
    if (sequentialTimeMs && threadedTimeMs) {
      const fasterAlgorithm = sequentialTimeMs < threadedTimeMs ? "Sequential" : "Threaded";
      const timeDifference = Math.abs(sequentialTimeMs - threadedTimeMs);
      const speedup = fasterAlgorithm === "Threaded"
        ? (sequentialTimeMs / threadedTimeMs).toFixed(2)
        : (threadedTimeMs / sequentialTimeMs).toFixed(2);
      
      comparison = {
        fasterAlgorithm,
        timeDifference: timeDifference.toFixed(4),
        speedup: fasterAlgorithm === "Threaded" ? speedup : `1/${speedup}`,
      };
    }

    return {
      totalSolutions,
      recognizedCount,
      remainingSolutions,
      sequentialTimeMs,
      threadedTimeMs,
      lastComputedAt: latestRun?.createdAt ?? null,
      solutions: sampleSolutions.map((s) => s.solution),
      comparison,
    };
  } catch (error) {
    throw new ErrorResponse(
      `Error fetching stats: ${error.message}`,
      500
    );
  }
}

async function submitSolution(playerId, playerName, positions, algorithmTimes = {}) {
  try {
    // Validate inputs
    if (!playerId) {
      throw new ErrorResponse("Player ID is required", 400);
    }
    if (!playerName || typeof playerName !== "string" || playerName.trim().length === 0) {
      throw new ErrorResponse("Player name is required and must be a non-empty string", 400);
    }
    if (!isValidPositions(positions)) {
      throw new ErrorResponse(
        "Invalid solution format. Solution must be an array of 8 integers (0-7) with no conflicts.",
        400
      );
    }

    // Validate algorithm times if provided
    if (algorithmTimes.sequential !== undefined) {
      if (typeof algorithmTimes.sequential !== "number" || algorithmTimes.sequential < 0) {
        throw new ErrorResponse("Sequential algorithm time must be a non-negative number", 400);
      }
    }
    if (algorithmTimes.threaded !== undefined) {
      if (typeof algorithmTimes.threaded !== "number" || algorithmTimes.threaded < 0) {
        throw new ErrorResponse("Threaded algorithm time must be a non-negative number", 400);
      }
    }

    // Ensure solutions are seeded
    await ensureSolutionsSeeded();
    
    // Normalize and find solution
    const solutionKey = normalizeSolution(positions);
    const solution = await ReferenceSolution.findOne({
      where: { gameType: "queens", solutionKey },
    });

    // Create game round for this submission
    const gameRound = await GameRound.create({
      playerId: parseInt(playerId),
      playerName: playerName.trim(),
      gameType: "queens",
      gameConfig: { solution: positions, solutionKey },
    });

    // Store algorithm runs if provided
    if (algorithmTimes.sequential !== undefined) {
      await AlgorithmRun.create({
        gameRoundId: gameRound.id,
        algorithmName: "Sequential",
        executionTimeMs: algorithmTimes.sequential,
        algorithmResult: { type: "player_submission" },
      });
    }
    if (algorithmTimes.threaded !== undefined) {
      await AlgorithmRun.create({
        gameRoundId: gameRound.id,
        algorithmName: "Threaded",
        executionTimeMs: algorithmTimes.threaded,
        algorithmResult: { type: "player_submission" },
      });
    }

    // Check if solution exists
    if (!solution) {
      // Save incorrect attempt
      await PlayerSubmission.create({
        gameRoundId: gameRound.id,
        playerId: parseInt(playerId),
        playerAnswer: { solution: positions, solutionKey },
        isCorrect: false,
        score: 0,
        submissionMetadata: { reason: "incorrect", message: "Solution is not a valid eight queens solution" },
      });

      throw new ErrorResponse("Incorrect solution. This is not a valid eight queens solution. Try again.", 400);
    }

    // Check if solution already recognized
    if (solution.recognized) {
      // Save duplicate attempt
      await PlayerSubmission.create({
        gameRoundId: gameRound.id,
        playerId: parseInt(playerId),
        playerAnswer: { solution: positions, solutionKey },
        isCorrect: false,
        score: 0,
        submissionMetadata: {
          reason: "duplicate",
          previouslyRecognizedBy: solution.recognizedBy,
          previouslyRecognizedAt: solution.recognizedAt,
        },
      });

      return {
        status: "duplicate",
        message: `This correct solution was already recognized by ${solution.recognizedBy || "another player"}. Try another one.`,
        previouslyRecognizedBy: solution.recognizedBy,
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
      playerId: parseInt(playerId),
      playerAnswer: { solution: positions, solutionKey },
      isCorrect: true,
      score: 1,
      submissionMetadata: { solutionKey, recognizedAt: new Date() },
    });

    // Check if all solutions have been found
    const totalSolutions = await ReferenceSolution.count({
      where: { gameType: "queens" },
    });
    const recognizedCount = await ReferenceSolution.count({
      where: { gameType: "queens", recognized: true },
    });

    if (recognizedCount >= totalSolutions) {
      // Reset all solutions for the next round
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
          `Congratulations ${playerName.trim()}! All ${totalSolutions} solutions were identified. The slate has been cleared for the next round.`,
        totalSolutions,
        recognizedCount: totalSolutions,
      };
    }

    return {
      status: "accepted",
      message: `Correct! Your solution has been recorded, ${playerName.trim()}.`,
      remaining: totalSolutions - recognizedCount,
      totalSolutions,
      recognizedCount,
    };
  } catch (error) {
    if (error instanceof ErrorResponse) {
      throw error;
    }
    // Handle database errors
    if (error.name === "SequelizeValidationError") {
      throw new ErrorResponse(`Validation error: ${error.message}`, 400);
    }
    if (error.name === "SequelizeDatabaseError") {
      throw new ErrorResponse(`Database error: ${error.message}`, 500);
    }
    throw new ErrorResponse(
      `Error submitting solution: ${error.message}`,
      500
    );
  }
}

module.exports = {
  computeAndPersistRun,
  getStats,
  submitSolution,
  isValidPositions,
  normalizeSolution,
};
