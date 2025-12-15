const router = require("express").Router();

const controller = require("../../controllers/games/trafficController");

router.post("/start", controller.startGame);
router.post("/answer", controller.submitAnswer);
router.get("/leaderboard", controller.getLeaderboard);

module.exports = router;
