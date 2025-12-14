const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const GameRound = sequelize.define(
  "GameRound",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    playerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "players",
        key: "id",
      },
    },
    playerName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    gameType: {
      type: DataTypes.ENUM("queens", "snakeLadder", "traffic", "tsp", "hanoi"),
      allowNull: false,
    },
    // Game-specific configuration stored as JSON
    gameConfig: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Stores game-specific configuration (e.g., board size, numDisks, etc.)",
    },
  },
  {
    tableName: "game_rounds",
    timestamps: true,
    indexes: [
      {
        fields: ["playerId", "gameType"],
      },
      {
        fields: ["gameType", "createdAt"],
      },
    ],
  }
);

module.exports = GameRound;

