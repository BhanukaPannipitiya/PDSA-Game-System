const { performance } = require("perf_hooks");

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
   * Algorithm 1: Brute Force (O(n!))
   * Tries all possible permutations to find the shortest route
   * @param {string} homeCity - Starting and ending city
   * @param {Array} citiesToVisit - Cities to visit
   * @param {Object} distanceMatrix - Distance matrix
   * @returns {Object} Shortest route and distance
   */
  bruteForceTSP(homeCity, citiesToVisit, distanceMatrix) {
    if (citiesToVisit.length === 0) {
      return {
        route: [homeCity, homeCity],
        distance: 0,
      };
    }

    // Generate all permutations of cities to visit
    const permutations = this.generatePermutations(citiesToVisit);
    let shortestDistance = Infinity;
    let shortestRoute = null;

    for (const perm of permutations) {
      const route = [homeCity, ...perm, homeCity];
      const distance = this.calculateRouteDistance(route, distanceMatrix);
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        shortestRoute = route;
      }
    }

    return {
      route: shortestRoute,
      distance: shortestDistance,
    };
  }

  /**
   * Generate all permutations of an array
   * @param {Array} arr - Array to permute
   * @returns {Array} Array of all permutations
   */
  generatePermutations(arr) {
    if (arr.length <= 1) return [arr];
    
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const perms = this.generatePermutations(rest);
      for (const perm of perms) {
        result.push([arr[i], ...perm]);
      }
    }
    return result;
  }

  /**
   * Algorithm 2: Nearest Neighbor (O(n²))
   * Greedy heuristic that always visits the nearest unvisited city
   * @param {string} homeCity - Starting and ending city
   * @param {Array} citiesToVisit - Cities to visit
   * @param {Object} distanceMatrix - Distance matrix
   * @returns {Object} Route and distance
   */
  nearestNeighborTSP(homeCity, citiesToVisit, distanceMatrix) {
    if (citiesToVisit.length === 0) {
      return {
        route: [homeCity, homeCity],
        distance: 0,
      };
    }

    const route = [homeCity];
    const unvisited = new Set(citiesToVisit);
    let currentCity = homeCity;

    while (unvisited.size > 0) {
      let nearestCity = null;
      let nearestDistance = Infinity;

      for (const city of unvisited) {
        const distance = distanceMatrix[currentCity][city];
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestCity = city;
        }
      }

      if (nearestCity) {
        route.push(nearestCity);
        unvisited.delete(nearestCity);
        currentCity = nearestCity;
      }
    }

    route.push(homeCity);
    const distance = this.calculateRouteDistance(route, distanceMatrix);

    return {
      route,
      distance,
    };
  }

  /**
   * Algorithm 3: Dynamic Programming with Bitmasking (O(2^n * n²))
   * Optimal solution using DP to avoid recalculating subproblems
   * @param {string} homeCity - Starting and ending city
   * @param {Array} citiesToVisit - Cities to visit
   * @param {Object} distanceMatrix - Distance matrix
   * @returns {Object} Shortest route and distance
   */
  dynamicProgrammingTSP(homeCity, citiesToVisit, distanceMatrix) {
    if (citiesToVisit.length === 0) {
      return {
        route: [homeCity, homeCity],
        distance: 0,
      };
    }

    const n = citiesToVisit.length;
    const cityIndex = {};
    citiesToVisit.forEach((city, idx) => {
      cityIndex[city] = idx;
    });

    // dp[mask][lastCity] = minimum distance to visit all cities in mask ending at lastCity
    const dp = {};
    const parent = {};

    // Initialize: starting from homeCity to each city
    for (let i = 0; i < n; i++) {
      const mask = 1 << i;
      const city = citiesToVisit[i];
      dp[`${mask},${city}`] = distanceMatrix[homeCity][city];
      parent[`${mask},${city}`] = homeCity;
    }

    // Fill DP table
    for (let mask = 1; mask < (1 << n); mask++) {
      for (let i = 0; i < n; i++) {
        if (!(mask & (1 << i))) continue;

        const cityI = citiesToVisit[i];
        const prevMask = mask ^ (1 << i);

        if (prevMask === 0) continue;

        for (let j = 0; j < n; j++) {
          if (!(prevMask & (1 << j))) continue;

          const cityJ = citiesToVisit[j];
          const key = `${prevMask},${cityJ}`;
          const newKey = `${mask},${cityI}`;

          if (dp[key] !== undefined) {
            const newDist = dp[key] + distanceMatrix[cityJ][cityI];
            
            if (dp[newKey] === undefined || newDist < dp[newKey]) {
              dp[newKey] = newDist;
              parent[newKey] = cityJ;
            }
          }
        }
      }
    }

    // Find minimum distance to return to homeCity
    const fullMask = (1 << n) - 1;
    let minDistance = Infinity;
    let lastCity = null;

    for (let i = 0; i < n; i++) {
      const city = citiesToVisit[i];
      const key = `${fullMask},${city}`;
      if (dp[key] !== undefined) {
        const totalDist = dp[key] + distanceMatrix[city][homeCity];
        if (totalDist < minDistance) {
          minDistance = totalDist;
          lastCity = city;
        }
      }
    }

    // Reconstruct route
    const route = [homeCity];
    let currentMask = fullMask;
    let currentCity = lastCity;

    while (currentCity !== homeCity) {
      route.push(currentCity);
      const key = `${currentMask},${currentCity}`;
      const prevCity = parent[key];
      currentMask = currentMask ^ (1 << cityIndex[currentCity]);
      currentCity = prevCity;
    }

    route.push(homeCity);
    route.reverse();

    return {
      route,
      distance: minDistance,
    };
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
      const bruteForceResult = this.bruteForceTSP(homeCity, uniqueCities, distanceMatrix);
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
    const nearestNeighborResult = this.nearestNeighborTSP(homeCity, uniqueCities, distanceMatrix);
    const end2 = performance.now();
    results.nearestNeighbor = {
      ...nearestNeighborResult,
      time: end2 - start2,
    };

    // Algorithm 3: Dynamic Programming
    // Only use for medium problems (n <= 15) due to memory constraints
    if (uniqueCities.length <= 15) {
      const start3 = performance.now();
      const dpResult = this.dynamicProgrammingTSP(homeCity, uniqueCities, distanceMatrix);
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
