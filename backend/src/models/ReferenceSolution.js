const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ReferenceSolution = sequelize.define(
  "ReferenceSolution",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    gameRoundId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "game_rounds",
        key: "id",
      },
      comment: "Optional: links to a specific game round. For Queens, can be null (global solutions)",
    },
    gameType: {
      type: DataTypes.ENUM("queens", "snakeLadder", "traffic", "tsp", "hanoi"),
      allowNull: false,
    },
    // Solution key for uniqueness (especially for Queens)
    solutionKey: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "Unique identifier for the solution (e.g., normalized positions for Queens)",
    },
    // The actual solution stored as JSON
    solution: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: "The correct solution (e.g., positions array, correct answer, route, etc.)",
    },
    // For Queens game: track if solution has been recognized
    recognized: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    recognizedBy: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    recognizedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "reference_solutions",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["gameType", "solutionKey"],
        name: "unique_game_solution_key",
      },
      {
        fields: ["gameType", "recognized"],
      },
      {
        fields: ["gameRoundId"],
      },
    ],
  }
);

module.exports = ReferenceSolution;

