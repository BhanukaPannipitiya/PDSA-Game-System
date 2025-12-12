const router = require("express").Router();
const { signup, login, getPlayer } = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.get("/player/:playerId", getPlayer);

module.exports = router;

