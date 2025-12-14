const queensController = require("../controllers/games/queensController");
const queensService = require("../services/games/queensService");
const success = require("../utils/successResponse");
const ErrorResponse = require("../utils/errorHandler");

// Mock dependencies
jest.mock("../services/games/queensService");
jest.mock("../utils/successResponse");
jest.mock("../utils/errorHandler");

describe("Queens Controller", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {},
      params: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("computeQueens", () => {
    test("should successfully compute queens solutions", async () => {
      const mockResult = {
        sequentialTimeMs: 10.5,
        threadedTimeMs: 8.2,
        totalSolutions: 92,
        runId: "run123",
      };

      queensService.computeAndPersistRun.mockResolvedValue(mockResult);
      success.mockReturnValue(mockRes);

      await queensController.computeQueens(mockReq, mockRes, mockNext);

      expect(queensService.computeAndPersistRun).toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(
        mockRes,
        mockResult,
        "Eight queens solutions computed and stored."
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should handle errors and call next", async () => {
      const mockError = new Error("Database error");
      queensService.computeAndPersistRun.mockRejectedValue(mockError);

      await queensController.computeQueens(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(success).not.toHaveBeenCalled();
    });
  });

  describe("getQueensStats", () => {
    test("should successfully get queens stats", async () => {
      const mockStats = {
        totalSolutions: 92,
        recognizedCount: 5,
        sequentialTimeMs: 10.5,
        threadedTimeMs: 8.2,
        lastComputedAt: new Date(),
        solutions: [[0, 4, 7, 5, 2, 6, 1, 3]],
      };

      queensService.getStats.mockResolvedValue(mockStats);
      success.mockReturnValue(mockRes);

      await queensController.getQueensStats(mockReq, mockRes, mockNext);

      expect(queensService.getStats).toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(
        mockRes,
        mockStats,
        "Eight queens stats fetched."
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should handle errors and call next", async () => {
      const mockError = new Error("Database error");
      queensService.getStats.mockRejectedValue(mockError);

      await queensController.getQueensStats(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(success).not.toHaveBeenCalled();
    });
  });

  describe("submitQueensSolution", () => {
    const mockValidBody = {
      playerId: "player123",
      playerName: "Test Player",
      solution: [0, 4, 7, 5, 2, 6, 1, 3],
      algorithmTimes: { sequential: 10, threaded: 8 },
    };

    test("should successfully submit valid solution", async () => {
      const mockResult = {
        status: "accepted",
        message: "Correct! Your solution has been recorded.",
        remaining: 87,
      };

      mockReq.body = mockValidBody;
      queensService.submitSolution.mockResolvedValue(mockResult);
      success.mockReturnValue(mockRes);

      await queensController.submitQueensSolution(mockReq, mockRes, mockNext);

      expect(queensService.submitSolution).toHaveBeenCalledWith(
        mockValidBody.playerId,
        mockValidBody.playerName,
        mockValidBody.solution,
        mockValidBody.algorithmTimes
      );
      expect(success).toHaveBeenCalledWith(
        mockRes,
        mockResult,
        "Submission processed."
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should handle missing playerId", async () => {
      mockReq.body = {
        playerName: "Test Player",
        solution: [0, 4, 7, 5, 2, 6, 1, 3],
      };

      await queensController.submitQueensSolution(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ErrorResponse)
      );
      expect(queensService.submitSolution).not.toHaveBeenCalled();
      expect(success).not.toHaveBeenCalled();
    });

    test("should handle missing playerName", async () => {
      mockReq.body = {
        playerId: "player123",
        solution: [0, 4, 7, 5, 2, 6, 1, 3],
      };

      await queensController.submitQueensSolution(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ErrorResponse)
      );
      expect(queensService.submitSolution).not.toHaveBeenCalled();
      expect(success).not.toHaveBeenCalled();
    });

    test("should handle missing solution", async () => {
      mockReq.body = {
        playerId: "player123",
        playerName: "Test Player",
      };

      await queensController.submitQueensSolution(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ErrorResponse)
      );
      expect(queensService.submitSolution).not.toHaveBeenCalled();
      expect(success).not.toHaveBeenCalled();
    });

    test("should handle optional algorithmTimes", async () => {
      const mockResult = {
        status: "accepted",
        message: "Correct! Your solution has been recorded.",
        remaining: 87,
      };

      mockReq.body = {
        playerId: "player123",
        playerName: "Test Player",
        solution: [0, 4, 7, 5, 2, 6, 1, 3],
      };

      queensService.submitSolution.mockResolvedValue(mockResult);
      success.mockReturnValue(mockRes);

      await queensController.submitQueensSolution(mockReq, mockRes, mockNext);

      expect(queensService.submitSolution).toHaveBeenCalledWith(
        "player123",
        "Test Player",
        [0, 4, 7, 5, 2, 6, 1, 3],
        undefined
      );
      expect(success).toHaveBeenCalled();
    });

    test("should handle duplicate solution", async () => {
      const mockResult = {
        status: "duplicate",
        message: "This correct solution was already recognized. Try another one.",
      };

      mockReq.body = mockValidBody;
      queensService.submitSolution.mockResolvedValue(mockResult);
      success.mockReturnValue(mockRes);

      await queensController.submitQueensSolution(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(
        mockRes,
        mockResult,
        "Submission processed."
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should handle completed game (all solutions found)", async () => {
      const mockResult = {
        status: "completed",
        message: "Congratulations! All solutions were identified. The slate has been cleared for the next round.",
      };

      mockReq.body = mockValidBody;
      queensService.submitSolution.mockResolvedValue(mockResult);
      success.mockReturnValue(mockRes);

      await queensController.submitQueensSolution(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(
        mockRes,
        mockResult,
        "Submission processed."
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should handle service errors", async () => {
      const mockError = new ErrorResponse("Incorrect solution. Try again.", 400);

      mockReq.body = mockValidBody;
      queensService.submitSolution.mockRejectedValue(mockError);

      await queensController.submitQueensSolution(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(success).not.toHaveBeenCalled();
    });

    test("should handle database errors", async () => {
      const mockError = new Error("Database connection failed");

      mockReq.body = mockValidBody;
      queensService.submitSolution.mockRejectedValue(mockError);

      await queensController.submitQueensSolution(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(success).not.toHaveBeenCalled();
    });
  });
});

