const {
  recursive3Pegs,
  iterative3Pegs,
  frameStewart4Pegs,
  calculateMinMoves
} = require('../utils/hanoiAlgorithms');

describe('Tower of Hanoi Algorithms', () => {
  
  test('Recursive 3 Pegs - 3 disks should give 7 moves', () => {
    const moves = recursive3Pegs(3, 'A', 'C', 'B');
    expect(moves.length).toBe(7);
  });
  
  test('Recursive 3 Pegs - moves should be valid', () => {
    const moves = recursive3Pegs(3, 'A', 'C', 'B');
    expect(moves[0]).toBe('A -> C');
    expect(moves[moves.length - 1]).toContain('C');
  });
  
  test('Iterative 3 Pegs - 3 disks should give 7 moves', () => {
    const moves = iterative3Pegs(3, 'A', 'C', 'B');
    expect(moves.length).toBe(7);
  });
  
  test('Iterative and Recursive should give same number of moves', () => {
    const recursiveMoves = recursive3Pegs(5, 'A', 'D', 'B');
    const iterativeMoves = iterative3Pegs(5, 'A', 'D', 'B');
    expect(recursiveMoves.length).toBe(iterativeMoves.length);
  });
  
  test('Frame-Stewart 4 Pegs should give fewer moves than 3 pegs', () => {
    const moves3Pegs = recursive3Pegs(5, 'A', 'D', 'B');
    const moves4Pegs = frameStewart4Pegs(5, 'A', 'D', 'B', 'C');
    expect(moves4Pegs.length).toBeLessThan(moves3Pegs.length);
  });
  
  test('Calculate min moves - 3 pegs formula', () => {
    const minMoves = calculateMinMoves(3, 3);
    expect(minMoves).toBe(7); // 2^3 - 1
  });
  
  test('Calculate min moves - 5 disks 3 pegs', () => {
    const minMoves = calculateMinMoves(5, 3);
    expect(minMoves).toBe(31); // 2^5 - 1
  });
  
  test('Moves should start from source and end at destination', () => {
    const moves = recursive3Pegs(3, 'A', 'D', 'B');
    expect(moves[0]).toContain('A');
    expect(moves[moves.length - 1]).toContain('D');
  });
});