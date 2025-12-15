const { calculateRouteDistance } = require("./utils");

/**
 * Algorithm 2: Nearest Neighbor (O(n²))
 * Greedy heuristic that always visits the nearest unvisited city
 * Time Complexity: O(n²) where n is the number of cities
 * Space Complexity: O(n) for storing route and unvisited set
 * @param {string} homeCity - Starting and ending city
 * @param {Array} citiesToVisit - Cities to visit
 * @param {Object} distanceMatrix - Distance matrix
 * @returns {Object} Route and distance
 */
function nearestNeighborTSP(homeCity, citiesToVisit, distanceMatrix) {
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
  const distance = calculateRouteDistance(route, distanceMatrix);

  return {
    route,
    distance,
  };
}

module.exports = {
  nearestNeighborTSP,
};

