const router = require("express").Router();

router.get("/", (req, res) => {
  res.send("API working");
});

module.exports = router;
