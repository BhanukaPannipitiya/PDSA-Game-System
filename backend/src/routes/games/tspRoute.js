const router = require("express").Router();

const controller = require("../../controllers/games/tspController");

router.post("/start", controller.startGame);
router.post("/solve", controller.solveTSP);
router.post("/answer", controller.submitAnswer);
router.get("/leaderboard", controller.getLeaderboard);

module.exports = router;
