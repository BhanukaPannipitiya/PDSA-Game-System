const express = require("express");
const cors = require("cors");

const snakeRoutes = require("./routes/snakeLadder");
const trafficRoutes = require("./routes/traffic");
const tspRoutes = require("./routes/tsp");
const hanoiRoutes = require("./routes/hanoi");
const queenRoutes = require("./routes/queens");

const app = express();

app.use(cors());
app.use(express.json());

// Test root route
app.get("/", (req, res) => {
  res.send("PDSA Backend Running");
});

app.use("/snake-ladder", snakeRoutes);
app.use("/traffic", trafficRoutes);
app.use("/tsp", tspRoutes);
app.use("/hanoi", hanoiRoutes);
app.use("/queens", queenRoutes);

module.exports = app;
