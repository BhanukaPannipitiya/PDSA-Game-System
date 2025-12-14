/**
 * Frame-Stewart Algorithm for Tower of Hanoi with 4 Pegs (Recursive)
 * Optimal recursive solution for 4-peg Tower of Hanoi
 * Time Complexity: O(2^(n^(1/2))) approximately
 * Space Complexity: O(n) for recursion stack
 * @param {number} n - Number of disks
 * @param {string} source - Source peg name
 * @param {string} destination - Destination peg name
 * @param {string} aux1 - First auxiliary peg name
 * @param {string} aux2 - Second auxiliary peg name
 * @returns {Array<string>} Array of moves in format "source -> destination"
 */
function frameStewart4Pegs(n, source, destination, aux1, aux2) {
  const moves = [];
  
  function solve(n, src, dest, aux1, aux2) {
    if (n === 0) return;
    if (n === 1) {
      moves.push(`${src} -> ${dest}`);
      return;
    }
    
    // Optimal k value (approximation)
    const k = Math.ceil(n - Math.sqrt(2 * n + 1) + 1);
    
    // Move top k disks from source to aux1 using all 4 pegs
    solve(k, src, aux1, aux2, dest);
    
    // Move remaining n-k disks from source to destination using 3 pegs
    solve3Pegs(n - k, src, dest, aux2, moves);
    
    // Move k disks from aux1 to destination using all 4 pegs
    solve(k, aux1, dest, src, aux2);
  }
  
  function solve3Pegs(n, src, dest, aux, movesList) {
    if (n === 1) {
      movesList.push(`${src} -> ${dest}`);
      return;
    }
    solve3Pegs(n - 1, src, aux, dest, movesList);
    movesList.push(`${src} -> ${dest}`);
    solve3Pegs(n - 1, aux, dest, src, movesList);
  }
  
  solve(n, source, destination, aux1, aux2);
  return moves;
}

module.exports = {
  frameStewart4Pegs,
};

