/**
 * BFS Algorithm for Snake and Ladder
 * Finds the minimum number of moves to reach the end using Breadth-First Search
 * Time Complexity: O(V + E) where V is total cells and E is edges (dice moves)
 * Space Complexity: O(V) for visited array and queue
 * @param {Object} minBoard - Board mapping with snakes and ladders
 * @param {number} totalCells - Total number of cells on the board
 * @returns {number} Minimum number of moves, or -1 if no solution
 */
function bfs(minBoard, totalCells) {
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

module.exports = {
  bfs,
};

