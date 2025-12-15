const { sequelize } = require("../config/db");
const Player = require("./Player");
const GameRound = require("./GameRound");
const AlgorithmRun = require("./AlgorithmRun");
const PlayerSubmission = require("./PlayerSubmission");
const ReferenceSolution = require("./ReferenceSolution");

// Define associations
Player.hasMany(GameRound, { foreignKey: "playerId", as: "gameRounds" });
GameRound.belongsTo(Player, { foreignKey: "playerId", as: "player" });

GameRound.hasMany(AlgorithmRun, { foreignKey: "gameRoundId", as: "algorithmRuns" });
AlgorithmRun.belongsTo(GameRound, { foreignKey: "gameRoundId", as: "gameRound" });

GameRound.hasOne(PlayerSubmission, { foreignKey: "gameRoundId", as: "playerSubmission" });
PlayerSubmission.belongsTo(GameRound, { foreignKey: "gameRoundId", as: "gameRound" });

PlayerSubmission.belongsTo(Player, { foreignKey: "playerId", as: "player" });

// For reference solutions (especially for Queens game)
GameRound.hasMany(ReferenceSolution, { foreignKey: "gameRoundId", as: "referenceSolutions" });
ReferenceSolution.belongsTo(GameRound, { foreignKey: "gameRoundId", as: "gameRound" });

module.exports = {
  sequelize,
  Player,
  GameRound,
  AlgorithmRun,
  PlayerSubmission,
  ReferenceSolution,
};

