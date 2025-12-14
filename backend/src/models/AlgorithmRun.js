const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const AlgorithmRun = sequelize.define(
  "AlgorithmRun",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    gameRoundId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "game_rounds",
        key: "id",
      },
    },
    algorithmName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Name of the algorithm (e.g., 'BFS', 'Sequential', 'Edmonds-Karp')",
    },
    executionTimeMs: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
      comment: "Algorithm execution time in milliseconds",
    },
    // Additional algorithm-specific results stored as JSON
    algorithmResult: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Stores algorithm-specific results (e.g., solution count, path, etc.)",
    },
  },
  {
    tableName: "algorithm_runs",
    timestamps: true,
    indexes: [
      {
        fields: ["gameRoundId"],
      },
      {
        fields: ["algorithmName"],
      },
    ],
  }
);

module.exports = AlgorithmRun;

