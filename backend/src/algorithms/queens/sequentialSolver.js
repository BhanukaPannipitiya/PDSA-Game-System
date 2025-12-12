/**
 * Sequential backtracking solver for the classic Eight Queens puzzle.
 * Returns an array of solutions; each solution is an array of column
 * indices where the index represents the row (0..7).
 */
function solveEightQueensSequential(size = 8) {
  const solutions = [];
  const cols = new Set();
  const diag1 = new Set(); // row - col
  const diag2 = new Set(); // row + col
  const current = new Array(size);

  const backtrack = (row) => {
    if (row === size) {
      solutions.push([...current]);
      return;
    }

    for (let col = 0; col < size; col += 1) {
      const d1 = row - col;
      const d2 = row + col;
      if (cols.has(col) || diag1.has(d1) || diag2.has(d2)) continue;

      cols.add(col);
      diag1.add(d1);
      diag2.add(d2);
      current[row] = col;

      backtrack(row + 1);

      cols.delete(col);
      diag1.delete(d1);
      diag2.delete(d2);
    }
  };

  backtrack(0);
  return solutions;
}

module.exports = {
  solveEightQueensSequential,
};

