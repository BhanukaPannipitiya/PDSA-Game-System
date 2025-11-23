const router = require("express").Router();

// Temp test route
router.get("/test", (req, res) => {
  res.json({ message: "Snake & Ladder API working" });
});

module.exports = router;
