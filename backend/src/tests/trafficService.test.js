const trafficService = require("../services/games/trafficService");

describe("Traffic Service", () => {
  describe("Network Generation", () => {
    test("should generate network with correct nodes", () => {
      const network = trafficService.generateNetwork();
      
      expect(network).toHaveProperty("nodes");
      expect(network).toHaveProperty("edges");
      expect(network.nodes).toContain("A");
      expect(network.nodes).toContain("T");
      expect(network.nodes.length).toBe(9);
    });

    test("should generate edges with capacities between 5 and 15", () => {
      const network = trafficService.generateNetwork();
      
      network.edges.forEach((edge) => {
        expect(edge).toHaveProperty("from");
        expect(edge).toHaveProperty("to");
        expect(edge).toHaveProperty("capacity");
        expect(edge.capacity).toBeGreaterThanOrEqual(5);
        expect(edge.capacity).toBeLessThanOrEqual(15);
      });
    });

    test("should generate all required edges", () => {
      const network = trafficService.generateNetwork();
      const expectedEdges = [
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

      expect(network.edges.length).toBe(13);

      expectedEdges.forEach((expectedEdge) => {
        const found = network.edges.find(
          (e) => e.from === expectedEdge.from && e.to === expectedEdge.to
        );
        expect(found).toBeDefined();
      });
    });
  });

  describe("Graph Building", () => {
    test("should build graph from edges", () => {
      const edges = [
        { from: "A", to: "B", capacity: 10 },
        { from: "A", to: "C", capacity: 15 },
        { from: "B", to: "T", capacity: 10 },
        { from: "C", to: "T", capacity: 15 },
      ];

      const graph = trafficService.buildGraph(edges);

      expect(graph["A"]).toBeDefined();
      expect(graph["A"].length).toBe(2);
      expect(graph["B"]).toBeDefined();
      expect(graph["C"]).toBeDefined();
      expect(graph["T"]).toBeDefined();
    });
  });

  describe("Max Flow Algorithms", () => {
    test("Edmonds-Karp should calculate max flow correctly", () => {
      const edges = [
        { from: "A", to: "B", capacity: 10 },
        { from: "A", to: "C", capacity: 15 },
        { from: "B", to: "T", capacity: 10 },
        { from: "C", to: "T", capacity: 15 },
      ];

      const graph = trafficService.buildGraph(edges);
      const maxFlow = trafficService.edmondsKarp(graph, "A", "T");

      expect(maxFlow).toBe(25); // 10 + 15
    });

    test("Ford-Fulkerson should calculate max flow correctly", () => {
      const edges = [
        { from: "A", to: "B", capacity: 10 },
        { from: "A", to: "C", capacity: 15 },
        { from: "B", to: "T", capacity: 10 },
        { from: "C", to: "T", capacity: 15 },
      ];

      const graph = trafficService.buildGraph(edges);
      const maxFlow = trafficService.fordFulkerson(graph, "A", "T");

      expect(maxFlow).toBe(25); // 10 + 15
    });

    test("Both algorithms should give same result", () => {
      const network = trafficService.generateNetwork();
      const result = trafficService.calculateMaxFlow(network.edges);

      expect(result.edmondsKarpFlow).toBe(result.fordFulkersonFlow);
      expect(result.maxFlow).toBe(result.edmondsKarpFlow);
    });

    test("should handle bottleneck scenario", () => {
      const edges = [
        { from: "A", to: "B", capacity: 20 },
        { from: "A", to: "C", capacity: 20 },
        { from: "B", to: "T", capacity: 10 }, // Bottleneck
        { from: "C", to: "T", capacity: 10 }, // Bottleneck
      ];

      const graph = trafficService.buildGraph(edges);
      const edmondsKarpFlow = trafficService.edmondsKarp(graph, "A", "T");
      const fordFulkersonFlow = trafficService.fordFulkerson(
        trafficService.buildGraph(edges),
        "A",
        "T"
      );

      expect(edmondsKarpFlow).toBe(20); // Limited by bottlenecks
      expect(fordFulkersonFlow).toBe(20);
    });

    test("should handle single path", () => {
      const edges = [
        { from: "A", to: "B", capacity: 5 },
        { from: "B", to: "C", capacity: 10 },
        { from: "C", to: "T", capacity: 7 },
      ];

      const graph = trafficService.buildGraph(edges);
      const maxFlow = trafficService.edmondsKarp(graph, "A", "T");

      expect(maxFlow).toBe(5); // Limited by minimum capacity
    });

    test("should return 0 for disconnected graph", () => {
      const edges = [
        { from: "A", to: "B", capacity: 10 },
        { from: "C", to: "T", capacity: 10 },
      ];

      const graph = trafficService.buildGraph(edges);
      const maxFlow = trafficService.edmondsKarp(graph, "A", "T");

      expect(maxFlow).toBe(0);
    });
  });

  describe("Performance Measurement", () => {
    test("should measure execution time for both algorithms", () => {
      const network = trafficService.generateNetwork();
      const result = trafficService.calculateMaxFlow(network.edges);

      expect(result).toHaveProperty("edmondsKarpTime");
      expect(result).toHaveProperty("fordFulkersonTime");
      expect(result).toHaveProperty("maxFlow");
      expect(result.edmondsKarpTime).toBeGreaterThanOrEqual(0);
      expect(result.fordFulkersonTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Edge Cases", () => {
    test("should handle zero capacity edges", () => {
      const edges = [
        { from: "A", to: "B", capacity: 0 },
        { from: "B", to: "T", capacity: 10 },
      ];

      const graph = trafficService.buildGraph(edges);
      const maxFlow = trafficService.edmondsKarp(graph, "A", "T");

      expect(maxFlow).toBe(0);
    });

    test("should handle same source and sink", () => {
      const edges = [
        { from: "A", to: "B", capacity: 10 },
      ];

      const graph = trafficService.buildGraph(edges);
      const maxFlow = trafficService.edmondsKarp(graph, "A", "A");

      expect(maxFlow).toBe(0);
    });
  });
});

