const { PlayerSubmission, GameRound, Player } = require("../models");
const { Op, Sequelize } = require("sequelize");
const success = require("../utils/successResponse");
const ErrorResponse = require("../utils/errorHandler");

const getLeaderboard = async (req, res, next) => {
  try {
    const { gameType } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const validGameTypes = ["queens", "snakeLadder", "traffic", "tsp", "hanoi"];

    if (!validGameTypes.includes(gameType)) {
      throw new ErrorResponse("Invalid game type", 400);
    }

    // Get leaderboard using raw query for better aggregation support
    const leaderboardData = await PlayerSubmission.sequelize.query(
      `
      SELECT 
        ps.playerId,
        gr.playerName,
        SUM(ps.score) as totalScore,
        COUNT(ps.id) as gamesPlayed,
        MAX(ps.score) as bestScore,
        MAX(ps.createdAt) as lastPlayed
      FROM player_submissions ps
      INNER JOIN game_rounds gr ON ps.gameRoundId = gr.id
      WHERE ps.isCorrect = true AND gr.gameType = :gameType
      GROUP BY ps.playerId, gr.playerName
      ORDER BY totalScore DESC, lastPlayed DESC
      LIMIT :limit
      `,
      {
        replacements: { gameType, limit },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    // Process results
    const leaderboard = leaderboardData.map((item) => ({
      playerId: item.playerId,
      playerName: item.playerName || "Unknown",
      totalScore: parseInt(item.totalScore) || 0,
      gamesPlayed: parseInt(item.gamesPlayed) || 0,
      bestScore: parseInt(item.bestScore) || 0,
      lastPlayed: item.lastPlayed,
    }));

    return success(
      res,
      {
        gameType,
        leaderboard,
        totalPlayers: leaderboard.length,
      },
      "Leaderboard retrieved successfully"
    );
  } catch (error) {
    return next(error);
  }
};

const getPlayerStats = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const { gameType } = req.query;

    const whereClause = { playerId, isCorrect: true };
    const gameRoundWhere = gameType ? { gameType } : {};

    const submissions = await PlayerSubmission.findAll({
      where: whereClause,
      include: [
        {
          model: GameRound,
          as: "gameRound",
          where: gameRoundWhere,
        },
      ],
      attributes: [
        [Sequelize.fn("COUNT", Sequelize.col("PlayerSubmission.id")), "totalGames"],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal("CASE WHEN PlayerSubmission.isCorrect THEN 1 ELSE 0 END")
          ),
          "correctGames",
        ],
        [Sequelize.fn("SUM", Sequelize.col("PlayerSubmission.score")), "totalScore"],
        [Sequelize.fn("MAX", Sequelize.col("PlayerSubmission.score")), "bestScore"],
        [Sequelize.fn("MAX", Sequelize.col("PlayerSubmission.createdAt")), "lastPlayed"],
        [Sequelize.col("gameRound.gameType"), "gameType"],
      ],
      group: ["gameRound.gameType"],
      raw: true,
    });

    const player = await Player.findByPk(playerId);
    if (!player) {
      throw new ErrorResponse("Player not found", 404);
    }

    const stats = submissions.map((submission) => ({
      gameType: submission.gameType,
      totalGames: parseInt(submission.totalGames) || 0,
      correctGames: parseInt(submission.correctGames) || 0,
      totalScore: parseInt(submission.totalScore) || 0,
      bestScore: parseInt(submission.bestScore) || 0,
      lastPlayed: submission.lastPlayed,
    }));

    return success(
      res,
      {
        player: {
          id: player.id,
          name: player.name,
        },
        stats,
      },
      "Player stats retrieved successfully"
    );
  } catch (error) {
    return next(error);
  }
};

const getAllLeaderboards = async (req, res, next) => {
  try {
    const gameTypes = ["queens", "snakeLadder", "traffic", "tsp", "hanoi"];
    const leaderboards = {};

    for (const gameType of gameTypes) {
      const submissions = await PlayerSubmission.sequelize.query(
        `
        SELECT 
          ps.playerId,
          gr.playerName,
          SUM(ps.score) as totalScore,
          COUNT(ps.id) as gamesPlayed,
          MAX(ps.score) as bestScore
        FROM player_submissions ps
        INNER JOIN game_rounds gr ON ps.gameRoundId = gr.id
        WHERE ps.isCorrect = true AND gr.gameType = :gameType
        GROUP BY ps.playerId, gr.playerName
        ORDER BY totalScore DESC
        LIMIT 10
        `,
        {
          replacements: { gameType },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      leaderboards[gameType] = submissions.map((item) => ({
        playerId: item.playerId,
        playerName: item.playerName || "Unknown",
        totalScore: parseInt(item.totalScore) || 0,
        gamesPlayed: parseInt(item.gamesPlayed) || 0,
        bestScore: parseInt(item.bestScore) || 0,
      }));
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
