const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const PlayerSubmission = sequelize.define(
  "PlayerSubmission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    gameRoundId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "game_rounds",
        key: "id",
      },
    },
    playerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "players",
        key: "id",
      },
    },
    // Player's answer stored as JSON (flexible for different game types)
    playerAnswer: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: "Player's submission (e.g., selected option, solution array, route, etc.)",
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    // Additional metadata about the submission
    submissionMetadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Additional metadata (e.g., reason for incorrect, duplicate flag, etc.)",
    },
  },
  {
    tableName: "player_submissions",
    timestamps: true,
    indexes: [
      {
        fields: ["gameRoundId"],
      },
      {
        fields: ["playerId", "isCorrect"],
      },
      {
        fields: ["isCorrect", "createdAt"],
      },
    ],
  }
);

module.exports = PlayerSubmission;

