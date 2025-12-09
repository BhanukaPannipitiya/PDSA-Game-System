const { performance } = require("perf_hooks");

class SnakeLadderService {

  generateBoard(N) {
    const totalCells = N * N;

    const snakes = {};
    const ladders = {};

    let snakeCount = N - 2;
    let ladderCount = N - 2;

    const used = new Set();

    // Generate Ladders
    while (Object.keys(ladders).length < ladderCount) {
      let start = Math.floor(Math.random() * (totalCells - 1)) + 2;
      let end = Math.floor(Math.random() * (totalCells - start)) + start + 1;

      if (!used.has(start) && !used.has(end)) {
        ladders[start] = end;
        used.add(start);
        used.add(end);
      }
    }

    // Generate Snakes
    while (Object.keys(snakes).length < snakeCount) {
      let start = Math.floor(Math.random() * (totalCells - 1)) + 2;
      let end = Math.floor(Math.random() * (start - 1)) + 1;

      if (end !== 1 && !used.has(start) && !used.has(end)) {
        snakes[start] = end;
        used.add(start);
        used.add(end);
      }
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
    let startSet = new Set([1]);
    let endSet = new Set([totalCells]);
    let visited = new Set();
    let moves = 0;

    while (startSet.size && endSet.size) {
      moves++;
      let temp = new Set();

      for (let pos of startSet) {
        for (let dice = 1; dice <= 6; dice++) {
          let next = pos + dice;
          if (next > totalCells) continue;

          if (minBoard[next]) next = minBoard[next];

          if (endSet.has(next)) return moves;

          if (!visited.has(next)) {
            visited.add(next);
            temp.add(next);
          }
        }
      }
      startSet = temp;
      if (startSet.size > endSet.size) {
        [startSet, endSet] = [endSet, startSet];
      }
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
