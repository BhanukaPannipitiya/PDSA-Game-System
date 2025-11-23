const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Route placeholders
app.use("/snake-ladder", require("./routes/snakeLadder"));
app.use("/traffic", require("./routes/traffic"));
app.use("/tsp", require("./routes/tsp"));
app.use("/hanoi", require("./routes/hanoi"));
app.use("/queens", require("./routes/queens"));

module.exports = app;
