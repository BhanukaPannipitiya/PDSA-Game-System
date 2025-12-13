const { performance } = require("perf_hooks");

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

  // BFS Algorithm
  bfs(minBoard, totalCells) {
    const queue = [{ cell: 1, dist: 0 }];
    const visited = Array(totalCells + 1).fill(false);
    visited[1] = true;

    while (queue.length) {
      const { cell, dist } = queue.shift();

      if (cell === totalCells) return dist;

      for (let dice = 1; dice <= 6; dice++) {
        let next = cell + dice;

        if (next > totalCells) continue;

        if (minBoard[next]) {
          next = minBoard[next];
        }

        if (!visited[next]) {
          visited[next] = true;
          queue.push({ cell: next, dist: dist + 1 });
        }
      }
    }
    return -1;
  }

  // Bidirectional BFS
  biBfs(minBoard, totalCells) {
    if (1 === totalCells) return 0;

    // Build adjacency list in reverse: for each cell, which cells can reach it
    const canReach = {};
    for (let i = 1; i <= totalCells; i++) {
      canReach[i] = [];
    }

    // For each position, find all positions that can reach it
    for (let from = 1; from < totalCells; from++) {
      for (let dice = 1; dice <= 6; dice++) {
        let to = from + dice;
        if (to > totalCells) break;
        let finalTo = minBoard[to] || to;
        if (finalTo !== from && !canReach[finalTo].includes(from)) {
          canReach[finalTo].push(from);
        }
      }
    }

    let forwardQueue = [1];
    let backwardQueue = [totalCells];
    let forwardVisited = new Set([1]);
    let backwardVisited = new Set([totalCells]);
    let forwardDist = { 1: 0 };
    let backwardDist = { [totalCells]: 0 };
    let moves = 0;

    while (forwardQueue.length > 0 && backwardQueue.length > 0) {
      // Expand forward
      let nextForwardQueue = [];
      for (let pos of forwardQueue) {
        for (let dice = 1; dice <= 6; dice++) {
          let next = pos + dice;
          if (next > totalCells) break;
          let finalPos = minBoard[next] || next;

          if (backwardVisited.has(finalPos)) {
            return forwardDist[pos] + 1 + backwardDist[finalPos];
          }

          if (!forwardVisited.has(finalPos)) {
            forwardVisited.add(finalPos);
            forwardDist[finalPos] = forwardDist[pos] + 1;
            nextForwardQueue.push(finalPos);
          }
        }
      }
      forwardQueue = nextForwardQueue;

      // Expand backward
      let nextBackwardQueue = [];
      for (let pos of backwardQueue) {
        for (let prev of canReach[pos] || []) {
          if (forwardVisited.has(prev)) {
            return forwardDist[prev] + backwardDist[pos] + 1;
          }

          if (!backwardVisited.has(prev)) {
            backwardVisited.add(prev);
            backwardDist[prev] = backwardDist[pos] + 1;
            nextBackwardQueue.push(prev);
          }
        }
      }
      backwardQueue = nextBackwardQueue;
    }

    return -1;
  }

  solveBoard(snakes, ladders, N) {
    const totalCells = N * N;

    const minBoard = {};
    Object.assign(minBoard, snakes, ladders);

    const start1 = performance.now();
    const bfsResult = this.bfs(minBoard, totalCells);
    const end1 = performance.now();

    const start2 = performance.now();
    const biResult = this.biBfs(minBoard, totalCells);
    const end2 = performance.now();

    return {
      bfs: bfsResult,
      bfsTime: end1 - start1,
      biBfs: biResult,
      biTime: end2 - start2
    };
  }

}

module.exports = new SnakeLadderService();
