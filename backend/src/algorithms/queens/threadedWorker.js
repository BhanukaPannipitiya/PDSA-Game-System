const { parentPort, workerData } = require("worker_threads");

function solvePartial(size, firstCol) {
  const solutions = [];
  const cols = new Set([firstCol]);
  const diag1 = new Set([0 - firstCol]); // row - col for row 0
  const diag2 = new Set([0 + firstCol]); // row + col for row 0
  const current = new Array(size);
  current[0] = firstCol;

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

  backtrack(1); // start from row 1 because row 0 is fixed
  return solutions;
}

const { size, firstCol } = workerData;
const solutions = solvePartial(size, firstCol);
parentPort.postMessage({ solutions });

