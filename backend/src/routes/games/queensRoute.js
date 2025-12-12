const router = require("express").Router();
const { computeQueens, getQueensStats, submitQueensSolution } = require("../../controllers/games/queensController");

router.post("/compute", computeQueens);
router.get("/stats", getQueensStats);
router.post("/submit", submitQueensSolution);

module.exports = router;

