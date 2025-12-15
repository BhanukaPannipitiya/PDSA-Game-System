const { buildGraph, bfs } = require("./graphUtils");

/**
 * Edmonds-Karp Algorithm (BFS-based)
 * Finds maximum flow in a network using BFS to find augmenting paths
 * Time Complexity: O(V * E²) where V is vertices and E is edges
 * @param {Object} graph - Graph representation
 * @param {string} source - Source node
 * @param {string} sink - Sink node
 * @returns {number} Maximum flow
 */
function edmondsKarp(graph, source, sink) {
  // Create a copy of the graph to avoid modifying original
  const residualGraph = JSON.parse(JSON.stringify(graph));
  let maxFlow = 0;

  while (true) {
    const parent = {};
    if (!bfs(residualGraph, source, sink, parent)) {
      break;
    }

    // Find minimum residual capacity along the path
    let pathFlow = Infinity;
    let v = sink;

    while (parent[v] !== null && parent[v] !== undefined) {
      const { node: u, edgeIndex } = parent[v];
      const edge = residualGraph[u][edgeIndex];
      pathFlow = Math.min(pathFlow, edge.capacity - edge.flow);
      v = u;
    }

    // Update residual capacities and reverse edges
    v = sink;
    while (parent[v] !== null && parent[v] !== undefined) {
      const { node: u, edgeIndex } = parent[v];
      const edge = residualGraph[u][edgeIndex];
      edge.flow += pathFlow;

      // Create reverse edge if it doesn't exist
      if (!residualGraph[v]) {
        residualGraph[v] = [];
      }
      let reverseEdge = residualGraph[v].find((e) => e.to === u);
      if (!reverseEdge) {
        reverseEdge = { to: u, capacity: 0, flow: 0 };
        residualGraph[v].push(reverseEdge);
      }
      reverseEdge.flow -= pathFlow;

      v = u;
    }

    maxFlow += pathFlow;
  }

  return maxFlow;
}

/**
 * Calculate maximum flow using Edmonds-Karp algorithm
 * @param {Array} edges - Array of edge objects
 * @param {string} source - Source node
 * @param {string} sink - Sink node
 * @returns {number} Maximum flow
 */
function calculateMaxFlowEdmondsKarp(edges, source, sink) {
  const graph = buildGraph(edges);
  return edmondsKarp(graph, source, sink);
}

module.exports = {
  edmondsKarp,
  calculateMaxFlowEdmondsKarp,
};

