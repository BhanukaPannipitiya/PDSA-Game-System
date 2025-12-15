const { solveBoard } = require("../../algorithms/snakeLadder/solveBoard");
const { bfs } = require("../../algorithms/snakeLadder/bfs");
const { biBfs } = require("../../algorithms/snakeLadder/biBfs");

class SnakeLadderService {

  generateBoard(N) {
    // Validation
    if (!N || N < 6 || N > 12) {
      throw new Error("Board size must be between 6 and 12");
    }

    const totalCells = N * N;
    const snakes = {};
    const ladders = {};

    let snakeCount = N - 2;
    let ladderCount = N - 2;

    const used = new Set();
    const maxAttempts = 1000; // Prevent infinite loops

    // Generate Ladders (must go up: start < end)
    let ladderAttempts = 0;
    while (Object.keys(ladders).length < ladderCount && ladderAttempts < maxAttempts) {
      ladderAttempts++;
      
      // Start from cell 2 to totalCells-1 (can't start at 1 or end at totalCells)
      let start = Math.floor(Math.random() * (totalCells - 2)) + 2;
      // End must be after start and before totalCells
      let end = Math.floor(Math.random() * (totalCells - start)) + start + 1;

      // Ensure end doesn't exceed totalCells
      if (end >= totalCells) continue;

      if (!used.has(start) && !used.has(end) && start < end) {
        ladders[start] = end;
        used.add(start);
        used.add(end);
      }
    }

    // Generate Snakes (must go down: start > end)
    let snakeAttempts = 0;
    while (Object.keys(snakes).length < snakeCount && snakeAttempts < maxAttempts) {
      snakeAttempts++;
      
      // Start from cell 2 to totalCells-1
      let start = Math.floor(Math.random() * (totalCells - 2)) + 2;
      // End must be before start and after 1
      let end = Math.floor(Math.random() * (start - 2)) + 2;

      if (end >= start || end === 1) continue;

      if (!used.has(start) && !used.has(end) && start > end) {
        snakes[start] = end;
        used.add(start);
        used.add(end);
      }
    }

    // Validate we got the required number
    if (Object.keys(ladders).length < ladderCount) {
      throw new Error(`Failed to generate ${ladderCount} ladders. Generated ${Object.keys(ladders).length}`);
    }

    if (Object.keys(snakes).length < snakeCount) {
      throw new Error(`Failed to generate ${snakeCount} snakes. Generated ${Object.keys(snakes).length}`);
    }

    return { snakes, ladders };
  }

  solveBoard(snakes, ladders, N) {
    return solveBoard(snakes, ladders, N);
  }

  // Expose algorithms for direct unit testing
  bfs(minBoard, totalCells) {
    return bfs(minBoard, totalCells);
  }

  biBfs(minBoard, totalCells) {
    return biBfs(minBoard, totalCells);
  }

}

module.exports = new SnakeLadderService();
