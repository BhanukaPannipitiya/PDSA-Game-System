const { solveEightQueensSequential } = require("../algorithms/queens/sequentialSolver");
const { solveEightQueensThreaded } = require("../algorithms/queens/threadedSolver");

const normalize = (positions) => positions.join(",");

describe("Eight Queens Solvers", () => {
  jest.setTimeout(15000);

  describe("Sequential Solver", () => {
    test("should find 92 unique solutions for 8x8 board", () => {
      const solutions = solveEightQueensSequential();
      const keys = new Set(solutions.map(normalize));
      expect(solutions.length).toBe(92);
      expect(keys.size).toBe(92);
    });

    test("should find 2 solutions for 4x4 board", () => {
      const solutions = solveEightQueensSequential(4);
      expect(solutions.length).toBe(2);
    });

    test("should find 10 solutions for 5x5 board", () => {
      const solutions = solveEightQueensSequential(5);
      expect(solutions.length).toBe(10);
    });

    test("should find 4 solutions for 1x1 board", () => {
      const solutions = solveEightQueensSequential(1);
      expect(solutions.length).toBe(1);
    });

    test("should find 0 solutions for 2x2 board", () => {
      const solutions = solveEightQueensSequential(2);
      expect(solutions.length).toBe(0);
    });

    test("should find 0 solutions for 3x3 board", () => {
      const solutions = solveEightQueensSequential(3);
      expect(solutions.length).toBe(0);
    });

    test("should return valid solution format (array of arrays)", () => {
      const solutions = solveEightQueensSequential(4);
      expect(Array.isArray(solutions)).toBe(true);
      solutions.forEach((solution) => {
        expect(Array.isArray(solution)).toBe(true);
        expect(solution.length).toBe(4);
      });
    });

    test("should return solutions with valid column indices", () => {
      const solutions = solveEightQueensSequential(4);
      solutions.forEach((solution) => {
        solution.forEach((col) => {
          expect(col).toBeGreaterThanOrEqual(0);
          expect(col).toBeLessThan(4);
          expect(Number.isInteger(col)).toBe(true);
        });
      });
    });

    test("should return solutions with no duplicate columns per solution", () => {
      const solutions = solveEightQueensSequential(4);
      solutions.forEach((solution) => {
        const uniqueCols = new Set(solution);
        expect(uniqueCols.size).toBe(solution.length);
      });
    });

    test("should return solutions with no diagonal conflicts", () => {
      const solutions = solveEightQueensSequential(4);
      solutions.forEach((solution) => {
        for (let i = 0; i < solution.length; i += 1) {
          for (let j = i + 1; j < solution.length; j += 1) {
            const rowDiff = Math.abs(i - j);
            const colDiff = Math.abs(solution[i] - solution[j]);
            expect(rowDiff).not.toBe(colDiff);
          }
        }
      });
    });
  });

  describe("Threaded Solver", () => {
    test("should find 92 unique solutions for 8x8 board", async () => {
      const result = await solveEightQueensThreaded();
      const keys = new Set(result.solutions.map(normalize));
      expect(result.solutions.length).toBe(92);
      expect(keys.size).toBe(92);
    });

    test("should match sequential solver results", async () => {
      const sequential = solveEightQueensSequential();
      const threaded = await solveEightQueensThreaded();
      const sequentialKeys = new Set(sequential.map(normalize));
      const threadedKeys = new Set(threaded.solutions.map(normalize));

      expect(threaded.solutions.length).toBe(92);
      expect(threadedKeys.size).toBe(92);
      sequentialKeys.forEach((key) => {
        expect(threadedKeys.has(key)).toBe(true);
      });
    });

    test("should return time measurement", async () => {
      const result = await solveEightQueensThreaded();
      expect(result).toHaveProperty("timeMs");
      expect(typeof result.timeMs).toBe("number");
      expect(result.timeMs).toBeGreaterThanOrEqual(0);
    });

    test("should handle different board sizes", async () => {
      const result4 = await solveEightQueensThreaded(4);
      expect(result4.solutions.length).toBe(2);

      const result5 = await solveEightQueensThreaded(5);
      expect(result5.solutions.length).toBe(10);
    });

    test("should return valid solution format", async () => {
      const result = await solveEightQueensThreaded(4);
      expect(Array.isArray(result.solutions)).toBe(true);
      result.solutions.forEach((solution) => {
        expect(Array.isArray(solution)).toBe(true);
        expect(solution.length).toBe(4);
      });
    });

    test("should return solutions with no conflicts", async () => {
      const result = await solveEightQueensThreaded(4);
      result.solutions.forEach((solution) => {
        // Check no duplicate columns
        const uniqueCols = new Set(solution);
        expect(uniqueCols.size).toBe(solution.length);

        // Check no diagonal conflicts
        for (let i = 0; i < solution.length; i += 1) {
          for (let j = i + 1; j < solution.length; j += 1) {
            const rowDiff = Math.abs(i - j);
            const colDiff = Math.abs(solution[i] - solution[j]);
            expect(rowDiff).not.toBe(colDiff);
          }
        }
      });
    });
  });

  describe("Solution Validation", () => {
    test("all solutions should be valid (no two queens attack each other)", () => {
      const solutions = solveEightQueensSequential();
      solutions.forEach((solution) => {
        // Check rows (each row has exactly one queen - guaranteed by algorithm)
        expect(solution.length).toBe(8);

        // Check columns (no two queens in same column)
        const cols = new Set(solution);
        expect(cols.size).toBe(8);

        // Check diagonals
        for (let i = 0; i < solution.length; i += 1) {
          for (let j = i + 1; j < solution.length; j += 1) {
            const rowDiff = Math.abs(i - j);
            const colDiff = Math.abs(solution[i] - solution[j]);
            expect(rowDiff).not.toBe(colDiff);
          }
        }
      });
    });

    test("solutions should be unique", () => {
      const solutions = solveEightQueensSequential();
      const keys = solutions.map(normalize);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });
});

