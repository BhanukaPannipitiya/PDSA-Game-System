/**
 * Iterative Frame-Stewart Algorithm for Tower of Hanoi with 4 Pegs
 * Iterative implementation using stack-based simulation
 * Time Complexity: O(2^(n^(1/2))) approximately
 * Space Complexity: O(n) for stack
 * @param {number} n - Number of disks
 * @param {string} source - Source peg name
 * @param {string} destination - Destination peg name
 * @param {string} aux1 - First auxiliary peg name
 * @param {string} aux2 - Second auxiliary peg name
 * @returns {Array<string>} Array of moves in format "source -> destination"
 */
function iterativeFrameStewart4Pegs(n, source, destination, aux1, aux2) {
  // Simplified iterative approach using stack-based simulation
  const moves = [];
  const stack = [];
  
  stack.push({
    n: n,
    src: source,
    dest: destination,
    aux1: aux1,
    aux2: aux2,
    phase: 0
  });
  
  while (stack.length > 0) {
    const task = stack.pop();
    
    if (task.n === 0) continue;
    
    if (task.n === 1) {
      moves.push(`${task.src} -> ${task.dest}`);
      continue;
    }
    
    const k = Math.ceil(task.n - Math.sqrt(2 * task.n + 1) + 1);
    
    if (task.phase === 0) {
      // Push tasks in reverse order
      task.phase = 1;
      stack.push(task);
      
      // Move k disks from aux1 to dest
      stack.push({
        n: k,
        src: task.aux1,
        dest: task.dest,
        aux1: task.src,
        aux2: task.aux2,
        phase: 0
      });
    } else if (task.phase === 1) {
      task.phase = 2;
      stack.push(task);
      
      // Move n-k disks from src to dest using 3 pegs
      solve3PegsIterative(task.n - k, task.src, task.dest, task.aux2, moves);
    } else if (task.phase === 2) {
      // Move top k disks from src to aux1
      stack.push({
        n: k,
        src: task.src,
        dest: task.aux1,
        aux1: task.aux2,
        aux2: task.dest,
        phase: 0
      });
    }
  }
  
  return moves;
}

/**
 * Helper function for iterative 3-peg solution
 * @param {number} n - Number of disks
 * @param {string} src - Source peg name
 * @param {string} dest - Destination peg name
 * @param {string} aux - Auxiliary peg name
 * @param {Array<string>} moves - Array to store moves
 */
function solve3PegsIterative(n, src, dest, aux, moves) {
  const totalMoves = Math.pow(2, n) - 1;
  const pegs = { A: [], B: [], C: [], D: [] };
  
  for (let i = n; i >= 1; i--) {
    pegs[src].push(i);
  }
  
  const pegNames = [src, aux, dest];
  if (n % 2 === 0) {
    [pegNames[1], pegNames[2]] = [pegNames[2], pegNames[1]];
  }
  
  for (let i = 1; i <= totalMoves; i++) {
    if (i % 3 === 1) {
      moveDiskHelper(pegs, pegNames[0], pegNames[2], moves);
    } else if (i % 3 === 2) {
      moveDiskHelper(pegs, pegNames[0], pegNames[1], moves);
    } else {
      moveDiskHelper(pegs, pegNames[1], pegNames[2], moves);
    }
  }
}

/**
 * Helper function to move a disk between pegs
 * @param {Object} pegs - Object containing peg arrays
 * @param {string} from - Source peg name
 * @param {string} to - Destination peg name
 * @param {Array<string>} moves - Array to store moves
 */
function moveDiskHelper(pegs, from, to, moves) {
  if (pegs[from].length === 0) {
    [from, to] = [to, from];
  } else if (pegs[to].length === 0) {
    // Keep as is
  } else if (pegs[from][pegs[from].length - 1] > pegs[to][pegs[to].length - 1]) {
    [from, to] = [to, from];
  }
  
  const disk = pegs[from].pop();
  pegs[to].push(disk);
  moves.push(`${from} -> ${to}`);
}

module.exports = {
  iterativeFrameStewart4Pegs,
};

