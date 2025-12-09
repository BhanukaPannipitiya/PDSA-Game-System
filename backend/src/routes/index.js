const router = require("express").Router();

router.use("/games/snakeladder", require("./games/snakeLadderRoute"));

module.exports = router;
