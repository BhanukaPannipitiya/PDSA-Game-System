/**
 * Calculate minimum moves required for Tower of Hanoi
 * @param {number} n - Number of disks
 * @param {number} numPegs - Number of pegs (3 or 4)
 * @returns {number} Minimum number of moves required
 */
function calculateMinMoves(n, numPegs) {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  
  if (numPegs === 3) {
    return Math.pow(2, n) - 1;
  } else if (numPegs === 4) {
    // Frame-Stewart formula approximation
    const k = Math.max(1, Math.min(n - 1, Math.ceil(n - Math.sqrt(2 * n + 1) + 1)));
    return 2 * calculateMinMoves(k, 4) + Math.pow(2, n - k) - 1;
  }
  return 0;
}

module.exports = {
  calculateMinMoves,
};

