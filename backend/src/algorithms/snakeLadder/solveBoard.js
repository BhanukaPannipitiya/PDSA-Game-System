const { performance } = require("perf_hooks");
const { bfs } = require("./bfs");
const { biBfs } = require("./biBfs");

/**
 * Solve the Snake and Ladder board using both BFS and Bidirectional BFS
 * Measures execution time for both algorithms and returns results
 * @param {Object} snakes - Object mapping snake start positions to end positions
 * @param {Object} ladders - Object mapping ladder start positions to end positions
 * @param {number} N - Board size (N x N)
 * @returns {Object} Results containing BFS and Bidirectional BFS solutions with execution times
 */
function solveBoard(snakes, ladders, N) {
  const totalCells = N * N;

  const minBoard = {};
  Object.assign(minBoard, snakes, ladders);

  const start1 = performance.now();
  const bfsResult = bfs(minBoard, totalCells);
  const end1 = performance.now();

  const start2 = performance.now();
  const biResult = biBfs(minBoard, totalCells);
  const end2 = performance.now();

  return {
    bfs: bfsResult,
    bfsTime: end1 - start1,
    biBfs: biResult,
    biTime: end2 - start2
  };
}

module.exports = {
  solveBoard,
};

