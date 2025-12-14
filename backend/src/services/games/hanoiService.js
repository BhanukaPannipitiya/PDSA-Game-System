const { recursive3Pegs } = require("../../algorithms/hanoi/recursive3Pegs");
const { iterative3Pegs } = require("../../algorithms/hanoi/iterative3Pegs");
const { frameStewart4Pegs } = require("../../algorithms/hanoi/frameStewart4Pegs");
const { iterativeFrameStewart4Pegs } = require("../../algorithms/hanoi/iterativeFrameStewart4Pegs");
const { calculateMinMoves } = require("../../algorithms/hanoi/calculateMinMoves");

module.exports = {
  recursive3Pegs,
  iterative3Pegs,
  frameStewart4Pegs,
  iterativeFrameStewart4Pegs,
  calculateMinMoves
};