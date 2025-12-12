const router = require("express").Router();
const { getLeaderboard, getPlayerStats, getAllLeaderboards } = require("../controllers/leaderboardController");

router.get("/:gameType", getLeaderboard);
router.get("/player/:playerId", getPlayerStats);
router.get("/", getAllLeaderboards);

module.exports = router;

