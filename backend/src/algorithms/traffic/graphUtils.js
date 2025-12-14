/**
 * Build adjacency list representation of the graph
 * @param {Array} edges - Array of edge objects with from, to, and capacity
 * @returns {Object} Adjacency list representation
 */
function buildGraph(edges) {
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
 * BFS to find augmenting path (used by Edmonds-Karp algorithm)
 * @param {Object} graph - Graph representation
 * @param {string} source - Source node
 * @param {string} sink - Sink node
 * @param {Object} parent - Parent array to store path
 * @returns {boolean} True if path exists
 */
function bfs(graph, source, sink, parent) {
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
 * DFS to find augmenting path (used by Ford-Fulkerson algorithm)
 * @param {Object} graph - Graph representation
 * @param {string} source - Source node
 * @param {string} sink - Sink node
 * @param {Object} visited - Visited set
 * @param {Object} path - Path array
 * @param {number} minCapacity - Minimum capacity found so far
 * @returns {number} Flow that can be sent along this path
 */
function dfs(graph, source, sink, visited, path, minCapacity = Infinity) {
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
      const flow = dfs(
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

module.exports = {
  buildGraph,
  bfs,
  dfs,
};

