require("dotenv").config();
const express = require("express");
const cors = require("cors");
const hanoiRoute = require('./routes/games/hanoiRoute');
const connectDB = require("./config/db");

const app = express();

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Headers:`, req.headers);
  next();
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Test route
app.get("/", (req, res) => {
  console.log("Root route hit");
  res.json({ message: "Backend is running!" });
});

// Connect DB
connectDB();

// API routes
const routes = require("./routes/index");
app.use("/api", routes);

// 404 handler for unmatched routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handling middleware (must be last, with 4 parameters)
// Only called when next(err) is invoked
const errorHandler = require("./middleware/errorMiddleware");
app.use(errorHandler);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/`);
});
