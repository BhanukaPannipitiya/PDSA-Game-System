const { calculateRouteDistance, generatePermutations } = require("./utils");

/**
 * Algorithm 1: Brute Force (O(n!))
 * Tries all possible permutations to find the shortest route
 * Time Complexity: O(n!) where n is the number of cities
 * Space Complexity: O(n) for recursion stack
 * @param {string} homeCity - Starting and ending city
 * @param {Array} citiesToVisit - Cities to visit
 * @param {Object} distanceMatrix - Distance matrix
 * @returns {Object} Shortest route and distance
 */
function bruteForceTSP(homeCity, citiesToVisit, distanceMatrix) {
  if (citiesToVisit.length === 0) {
    return {
      route: [homeCity, homeCity],
      distance: 0,
    };
  }

  // Generate all permutations of cities to visit
  const permutations = generatePermutations(citiesToVisit);
  let shortestDistance = Infinity;
  let shortestRoute = null;

  for (const perm of permutations) {
    const route = [homeCity, ...perm, homeCity];
    const distance = calculateRouteDistance(route, distanceMatrix);
    
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

module.exports = {
  bruteForceTSP,
};

