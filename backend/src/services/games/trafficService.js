const { performance } = require("perf_hooks");
const { buildGraph } = require("../../algorithms/traffic/graphUtils");
const { calculateMaxFlowEdmondsKarp } = require("../../algorithms/traffic/edmondsKarp");
const { calculateMaxFlowFordFulkerson } = require("../../algorithms/traffic/fordFulkerson");

class TrafficService {
  /**
   * Generate a traffic network with random capacities between 5 and 15
   * @returns {Object} Network graph with nodes and edges
   */
  generateNetwork() {
    const edges = [
      { from: "A", to: "B" },
      { from: "A", to: "C" },
      { from: "A", to: "D" },
      { from: "B", to: "E" },
      { from: "B", to: "F" },
      { from: "C", to: "E" },
      { from: "C", to: "F" },
      { from: "D", to: "F" },
      { from: "E", to: "G" },
      { from: "E", to: "H" },
      { from: "F", to: "H" },
      { from: "G", to: "T" },
      { from: "H", to: "T" },
    ];

    const network = {
      nodes: ["A", "B", "C", "D", "E", "F", "G", "H", "T"],
      edges: edges.map((edge) => ({
        ...edge,
        capacity: Math.floor(Math.random() * 11) + 5, // Random between 5 and 15
      })),
    };

    return network;
  }

  /**
   * Build adjacency list representation of the graph
   * @param {Array} edges - Array of edge objects with from, to, and capacity
   * @returns {Object} Adjacency list representation
   */
  buildGraph(edges) {
    return buildGraph(edges);
  }

  /**
   * Calculate maximum flow using both algorithms and measure execution time
   * @param {Array} edges - Array of edge objects
   * @returns {Object} Results with max flow and execution times
   */
  calculateMaxFlow(edges) {
    // Measure Edmonds-Karp (BFS-based)
    const start1 = performance.now();
    const edmondsKarpFlow = calculateMaxFlowEdmondsKarp(edges, "A", "T");
    const end1 = performance.now();
    const edmondsKarpTime = end1 - start1;

    // Measure Ford-Fulkerson (DFS-based)
    const start2 = performance.now();
    const fordFulkersonFlow = calculateMaxFlowFordFulkerson(edges, "A", "T");
    const end2 = performance.now();
    const fordFulkersonTime = end2 - start2;

    // Both algorithms should give the same result
    const maxFlow = Math.max(edmondsKarpFlow, fordFulkersonFlow);

    return {
      maxFlow,
      edmondsKarpFlow,
      fordFulkersonFlow,
      edmondsKarpTime,
      fordFulkersonTime,
    };
  }
}

module.exports = new TrafficService();
