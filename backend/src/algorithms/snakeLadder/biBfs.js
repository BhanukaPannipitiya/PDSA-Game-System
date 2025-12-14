/**
 * Bidirectional BFS Algorithm for Snake and Ladder
 * Finds the minimum number of moves using bidirectional search from both start and end
 * Time Complexity: O(V + E) but typically faster than unidirectional BFS
 * Space Complexity: O(V) for visited sets and queues
 * @param {Object} minBoard - Board mapping with snakes and ladders
 * @param {number} totalCells - Total number of cells on the board
 * @returns {number} Minimum number of moves, or -1 if no solution
 */
function biBfs(minBoard, totalCells) {
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

module.exports = {
  biBfs,
};

