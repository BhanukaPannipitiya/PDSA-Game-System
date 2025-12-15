const { performance } = require("perf_hooks");
const { bruteForceTSP } = require("../../algorithms/tsp/bruteForce");
const { nearestNeighborTSP } = require("../../algorithms/tsp/nearestNeighbor");
const { dynamicProgrammingTSP } = require("../../algorithms/tsp/dynamicProgramming");

class TSPService {
  /**
   * Generate cities A to J
   * @returns {Array} Array of city names
   */
  generateCities() {
    return ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  }

  /**
   * Generate distance matrix with random distances between 50-100 km
   * @param {Array} cities - Array of city names
   * @returns {Object} Distance matrix as nested object
   */
  generateDistanceMatrix(cities) {
    const matrix = {};
    
    for (let i = 0; i < cities.length; i++) {
      matrix[cities[i]] = {};
      for (let j = 0; j < cities.length; j++) {
        if (i === j) {
          matrix[cities[i]][cities[j]] = 0; // Distance to self is 0
        } else {
          // Random distance between 50-100 km
          matrix[cities[i]][cities[j]] = Math.floor(Math.random() * 51) + 50;
        }
      }
    }

    return matrix;
  }

  /**
   * Select a random home city
   * @param {Array} cities - Array of city names
   * @returns {string} Random home city
   */
  selectHomeCity(cities) {
    return cities[Math.floor(Math.random() * cities.length)];
  }

  /**
   * Calculate total distance of a route
   * @param {Array} route - Array of city names in order
   * @param {Object} distanceMatrix - Distance matrix
   * @returns {number} Total distance
   */
  calculateRouteDistance(route, distanceMatrix) {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += distanceMatrix[route[i]][route[i + 1]];
    }
    return totalDistance;
  }

  /**
   * Solve TSP using all three algorithms and measure execution time
   * @param {string} homeCity - Starting and ending city
   * @param {Array} citiesToVisit - Cities selected by user
   * @param {Object} distanceMatrix - Distance matrix
   * @returns {Object} Results from all algorithms with execution times
   */
  solveTSP(homeCity, citiesToVisit, distanceMatrix) {
    // Validate inputs
    if (!homeCity || !citiesToVisit || !distanceMatrix) {
      throw new Error("Invalid input parameters");
    }

    if (!Array.isArray(citiesToVisit)) {
      throw new Error("citiesToVisit must be an array");
    }

    // Remove duplicates from citiesToVisit
    const uniqueCities = [...new Set(citiesToVisit)];
    
    // Validate that all cities exist in distance matrix
    const allCities = Object.keys(distanceMatrix);
    for (const city of uniqueCities) {
      if (!allCities.includes(city)) {
        throw new Error(`City ${city} not found in distance matrix`);
      }
    }

    if (uniqueCities.includes(homeCity)) {
      throw new Error("Home city should not be in cities to visit");
    }

    const results = {};

    // Algorithm 1: Brute Force
    // Only use for small problems (n <= 7) to avoid performance issues
    if (uniqueCities.length <= 7) {
      const start1 = performance.now();
      const bruteForceResult = bruteForceTSP(homeCity, uniqueCities, distanceMatrix);
      const end1 = performance.now();
      results.bruteForce = {
        ...bruteForceResult,
        time: end1 - start1,
      };
    } else {
      results.bruteForce = {
        route: null,
        distance: null,
        time: null,
        note: "Skipped: Too many cities for brute force (n > 7)",
      };
    }

    // Algorithm 2: Nearest Neighbor
    const start2 = performance.now();
    const nearestNeighborResult = nearestNeighborTSP(homeCity, uniqueCities, distanceMatrix);
    const end2 = performance.now();
    results.nearestNeighbor = {
      ...nearestNeighborResult,
      time: end2 - start2,
    };

    // Algorithm 3: Dynamic Programming
    // Only use for medium problems (n <= 15) due to memory constraints
    if (uniqueCities.length <= 15) {
      const start3 = performance.now();
      const dpResult = dynamicProgrammingTSP(homeCity, uniqueCities, distanceMatrix);
      const end3 = performance.now();
      results.dynamicProgramming = {
        ...dpResult,
        time: end3 - start3,
      };
    } else {
      results.dynamicProgramming = {
        route: null,
        distance: null,
        time: null,
        note: "Skipped: Too many cities for DP (n > 15)",
      };
    }

    // Find the shortest distance (optimal solution)
    const distances = [
      results.bruteForce.distance,
      results.nearestNeighbor.distance,
      results.dynamicProgramming.distance,
    ].filter((d) => d !== null && d !== undefined);

    const shortestDistance = Math.min(...distances);

    return {
      ...results,
      shortestDistance,
    };
  }

  /**
   * Get complexity analysis for each algorithm
   * @returns {Object} Complexity information
   */
  getComplexityAnalysis() {
    return {
      bruteForce: {
        time: "O(n!)",
        space: "O(n)",
        description: "Generates all possible permutations and checks each one. Exponential time complexity makes it impractical for large problems.",
      },
      nearestNeighbor: {
        time: "O(n²)",
        space: "O(n)",
        description: "Greedy heuristic that always picks the nearest unvisited city. Fast but may not find optimal solution.",
      },
      dynamicProgramming: {
        time: "O(2^n * n²)",
        space: "O(2^n * n)",
        description: "Uses memoization to avoid recalculating subproblems. Finds optimal solution but requires exponential space.",
      },
    };
  }
}

module.exports = new TSPService();
