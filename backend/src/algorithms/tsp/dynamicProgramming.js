/**
 * Algorithm 3: Dynamic Programming with Bitmasking (O(2^n * n²))
 * Optimal solution using DP to avoid recalculating subproblems
 * Time Complexity: O(2^n * n²) where n is the number of cities
 * Space Complexity: O(2^n * n) for DP table
 * @param {string} homeCity - Starting and ending city
 * @param {Array} citiesToVisit - Cities to visit
 * @param {Object} distanceMatrix - Distance matrix
 * @returns {Object} Shortest route and distance
 */
function dynamicProgrammingTSP(homeCity, citiesToVisit, distanceMatrix) {
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

module.exports = {
  dynamicProgrammingTSP,
};

