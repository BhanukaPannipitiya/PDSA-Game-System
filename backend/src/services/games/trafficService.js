const { performance } = require("perf_hooks");

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
    const graph = {};
    
    for (const edge of edges) {
      if (!graph[edge.from]) {
        graph[edge.from] = [];
      }
      graph[edge.from].push({
        to: edge.to,
        capacity: edge.capacity,
        flow: 0,
      });
    }

    // Initialize all nodes (including those that only receive edges)
    const allNodes = new Set();
    edges.forEach((edge) => {
      allNodes.add(edge.from);
      allNodes.add(edge.to);
    });
    
    allNodes.forEach((node) => {
      if (!graph[node]) {
        graph[node] = [];
      }
    });

    return graph;
  }

  /**
   * BFS to find augmenting path (Edmonds-Karp algorithm)
   * @param {Object} graph - Graph representation
   * @param {string} source - Source node
   * @param {string} sink - Sink node
   * @param {Object} parent - Parent array to store path
   * @returns {boolean} True if path exists
   */
  bfs(graph, source, sink, parent) {
    const visited = new Set();
    const queue = [source];
    visited.add(source);
    parent[source] = null;

    while (queue.length > 0) {
      const u = queue.shift();

      if (!graph[u]) continue;

      for (const edge of graph[u]) {
        const v = edge.to;
        const residualCapacity = edge.capacity - edge.flow;

        if (!visited.has(v) && residualCapacity > 0) {
          visited.add(v);
          parent[v] = { node: u, edgeIndex: graph[u].indexOf(edge) };
          queue.push(v);

          if (v === sink) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Find edge in graph
   * @param {Object} graph - Graph representation
   * @param {string} from - Source node
   * @param {string} to - Destination node
   * @returns {Object|null} Edge object or null
   */
  findEdge(graph, from, to) {
    if (!graph[from]) return null;
    return graph[from].find((edge) => edge.to === to) || null;
  }

  /**
   * Edmonds-Karp Algorithm (BFS-based)
   * @param {Object} graph - Graph representation
   * @param {string} source - Source node
   * @param {string} sink - Sink node
   * @returns {number} Maximum flow
   */
  edmondsKarp(graph, source, sink) {
    // Create a copy of the graph to avoid modifying original
    const residualGraph = JSON.parse(JSON.stringify(graph));
    let maxFlow = 0;

    while (true) {
      const parent = {};
      if (!this.bfs(residualGraph, source, sink, parent)) {
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
   * DFS to find augmenting path (Ford-Fulkerson algorithm)
   * @param {Object} graph - Graph representation
   * @param {string} source - Source node
   * @param {string} sink - Sink node
   * @param {Object} visited - Visited set
   * @param {Object} path - Path array
   * @param {number} minCapacity - Minimum capacity found so far
   * @returns {number} Flow that can be sent along this path
   */
  dfs(graph, source, sink, visited, path, minCapacity = Infinity) {
    if (source === sink) {
      return minCapacity;
    }

    visited.add(source);

    if (!graph[source]) {
      return 0;
    }

    for (const edge of graph[source]) {
      const v = edge.to;
      const residualCapacity = edge.capacity - edge.flow;

      if (!visited.has(v) && residualCapacity > 0) {
        path.push({ from: source, to: v, edge });
        const flow = this.dfs(
          graph,
          v,
          sink,
          visited,
          path,
          Math.min(minCapacity, residualCapacity)
        );

        if (flow > 0) {
          return flow;
        }

        path.pop();
      }
    }

    return 0;
  }

  /**
   * Ford-Fulkerson Algorithm (DFS-based)
   * @param {Object} graph - Graph representation
   * @param {string} source - Source node
   * @param {string} sink - Sink node
   * @returns {number} Maximum flow
   */
  fordFulkerson(graph, source, sink) {
    // Create a copy of the graph to avoid modifying original
    const residualGraph = JSON.parse(JSON.stringify(graph));
    let maxFlow = 0;

    while (true) {
      const visited = new Set();
      const path = [];
      const flow = this.dfs(residualGraph, source, sink, visited, path);

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
   * Calculate maximum flow using both algorithms and measure execution time
   * @param {Array} edges - Array of edge objects
   * @returns {Object} Results with max flow and execution times
   */
  calculateMaxFlow(edges) {
    const graph = this.buildGraph(edges);

    // Measure Edmonds-Karp (BFS-based)
    const start1 = performance.now();
    const edmondsKarpFlow = this.edmondsKarp(graph, "A", "T");
    const end1 = performance.now();
    const edmondsKarpTime = end1 - start1;

    // Measure Ford-Fulkerson (DFS-based)
    const start2 = performance.now();
    const fordFulkersonFlow = this.fordFulkerson(graph, "A", "T");
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
