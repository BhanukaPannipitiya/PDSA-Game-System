/**
 * Recursive Solution for Tower of Hanoi with 3 Pegs
 * Classic recursive approach using divide and conquer
 * Time Complexity: O(2^n) where n is the number of disks
 * Space Complexity: O(n) for recursion stack
 * @param {number} n - Number of disks
 * @param {string} source - Source peg name
 * @param {string} destination - Destination peg name
 * @param {string} auxiliary - Auxiliary peg name
 * @returns {Array<string>} Array of moves in format "source -> destination"
 */
function recursive3Pegs(n, source, destination, auxiliary) {
  const moves = [];
  
  function solve(n, src, dest, aux) {
    if (n === 1) {
      moves.push(`${src} -> ${dest}`);
      return;
    }
    solve(n - 1, src, aux, dest);
    moves.push(`${src} -> ${dest}`);
    solve(n - 1, aux, dest, src);
  }
  
  solve(n, source, destination, auxiliary);
  return moves;
}

module.exports = {
  recursive3Pegs,
};

