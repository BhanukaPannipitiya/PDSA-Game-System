const { Sequelize } = require("sequelize");

// Database configuration from environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME || "pdsa_game_system",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL Connected Successfully!");

    // Sync database in development (creates tables if they don't exist)
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: false }); // Set to true to alter existing tables
      console.log("Database synchronized!");
    }
  } catch (error) {
    console.error("MySQL Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
