const service = require("../services/games/snakeLadderService");

describe("Snake and Ladder Service", () => {
  describe("generateBoard", () => {
    test("should generate board with correct number of snakes and ladders for N=6", () => {
      const { snakes, ladders } = service.generateBoard(6);
      
      expect(Object.keys(ladders).length).toBe(4); // N-2 = 6-2 = 4
      expect(Object.keys(snakes).length).toBe(4); // N-2 = 6-2 = 4
    });

    test("should generate board with correct number of snakes and ladders for N=8", () => {
      const { snakes, ladders } = service.generateBoard(8);
      
      expect(Object.keys(ladders).length).toBe(6); // N-2 = 8-2 = 6
      expect(Object.keys(snakes).length).toBe(6); // N-2 = 8-2 = 6
    });

    test("should generate board with correct number of snakes and ladders for N=12", () => {
      const { snakes, ladders } = service.generateBoard(12);
      
      expect(Object.keys(ladders).length).toBe(10); // N-2 = 12-2 = 10
      expect(Object.keys(snakes).length).toBe(10); // N-2 = 12-2 = 10
    });

    test("should throw error for invalid board size (N < 6)", () => {
      expect(() => {
        service.generateBoard(5);
      }).toThrow("Board size must be between 6 and 12");
    });

    test("should throw error for invalid board size (N > 12)", () => {
      expect(() => {
        service.generateBoard(13);
      }).toThrow("Board size must be between 6 and 12");
    });

    test("should generate ladders where start < end", () => {
      const { ladders } = service.generateBoard(8);
      
      Object.entries(ladders).forEach(([start, end]) => {
        expect(parseInt(start)).toBeLessThan(parseInt(end));
      });
    });

    test("should generate snakes where start > end", () => {
      const { snakes } = service.generateBoard(8);
      
      Object.entries(snakes).forEach(([start, end]) => {
        expect(parseInt(start)).toBeGreaterThan(parseInt(end));
      });
    });

    test("should not have overlapping start/end positions", () => {
      const { snakes, ladders } = service.generateBoard(8);
      
      const allStarts = new Set([
        ...Object.keys(snakes),
        ...Object.keys(ladders)
      ]);
      const allEnds = new Set([
        ...Object.values(snakes),
        ...Object.values(ladders)
      ]);
      
      // Check for overlaps
      allStarts.forEach(start => {
        expect(allEnds.has(parseInt(start))).toBe(false);
      });
    });

    test("should not place snakes or ladders at cell 1 or last cell", () => {
      const { snakes, ladders } = service.generateBoard(8);
      const totalCells = 8 * 8;
      
      const allPositions = [
        ...Object.keys(snakes).map(Number),
        ...Object.values(snakes),
        ...Object.keys(ladders).map(Number),
        ...Object.values(ladders)
      ];
      
      expect(allPositions.includes(1)).toBe(false);
      expect(allPositions.includes(totalCells)).toBe(false);
    });
  });

  describe("BFS Algorithm", () => {
    test("should find minimum moves for simple board", () => {
      const snakes = {};
      const ladders = { 2: 15, 5: 7 };
      const totalCells = 6 * 6; // 36
      
      const minBoard = { ...snakes, ...ladders };
      const result = service.bfs(minBoard, totalCells);
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(36); // Maximum possible moves
    });

    test("should handle board with only ladders", () => {
      const snakes = {};
      const ladders = { 2: 10, 5: 15, 8: 20 };
      const totalCells = 6 * 6;
      
      const minBoard = { ...snakes, ...ladders };
      const result = service.bfs(minBoard, totalCells);
      
      expect(result).toBeGreaterThan(0);
    });

    test("should handle board with only snakes", () => {
      const snakes = { 20: 5, 15: 3, 10: 2 };
      const ladders = {};
      const totalCells = 6 * 6;
      
      const minBoard = { ...snakes, ...ladders };
      const result = service.bfs(minBoard, totalCells);
      
      expect(result).toBeGreaterThan(0);
    });

    test("should return -1 for impossible board (if applicable)", () => {
      // This test might not always fail, but tests the algorithm handles edge cases
      const snakes = {};
      const ladders = {};
      const totalCells = 6 * 6;
      
      const minBoard = { ...snakes, ...ladders };
      const result = service.bfs(minBoard, totalCells);
      
      // Even with no snakes/ladders, should be able to reach end
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("Bidirectional BFS Algorithm", () => {
    test("should find minimum moves for simple board", () => {
      const snakes = {};
      const ladders = { 2: 15, 5: 7 };
      const totalCells = 6 * 6;
      
      const minBoard = { ...snakes, ...ladders };
      const result = service.biBfs(minBoard, totalCells);
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(36);
    });

    test("should match BFS result for same board", () => {
      const snakes = { 20: 5 };
      const ladders = { 2: 15, 5: 7 };
      const totalCells = 6 * 6;
      
      const minBoard = { ...snakes, ...ladders };
      const bfsResult = service.bfs(minBoard, totalCells);
      const biBfsResult = service.biBfs(minBoard, totalCells);
      
      // Both should find the same minimum
      expect(bfsResult).toBe(biBfsResult);
    });

    test("should handle complex board configuration", () => {
      const snakes = { 20: 5, 15: 3 };
      const ladders = { 2: 10, 8: 18, 12: 25 };
      const totalCells = 6 * 6;
      
      const minBoard = { ...snakes, ...ladders };
      const result = service.biBfs(minBoard, totalCells);
      
      expect(result).toBeGreaterThan(0);
    });
  });

  describe("solveBoard", () => {
    test("should solve board and return both algorithm results", () => {
      const snakes = { 20: 5 };
      const ladders = { 2: 15, 5: 7 };
      const N = 6;
      
      const result = service.solveBoard(snakes, ladders, N);
      
      expect(result).toHaveProperty("bfs");
      expect(result).toHaveProperty("bfsTime");
      expect(result).toHaveProperty("biBfs");
      expect(result).toHaveProperty("biTime");
      
      expect(result.bfs).toBeGreaterThan(0);
      expect(result.biBfs).toBeGreaterThan(0);
      expect(result.bfsTime).toBeGreaterThanOrEqual(0);
      expect(result.biTime).toBeGreaterThanOrEqual(0);
    });

    test("should return same minimum moves from both algorithms", () => {
      const snakes = { 20: 5, 15: 3 };
      const ladders = { 2: 10, 8: 18 };
      const N = 8;
      
      const result = service.solveBoard(snakes, ladders, N);
      
      // Both algorithms should find the same minimum
      expect(result.bfs).toBe(result.biBfs);
    });

    test("should measure algorithm execution time", () => {
      const snakes = { 30: 5, 25: 3 };
      const ladders = { 2: 15, 8: 20, 12: 28 };
      const N = 8;
      
      const result = service.solveBoard(snakes, ladders, N);
      
      expect(typeof result.bfsTime).toBe("number");
      expect(typeof result.biTime).toBe("number");
      expect(result.bfsTime).toBeGreaterThanOrEqual(0);
      expect(result.biTime).toBeGreaterThanOrEqual(0);
    });

    test("should handle full game board generation and solving", () => {
      const N = 8;
      const { snakes, ladders } = service.generateBoard(N);
      const result = service.solveBoard(snakes, ladders, N);
      
      expect(result.bfs).toBeGreaterThan(0);
      expect(result.biBfs).toBeGreaterThan(0);
      expect(result.bfs).toBe(result.biBfs);
    });
  });

  describe("Integration Tests", () => {
    test("should generate and solve multiple boards correctly", () => {
      const sizes = [6, 8, 10, 12];
      
      sizes.forEach(N => {
        const { snakes, ladders } = service.generateBoard(N);
        const result = service.solveBoard(snakes, ladders, N);
        
        expect(result.bfs).toBeGreaterThan(0);
        expect(result.biBfs).toBeGreaterThan(0);
        expect(result.bfs).toBe(result.biBfs);
      });
    });

    test("should handle edge case: minimum board size", () => {
      const N = 6;
      const { snakes, ladders } = service.generateBoard(N);
      
      expect(Object.keys(ladders).length).toBe(4);
      expect(Object.keys(snakes).length).toBe(4);
      
      const result = service.solveBoard(snakes, ladders, N);
      expect(result.bfs).toBeGreaterThan(0);
    });

    test("should handle edge case: maximum board size", () => {
      const N = 12;
      const { snakes, ladders } = service.generateBoard(N);
      
      expect(Object.keys(ladders).length).toBe(10);
      expect(Object.keys(snakes).length).toBe(10);
      
      const result = service.solveBoard(snakes, ladders, N);
      expect(result.bfs).toBeGreaterThan(0);
    });
  });
});

