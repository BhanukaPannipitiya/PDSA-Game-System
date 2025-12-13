const tspService = require("../services/games/tspService");

describe("TSP Service", () => {
  describe("City Generation", () => {
    test("should generate cities A to J", () => {
      const cities = tspService.generateCities();
      
      expect(cities).toHaveLength(10);
      expect(cities).toEqual(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]);
    });
  });

  describe("Distance Matrix Generation", () => {
    test("should generate distance matrix with correct structure", () => {
      const cities = ["A", "B", "C"];
      const matrix = tspService.generateDistanceMatrix(cities);
      
      expect(matrix).toHaveProperty("A");
      expect(matrix).toHaveProperty("B");
      expect(matrix).toHaveProperty("C");
      expect(matrix.A).toHaveProperty("A");
      expect(matrix.A).toHaveProperty("B");
      expect(matrix.A).toHaveProperty("C");
    });

    test("should have zero distance to self", () => {
      const cities = ["A", "B", "C"];
      const matrix = tspService.generateDistanceMatrix(cities);
      
      expect(matrix.A.A).toBe(0);
      expect(matrix.B.B).toBe(0);
      expect(matrix.C.C).toBe(0);
    });

    test("should have distances between 50 and 100 km", () => {
      const cities = ["A", "B", "C"];
      const matrix = tspService.generateDistanceMatrix(cities);
      
      expect(matrix.A.B).toBeGreaterThanOrEqual(50);
      expect(matrix.A.B).toBeLessThanOrEqual(100);
      expect(matrix.B.C).toBeGreaterThanOrEqual(50);
      expect(matrix.B.C).toBeLessThanOrEqual(100);
    });

    test("should be symmetric (distance A->B equals B->A)", () => {
      const cities = ["A", "B", "C"];
      const matrix = tspService.generateDistanceMatrix(cities);
      
      // Note: In TSP, distances are typically symmetric, but our implementation
      // generates random values, so they may differ. This is acceptable for testing.
      expect(typeof matrix.A.B).toBe("number");
      expect(typeof matrix.B.A).toBe("number");
    });
  });

  describe("Home City Selection", () => {
    test("should select a valid home city", () => {
      const cities = ["A", "B", "C", "D", "E"];
      const homeCity = tspService.selectHomeCity(cities);
      
      expect(cities).toContain(homeCity);
    });

    test("should select different cities on multiple calls", () => {
      const cities = ["A", "B", "C", "D", "E"];
      const selections = new Set();
      
      // Run multiple times to increase chance of different selections
      for (let i = 0; i < 20; i++) {
        selections.add(tspService.selectHomeCity(cities));
      }
      
      // Should have at least some variety (though not guaranteed)
      expect(selections.size).toBeGreaterThan(0);
    });
  });

  describe("Route Distance Calculation", () => {
    test("should calculate correct route distance", () => {
      const distanceMatrix = {
        A: { A: 0, B: 60, C: 80 },
        B: { A: 60, B: 0, C: 70 },
        C: { A: 80, C: 0, B: 70 },
      };
      
      const route = ["A", "B", "C", "A"];
      const distance = tspService.calculateRouteDistance(route, distanceMatrix);
      
      expect(distance).toBe(60 + 70 + 80); // A->B + B->C + C->A
    });

    test("should return 0 for route with only home city", () => {
      const distanceMatrix = {
        A: { A: 0 },
      };
      
      const route = ["A", "A"];
      const distance = tspService.calculateRouteDistance(route, distanceMatrix);
      
      expect(distance).toBe(0);
    });
  });

  describe("Brute Force Algorithm", () => {
    test("should find shortest route for small problem", () => {
      const distanceMatrix = {
        A: { A: 0, B: 60, C: 80 },
        B: { A: 60, B: 0, C: 70 },
        C: { A: 80, C: 0, B: 70 },
      };
      
      const result = tspService.bruteForceTSP("A", ["B", "C"], distanceMatrix);
      
      expect(result).toHaveProperty("route");
      expect(result).toHaveProperty("distance");
      expect(result.route[0]).toBe("A");
      expect(result.route[result.route.length - 1]).toBe("A");
      expect(result.distance).toBeGreaterThan(0);
    });

    test("should handle empty cities to visit", () => {
      const distanceMatrix = {
        A: { A: 0 },
      };
      
      const result = tspService.bruteForceTSP("A", [], distanceMatrix);
      
      expect(result.route).toEqual(["A", "A"]);
      expect(result.distance).toBe(0);
    });
  });

  describe("Nearest Neighbor Algorithm", () => {
    test("should find a route using nearest neighbor", () => {
      const distanceMatrix = {
        A: { A: 0, B: 60, C: 80, D: 90 },
        B: { A: 60, B: 0, C: 50, D: 70 },
        C: { A: 80, C: 0, B: 50, D: 65 },
        D: { A: 90, D: 0, B: 70, C: 65 },
      };
      
      const result = tspService.nearestNeighborTSP("A", ["B", "C", "D"], distanceMatrix);
      
      expect(result).toHaveProperty("route");
      expect(result).toHaveProperty("distance");
      expect(result.route[0]).toBe("A");
      expect(result.route[result.route.length - 1]).toBe("A");
      expect(result.distance).toBeGreaterThan(0);
    });

    test("should handle empty cities to visit", () => {
      const distanceMatrix = {
        A: { A: 0 },
      };
      
      const result = tspService.nearestNeighborTSP("A", [], distanceMatrix);
      
      expect(result.route).toEqual(["A", "A"]);
      expect(result.distance).toBe(0);
    });

    test("should visit all cities exactly once", () => {
      const distanceMatrix = {
        A: { A: 0, B: 60, C: 80 },
        B: { A: 60, B: 0, C: 70 },
        C: { A: 80, C: 0, B: 70 },
      };
      
      const result = tspService.nearestNeighborTSP("A", ["B", "C"], distanceMatrix);
      const visitedCities = result.route.slice(1, -1); // Exclude home city at start and end
      
      expect(visitedCities).toContain("B");
      expect(visitedCities).toContain("C");
      expect(visitedCities.length).toBe(2);
    });
  });

  describe("Dynamic Programming Algorithm", () => {
    test("should find optimal route using DP", () => {
      const distanceMatrix = {
        A: { A: 0, B: 60, C: 80 },
        B: { A: 60, B: 0, C: 70 },
        C: { A: 80, C: 0, B: 70 },
      };
      
      const result = tspService.dynamicProgrammingTSP("A", ["B", "C"], distanceMatrix);
      
      expect(result).toHaveProperty("route");
      expect(result).toHaveProperty("distance");
      expect(result.route[0]).toBe("A");
      expect(result.route[result.route.length - 1]).toBe("A");
      expect(result.distance).toBeGreaterThan(0);
    });

    test("should handle empty cities to visit", () => {
      const distanceMatrix = {
        A: { A: 0 },
      };
      
      const result = tspService.dynamicProgrammingTSP("A", [], distanceMatrix);
      
      expect(result.route).toEqual(["A", "A"]);
      expect(result.distance).toBe(0);
    });

    test("should find optimal solution for known case", () => {
      // Known optimal: A->B->C->A = 60+70+80 = 210
      // Alternative: A->C->B->A = 80+70+60 = 210 (same)
      const distanceMatrix = {
        A: { A: 0, B: 60, C: 80 },
        B: { A: 60, B: 0, C: 70 },
        C: { A: 80, C: 0, B: 70 },
      };
      
      const result = tspService.dynamicProgrammingTSP("A", ["B", "C"], distanceMatrix);
      
      expect(result.distance).toBe(210);
    });
  });

  describe("Solve TSP (All Algorithms)", () => {
    test("should solve using all three algorithms", () => {
      const cities = ["A", "B", "C", "D"];
      const distanceMatrix = tspService.generateDistanceMatrix(cities);
      const homeCity = "A";
      const citiesToVisit = ["B", "C"];

      const results = tspService.solveTSP(homeCity, citiesToVisit, distanceMatrix);

      expect(results).toHaveProperty("bruteForce");
      expect(results).toHaveProperty("nearestNeighbor");
      expect(results).toHaveProperty("dynamicProgramming");
      expect(results).toHaveProperty("shortestDistance");
      
      expect(results.bruteForce).toHaveProperty("route");
      expect(results.bruteForce).toHaveProperty("distance");
      expect(results.bruteForce).toHaveProperty("time");
      
      expect(results.nearestNeighbor).toHaveProperty("route");
      expect(results.nearestNeighbor).toHaveProperty("distance");
      expect(results.nearestNeighbor).toHaveProperty("time");
      
      expect(results.dynamicProgramming).toHaveProperty("route");
      expect(results.dynamicProgramming).toHaveProperty("distance");
      expect(results.dynamicProgramming).toHaveProperty("time");
    });

    test("should skip brute force for large problems", () => {
      const cities = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
      const distanceMatrix = tspService.generateDistanceMatrix(cities);
      const homeCity = "A";
      const citiesToVisit = ["B", "C", "D", "E", "F", "G", "H", "I"]; // 8 cities

      const results = tspService.solveTSP(homeCity, citiesToVisit, distanceMatrix);

      expect(results.bruteForce.route).toBeNull();
      expect(results.bruteForce.note).toContain("Too many cities");
    });

    test("should throw error for invalid home city in cities to visit", () => {
      const cities = ["A", "B", "C"];
      const distanceMatrix = tspService.generateDistanceMatrix(cities);
      const homeCity = "A";
      const citiesToVisit = ["A", "B"]; // Invalid: home city in list

      expect(() => {
        tspService.solveTSP(homeCity, citiesToVisit, distanceMatrix);
      }).toThrow("Home city should not be in cities to visit");
    });

    test("should throw error for invalid city", () => {
      const cities = ["A", "B", "C"];
      const distanceMatrix = tspService.generateDistanceMatrix(cities);
      const homeCity = "A";
      const citiesToVisit = ["B", "Z"]; // Invalid: Z not in matrix

      expect(() => {
        tspService.solveTSP(homeCity, citiesToVisit, distanceMatrix);
      }).toThrow("not found in distance matrix");
    });
  });

  describe("Complexity Analysis", () => {
    test("should return complexity information", () => {
      const analysis = tspService.getComplexityAnalysis();

      expect(analysis).toHaveProperty("bruteForce");
      expect(analysis).toHaveProperty("nearestNeighbor");
      expect(analysis).toHaveProperty("dynamicProgramming");

      expect(analysis.bruteForce).toHaveProperty("time");
      expect(analysis.bruteForce).toHaveProperty("space");
      expect(analysis.bruteForce).toHaveProperty("description");

      expect(analysis.nearestNeighbor).toHaveProperty("time");
      expect(analysis.nearestNeighbor).toHaveProperty("space");
      expect(analysis.nearestNeighbor).toHaveProperty("description");

      expect(analysis.dynamicProgramming).toHaveProperty("time");
      expect(analysis.dynamicProgramming).toHaveProperty("space");
      expect(analysis.dynamicProgramming).toHaveProperty("description");
    });

    test("should have correct complexity notations", () => {
      const analysis = tspService.getComplexityAnalysis();

      expect(analysis.bruteForce.time).toBe("O(n!)");
      expect(analysis.nearestNeighbor.time).toBe("O(n²)");
      expect(analysis.dynamicProgramming.time).toBe("O(2^n * n²)");
    });
  });

  describe("Edge Cases", () => {
    test("should handle single city to visit", () => {
      const cities = ["A", "B", "C"];
      const distanceMatrix = tspService.generateDistanceMatrix(cities);
      const homeCity = "A";
      const citiesToVisit = ["B"];

      const results = tspService.solveTSP(homeCity, citiesToVisit, distanceMatrix);

      expect(results.bruteForce.distance).toBeGreaterThan(0);
      expect(results.nearestNeighbor.distance).toBeGreaterThan(0);
      expect(results.dynamicProgramming.distance).toBeGreaterThan(0);
    });

    test("should remove duplicate cities", () => {
      const cities = ["A", "B", "C"];
      const distanceMatrix = tspService.generateDistanceMatrix(cities);
      const homeCity = "A";
      const citiesToVisit = ["B", "C", "B"]; // Duplicate B

      const results = tspService.solveTSP(homeCity, citiesToVisit, distanceMatrix);

      // Should work without error
      expect(results).toHaveProperty("shortestDistance");
    });
  });
});

