const { buildGraph, dfs } = require("./graphUtils");

/**
 * Ford-Fulkerson Algorithm (DFS-based)
 * Finds maximum flow in a network using DFS to find augmenting paths
 * Time Complexity: O(E * max_flow) where E is edges
 * @param {Object} graph - Graph representation
 * @param {string} source - Source node
 * @param {string} sink - Sink node
 * @returns {number} Maximum flow
 */
function fordFulkerson(graph, source, sink) {
  // Create a copy of the graph to avoid modifying original
  const residualGraph = JSON.parse(JSON.stringify(graph));
  let maxFlow = 0;

  while (true) {
    const visited = new Set();
    const path = [];
    const flow = dfs(residualGraph, source, sink, visited, path);

    if (flow === 0) {
      break;
    }

    // Update flows along the path
    for (const step of path) {
      const { from, to, edge } = step;
      edge.flow += flow;

      // Create reverse edge if it doesn't exist
      if (!residualGraph[to]) {
        residualGraph[to] = [];
      }
      let reverseEdge = residualGraph[to].find((e) => e.to === from);
      if (!reverseEdge) {
        reverseEdge = { to: from, capacity: 0, flow: 0 };
        residualGraph[to].push(reverseEdge);
      }
      reverseEdge.flow -= flow;
    }

    maxFlow += flow;
  }

  return maxFlow;
}

/**
 * Calculate maximum flow using Ford-Fulkerson algorithm
 * @param {Array} edges - Array of edge objects
 * @param {string} source - Source node
 * @param {string} sink - Sink node
 * @returns {number} Maximum flow
 */
function calculateMaxFlowFordFulkerson(edges, source, sink) {
  const graph = buildGraph(edges);
  return fordFulkerson(graph, source, sink);
}

module.exports = {
  fordFulkerson,
  calculateMaxFlowFordFulkerson,
};

