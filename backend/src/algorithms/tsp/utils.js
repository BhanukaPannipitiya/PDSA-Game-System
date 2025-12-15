/**
 * Calculate total distance of a route
 * @param {Array} route - Array of city names in order
 * @param {Object} distanceMatrix - Distance matrix
 * @returns {number} Total distance
 */
function calculateRouteDistance(route, distanceMatrix) {
  let totalDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += distanceMatrix[route[i]][route[i + 1]];
  }
  return totalDistance;
}

/**
 * Generate all permutations of an array
 * @param {Array} arr - Array to permute
 * @returns {Array} Array of all permutations
 */
function generatePermutations(arr) {
  if (arr.length <= 1) return [arr];
  
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const perms = generatePermutations(rest);
    for (const perm of perms) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

module.exports = {
  calculateRouteDistance,
  generatePermutations,
};

