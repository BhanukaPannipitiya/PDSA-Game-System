const success = require("../../utils/successResponse");
const ErrorResponse = require("../../utils/errorHandler");
const { computeAndPersistRun, getStats, submitSolution } = require("../../services/games/queensService");

const computeQueens = async (req, res, next) => {
  try {
    const results = await computeAndPersistRun();
    return success(res, results, "Eight queens solutions computed and stored.");
  } catch (error) {
    return next(error);
  }
};

const getQueensStats = async (req, res, next) => {
  try {
    const stats = await getStats();
    return success(res, stats, "Eight queens stats fetched.");
  } catch (error) {
    return next(error);
  }
};

const submitQueensSolution = async (req, res, next) => {
  try {
    const { playerId, playerName, solution, algorithmTimes } = req.body;

    // Validate required fields
    if (!playerId) {
      throw new ErrorResponse("playerId is required", 400);
    }
    if (!playerName) {
      throw new ErrorResponse("playerName is required", 400);
    }
    if (!solution) {
      throw new ErrorResponse("solution is required", 400);
    }

    // Validate solution is an array
    if (!Array.isArray(solution)) {
      throw new ErrorResponse("solution must be an array of 8 integers", 400);
    }

    // Validate algorithmTimes if provided
    if (algorithmTimes !== undefined && typeof algorithmTimes !== "object") {
      throw new ErrorResponse("algorithmTimes must be an object", 400);
    }

    const result = await submitSolution(playerId, playerName, solution, algorithmTimes);
    return success(res, result, "Submission processed.");
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  computeQueens,
  getQueensStats,
  submitQueensSolution,
};

