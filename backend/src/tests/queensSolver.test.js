const { solveEightQueensSequential } = require("../algorithms/queens/sequentialSolver");
const { solveEightQueensThreaded } = require("../algorithms/queens/threadedSolver");

const normalize = (positions) => positions.join(",");

describe("Eight Queens solvers", () => {
  jest.setTimeout(15000);

  test("sequential solver finds 92 unique solutions", () => {
    const solutions = solveEightQueensSequential();
    const keys = new Set(solutions.map(normalize));
    expect(solutions.length).toBe(92);
    expect(keys.size).toBe(92);
  });

  test("threaded solver matches sequential results", async () => {
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
});

