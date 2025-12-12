const GameResult = require("../models/gameResultModel");
const Player = require("../models/playerModel");
const success = require("../utils/successResponse");
const ErrorResponse = require("../utils/errorHandler");

const getLeaderboard = async (req, res, next) => {
  try {
    const { gameType } = req.params;
    const { limit = 10 } = req.query;

    const validGameTypes = ["queens", "snakeLadder", "traffic", "tsp", "hanoi"];
    
    if (!validGameTypes.includes(gameType)) {
      throw new ErrorResponse("Invalid game type", 400);
    }

    const leaderboard = await GameResult.aggregate([
      {
        $match: { gameType, isCorrect: true }
      },
      {
        $group: {
          _id: "$playerId",
          playerName: { $first: "$playerName" },
          totalScore: { $sum: "$score" },
          gamesPlayed: { $sum: 1 },
          lastPlayed: { $max: "$createdAt" },
          bestScore: { $max: "$score" }
        }
      },
      {
        $sort: { totalScore: -1, lastPlayed: -1 }
      },
      {
        $limit: parseInt(limit, 10)
      },
      {
        $project: {
          _id: 0,
          playerId: "$_id",
          playerName: 1,
          totalScore: 1,
          gamesPlayed: 1,
          bestScore: 1,
          lastPlayed: 1
        }
      }
    ]);

    return success(res, {
      gameType,
      leaderboard,
      totalPlayers: leaderboard.length
    }, "Leaderboard retrieved successfully");
  } catch (error) {
    return next(error);
  }
};

const getPlayerStats = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const { gameType } = req.query;

    const matchQuery = { playerId };
    if (gameType) {
      matchQuery.gameType = gameType;
    }

    const stats = await GameResult.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: "$gameType",
          totalGames: { $sum: 1 },
          correctGames: {
            $sum: { $cond: ["$isCorrect", 1, 0] }
          },
          totalScore: { $sum: "$score" },
          bestScore: { $max: "$score" },
          lastPlayed: { $max: "$createdAt" }
        }
      }
    ]);

    const player = await Player.findById(playerId);
    if (!player) {
      throw new ErrorResponse("Player not found", 404);
    }

    return success(res, {
      player: {
        id: player._id,
        name: player.name,
      },
      stats,
    }, "Player stats retrieved successfully");
  } catch (error) {
    return next(error);
  }
};

const getAllLeaderboards = async (req, res, next) => {
  try {
    const gameTypes = ["queens", "snakeLadder", "traffic", "tsp", "hanoi"];
    const leaderboards = {};

    for (const gameType of gameTypes) {
      const leaderboard = await GameResult.aggregate([
        {
          $match: { gameType, isCorrect: true }
        },
        {
          $group: {
            _id: "$playerId",
            playerName: { $first: "$playerName" },
            totalScore: { $sum: "$score" },
            gamesPlayed: { $sum: 1 },
            bestScore: { $max: "$score" }
          }
        },
        {
          $sort: { totalScore: -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            _id: 0,
            playerId: "$_id",
            playerName: 1,
            totalScore: 1,
            gamesPlayed: 1,
            bestScore: 1
          }
        }
      ]);

      leaderboards[gameType] = leaderboard;
    }

    return success(res, leaderboards, "All leaderboards retrieved successfully");
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getLeaderboard,
  getPlayerStats,
  getAllLeaderboards,
};

