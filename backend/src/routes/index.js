const router = require("express").Router();

// Auth routes
router.use("/auth", require("./authRoute"));

// Leaderboard routes
router.use("/leaderboard", require("./leaderboardRoute"));

// Game routes
router.use("/games/snakeladder", require("./games/snakeLadderRoute"));
router.use("/games/hanoi", require("./games/hanoiRoute"));
router.use("/games/queens", require("./games/queensRoute"));

module.exports = router;

