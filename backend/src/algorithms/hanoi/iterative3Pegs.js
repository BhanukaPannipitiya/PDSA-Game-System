/**
 * Iterative Solution for Tower of Hanoi with 3 Pegs
 * Uses iterative approach with peg simulation
 * Time Complexity: O(2^n) where n is the number of disks
 * Space Complexity: O(n) for peg arrays
 * @param {number} n - Number of disks
 * @param {string} source - Source peg name
 * @param {string} destination - Destination peg name
 * @param {string} auxiliary - Auxiliary peg name
 * @returns {Array<string>} Array of moves in format "source -> destination"
 */
function iterative3Pegs(n, source, destination, auxiliary) {
  const moves = [];
  const totalMoves = Math.pow(2, n) - 1;
  
  const pegs = { A: [], B: [], C: [] };
  for (let i = n; i >= 1; i--) {
    pegs[source].push(i);
  }
  
  const pegNames = [source, auxiliary, destination];
  if (n % 2 === 0) {
    [pegNames[1], pegNames[2]] = [pegNames[2], pegNames[1]];
  }
  
  for (let i = 1; i <= totalMoves; i++) {
    if (i % 3 === 1) {
      moveDisk(pegs, pegNames[0], pegNames[2], moves);
    } else if (i % 3 === 2) {
      moveDisk(pegs, pegNames[0], pegNames[1], moves);
    } else {
      moveDisk(pegs, pegNames[1], pegNames[2], moves);
    }
  }
  
  return moves;
}

/**
 * Helper function to move a disk between pegs
 * @param {Object} pegs - Object containing peg arrays
 * @param {string} from - Source peg name
 * @param {string} to - Destination peg name
 * @param {Array<string>} moves - Array to store moves
 */
function moveDisk(pegs, from, to, moves) {
  if (pegs[from].length === 0) {
    [from, to] = [to, from];
  } else if (pegs[to].length === 0) {
    // Move from 'from' to 'to'
  } else if (pegs[from][pegs[from].length - 1] > pegs[to][pegs[to].length - 1]) {
    [from, to] = [to, from];
  }
  
  const disk = pegs[from].pop();
  pegs[to].push(disk);
  moves.push(`${from} -> ${to}`);
}

module.exports = {
  iterative3Pegs,
};

