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
    if (!playerId || !playerName || !solution) {
      throw new ErrorResponse("playerId, playerName, and solution are required", 400);
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

