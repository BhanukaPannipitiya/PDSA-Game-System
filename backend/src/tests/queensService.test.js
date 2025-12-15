// Mock SQL models used by queensService to avoid real DB access
jest.mock("../models", () => {
  const fn = () => jest.fn();
  return {
    ReferenceSolution: {
      count: jest.fn(),
      findOrCreate: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    },
    GameRound: {
      create: jest.fn(),
    },
    AlgorithmRun: {
      create: jest.fn(),
      findOne: jest.fn(),
    },
    PlayerSubmission: {
      create: jest.fn(),
    },
    Player: {
      findOne: jest.fn(),
      create: jest.fn(),
    },
  };
});

const queensService = require("../services/games/queensService");
const QueenSolution = require("../models/queenSolutionModel");
const QueenRun = require("../models/queenRunModel");
const GameResult = require("../models/gameResultModel");
const ErrorResponse = require("../utils/errorHandler");

// Mock the models
jest.mock("../models/queenSolutionModel");
jest.mock("../models/queenRunModel");
jest.mock("../models/gameResultModel");
jest.mock("../algorithms/queens/sequentialSolver");
jest.mock("../algorithms/queens/threadedSolver");

const { solveEightQueensSequential } = require("../algorithms/queens/sequentialSolver");
const { solveEightQueensThreaded } = require("../algorithms/queens/threadedSolver");

describe("Queens Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure stubbed mongoose models expose jest fns for each test
    QueenSolution.countDocuments = jest.fn();
    QueenSolution.findOne = jest.fn();
    QueenSolution.estimatedDocumentCount = jest.fn();
    QueenSolution.updateMany = jest.fn();
    QueenSolution.find = jest.fn();
    QueenSolution.bulkWrite = jest.fn();
    QueenSolution.create = jest.fn();

    QueenRun.create = jest.fn();
    QueenRun.findOne = jest.fn();

    GameResult.create = jest.fn();
  });

  describe("isValidPositions", () => {
    test("should return true for valid solution", () => {
      const validSolution = [0, 4, 7, 5, 2, 6, 1, 3];
      expect(queensService.isValidPositions(validSolution)).toBe(true);
    });

    test("should return false for array with wrong length", () => {
      expect(queensService.isValidPositions([0, 1, 2])).toBe(false);
      expect(queensService.isValidPositions([0, 1, 2, 3, 4, 5, 6, 7, 8])).toBe(false);
    });

    test("should return false for non-array input", () => {
      expect(queensService.isValidPositions(null)).toBe(false);
      expect(queensService.isValidPositions(undefined)).toBe(false);
      expect(queensService.isValidPositions("string")).toBe(false);
      expect(queensService.isValidPositions(123)).toBe(false);
    });

    test("should return false for duplicate columns", () => {
      const duplicateCols = [0, 0, 1, 2, 3, 4, 5, 6];
      expect(queensService.isValidPositions(duplicateCols)).toBe(false);
    });

    test("should return false for out of bounds column indices", () => {
      const outOfBounds = [0, 1, 2, 3, 4, 5, 6, 8];
      expect(queensService.isValidPositions(outOfBounds)).toBe(false);

      const negative = [0, 1, 2, 3, 4, 5, 6, -1];
      expect(queensService.isValidPositions(negative)).toBe(false);
    });

    test("should return false for non-integer values", () => {
      const nonInteger = [0, 1, 2, 3, 4, 5, 6, 7.5];
      expect(queensService.isValidPositions(nonInteger)).toBe(false);

      const strings = [0, 1, 2, 3, 4, 5, 6, "7"];
      expect(queensService.isValidPositions(strings)).toBe(false);
    });

    test("should return false for diagonal conflicts", () => {
      // Two queens on same diagonal
      const diagonalConflict = [0, 1, 2, 3, 4, 5, 6, 7];
      expect(queensService.isValidPositions(diagonalConflict)).toBe(false);
    });

    test("should return true for valid solution with no conflicts", () => {
      // A known valid 8-queens solution
      const validSolution = [4, 0, 7, 3, 1, 6, 2, 5];
      expect(queensService.isValidPositions(validSolution)).toBe(true);
    });
  });

  describe("normalizeSolution", () => {
    test("should convert array to comma-separated string", () => {
      const positions = [0, 4, 7, 5, 2, 6, 1, 3];
      const normalized = queensService.normalizeSolution(positions);
      expect(normalized).toBe("0,4,7,5,2,6,1,3");
    });

    test("should handle single element array", () => {
      const positions = [5];
      const normalized = queensService.normalizeSolution(positions);
      expect(normalized).toBe("5");
    });

    test("should handle empty array", () => {
      const positions = [];
      const normalized = queensService.normalizeSolution(positions);
      expect(normalized).toBe("");
    });
  });

  describe("submitSolution", () => {
    const mockPlayerId = "player123";
    const mockPlayerName = "Test Player";
    const mockValidSolution = [0, 4, 7, 5, 2, 6, 1, 3];
    const mockAlgorithmTimes = { sequential: 10, threaded: 8 };

    test("should throw error if playerId is missing", async () => {
      await expect(
        queensService.submitSolution(null, mockPlayerName, mockValidSolution)
      ).rejects.toThrow(ErrorResponse);
    });

    test("should throw error if playerName is missing", async () => {
      await expect(
        queensService.submitSolution(mockPlayerId, null, mockValidSolution)
      ).rejects.toThrow(ErrorResponse);
    });

    test("should throw error if playerName is not a string", async () => {
      await expect(
        queensService.submitSolution(mockPlayerId, 123, mockValidSolution)
      ).rejects.toThrow(ErrorResponse);
    });

    test("should throw error for invalid solution format", async () => {
      await expect(
        queensService.submitSolution(mockPlayerId, mockPlayerName, [0, 1, 2])
      ).rejects.toThrow(ErrorResponse);
    });

    test("should throw error for incorrect solution", async () => {
      // Use a valid solution format that passes validation but is not found in database
      // This simulates a scenario where the solution is valid but not stored (edge case)
      const validButNotFoundSolution = [4, 0, 7, 3, 1, 6, 2, 5]; // A valid 8-queens solution
      
      // Mock countDocuments for ensureSolutionsSeeded
      QueenSolution.countDocuments.mockResolvedValueOnce(92);
      // Mock findOne to return null (solution not found in database)
      QueenSolution.findOne.mockResolvedValue(null);
      GameResult.create.mockResolvedValue({});

      await expect(
        queensService.submitSolution(mockPlayerId, mockPlayerName, validButNotFoundSolution)
      ).rejects.toThrow("Incorrect solution. Try again.");
      
      expect(GameResult.create).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: mockPlayerId,
          gameType: "queens",
          score: 0,
          isCorrect: false,
        })
      );
    });

    test("should return duplicate status for already recognized solution", async () => {
      const mockSolution = {
        solutionKey: queensService.normalizeSolution(mockValidSolution),
        recognized: true,
        save: jest.fn().mockResolvedValue(true),
      };

      QueenSolution.countDocuments.mockResolvedValue(92);
      QueenSolution.findOne.mockResolvedValue(mockSolution);
      GameResult.create.mockResolvedValue({});

      const result = await queensService.submitSolution(
        mockPlayerId,
        mockPlayerName,
        mockValidSolution,
        mockAlgorithmTimes
      );

      expect(result.status).toBe("duplicate");
      expect(result.message).toContain("already recognized");
      expect(GameResult.create).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: mockPlayerId,
          playerName: mockPlayerName.trim(),
          gameType: "queens",
          score: 0,
          isCorrect: false,
        })
      );
    });

    test("should accept new correct solution", async () => {
      const mockSolution = {
        solutionKey: queensService.normalizeSolution(mockValidSolution),
        recognized: false,
        recognizedBy: null,
        recognizedAt: null,
        save: jest.fn().mockResolvedValue(true),
      };

      // Mock countDocuments for ensureSolutionsSeeded
      QueenSolution.countDocuments.mockResolvedValueOnce(92);
      // Mock findOne for finding the solution
      QueenSolution.findOne.mockResolvedValue(mockSolution);
      // Mock estimatedDocumentCount for totalSolutions
      QueenSolution.estimatedDocumentCount.mockResolvedValue(92);
      // Mock countDocuments with filter for recognizedCount
      QueenSolution.countDocuments.mockResolvedValueOnce(5);
      GameResult.create.mockResolvedValue({});

      const result = await queensService.submitSolution(
        mockPlayerId,
        mockPlayerName,
        mockValidSolution,
        mockAlgorithmTimes
      );

      expect(result.status).toBe("accepted");
      expect(result.message).toContain("Correct");
      expect(result.remaining).toBe(87); // 92 - 5 = 87
      expect(mockSolution.recognized).toBe(true);
      expect(mockSolution.recognizedBy).toBe(mockPlayerName.trim());
      expect(mockSolution.save).toHaveBeenCalled();
      expect(GameResult.create).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: mockPlayerId,
          playerName: mockPlayerName.trim(),
          gameType: "queens",
          score: 1,
          isCorrect: true,
        })
      );
    });

    test("should reset all solutions when all are recognized", async () => {
      const mockSolution = {
        solutionKey: queensService.normalizeSolution(mockValidSolution),
        recognized: false,
        save: jest.fn().mockResolvedValue(true),
      };

      // Mock countDocuments for ensureSolutionsSeeded
      QueenSolution.countDocuments.mockResolvedValueOnce(92);
      // Mock findOne for finding the solution
      QueenSolution.findOne.mockResolvedValue(mockSolution);
      // Mock estimatedDocumentCount for totalSolutions
      QueenSolution.estimatedDocumentCount.mockResolvedValue(92);
      // Mock countDocuments with filter for recognizedCount (all 92 are recognized)
      QueenSolution.countDocuments.mockResolvedValueOnce(92);
      QueenSolution.updateMany.mockResolvedValue({});
      GameResult.create.mockResolvedValue({});

      const result = await queensService.submitSolution(
        mockPlayerId,
        mockPlayerName,
        mockValidSolution,
        mockAlgorithmTimes
      );

      expect(result.status).toBe("completed");
      expect(result.message).toContain("All solutions were identified");
      expect(QueenSolution.updateMany).toHaveBeenCalledWith(
        {},
        { $set: { recognized: false, recognizedBy: null, recognizedAt: null } }
      );
    });

    test("should trim player name", async () => {
      const mockSolution = {
        solutionKey: queensService.normalizeSolution(mockValidSolution),
        recognized: false,
        save: jest.fn().mockResolvedValue(true),
      };

      // Mock countDocuments for ensureSolutionsSeeded
      QueenSolution.countDocuments.mockResolvedValueOnce(92);
      // Mock findOne for finding the solution
      QueenSolution.findOne.mockResolvedValue(mockSolution);
      // Mock estimatedDocumentCount for totalSolutions
      QueenSolution.estimatedDocumentCount.mockResolvedValue(92);
      // Mock countDocuments with filter for recognizedCount
      QueenSolution.countDocuments.mockResolvedValueOnce(5);
      GameResult.create.mockResolvedValue({});

      await queensService.submitSolution(
        mockPlayerId,
        "  Test Player  ",
        mockValidSolution,
        mockAlgorithmTimes
      );

      expect(mockSolution.recognizedBy).toBe("Test Player");
    });
  });

  describe("getStats", () => {
    test("should return stats with sample solutions", async () => {
      const mockSolutions = [
        { positions: [0, 4, 7, 5, 2, 6, 1, 3] },
        { positions: [1, 3, 5, 7, 2, 0, 6, 4] },
      ];
      const mockRun = {
        sequentialTimeMs: 10.5,
        threadedTimeMs: 8.2,
        computedAt: new Date(),
      };

      QueenSolution.countDocuments.mockResolvedValue(92);
      QueenSolution.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockSolutions),
          }),
        }),
      });
      QueenRun.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockRun),
        }),
      });

      const stats = await queensService.getStats();

      expect(stats.totalSolutions).toBe(92);
      expect(stats.sequentialTimeMs).toBe(10.5);
      expect(stats.threadedTimeMs).toBe(8.2);
      expect(stats.solutions).toHaveLength(2);
      expect(stats.solutions[0]).toEqual([0, 4, 7, 5, 2, 6, 1, 3]);
    });

    test("should seed solutions if database is empty", async () => {
      const mockSolutions = [
        { positions: [0, 4, 7, 5, 2, 6, 1, 3] },
      ];
      const computedSolutions = [[0, 4, 7, 5, 2, 6, 1, 3], [1, 3, 5, 7, 2, 0, 6, 4]];

      // Mock countDocuments: first call returns 0 (empty), second call returns 92 (after seeding)
      QueenSolution.countDocuments
        .mockResolvedValueOnce(0) // First call in ensureSolutionsSeeded
        .mockResolvedValueOnce(92); // Second call in getStats for recognizedCount

      // Mock computeSequential timing
      const originalHrtime = process.hrtime.bigint;
      process.hrtime.bigint = jest.fn()
        .mockReturnValueOnce(BigInt(0))
        .mockReturnValueOnce(BigInt(10000000)); // 10ms

      solveEightQueensSequential.mockReturnValue(computedSolutions);
      QueenSolution.bulkWrite = jest.fn().mockResolvedValue({});
      QueenSolution.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockSolutions),
          }),
        }),
      });
      QueenRun.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      const stats = await queensService.getStats();

      expect(QueenSolution.bulkWrite).toHaveBeenCalled();
      expect(stats.totalSolutions).toBe(2); // Should return the length of computedSolutions
      expect(solveEightQueensSequential).toHaveBeenCalled();

      process.hrtime.bigint = originalHrtime;
    });

    test("should handle missing run data", async () => {
      const mockSolutions = [
        { positions: [0, 4, 7, 5, 2, 6, 1, 3] },
      ];

      QueenSolution.countDocuments.mockResolvedValue(92);
      QueenSolution.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockSolutions),
          }),
        }),
      });
      QueenRun.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      const stats = await queensService.getStats();

      expect(stats.sequentialTimeMs).toBeNull();
      expect(stats.threadedTimeMs).toBeNull();
      expect(stats.lastComputedAt).toBeNull();
    });
  });

  describe("computeAndPersistRun", () => {
    test("should compute and persist run results", async () => {
      const mockSequentialSolutions = [[0, 4, 7, 5, 2, 6, 1, 3]];
      const mockThreadedSolutions = [[0, 4, 7, 5, 2, 6, 1, 3]];

      solveEightQueensSequential.mockReturnValue(mockSequentialSolutions);
      solveEightQueensThreaded.mockResolvedValue({
        solutions: mockThreadedSolutions,
        timeMs: 8.5,
      });

      // Mock process.hrtime.bigint for sequential timing
      const originalHrtime = process.hrtime.bigint;
      process.hrtime.bigint = jest.fn()
        .mockReturnValueOnce(BigInt(0))
        .mockReturnValueOnce(BigInt(10000000)); // 10ms

      QueenSolution.bulkWrite = jest.fn().mockResolvedValue({});
      const mockRun = {
        id: "run123",
        save: jest.fn().mockResolvedValue(true),
      };
      QueenRun.create.mockResolvedValue(mockRun);

      const result = await queensService.computeAndPersistRun();

      expect(result).toHaveProperty("sequentialTimeMs");
      expect(result).toHaveProperty("threadedTimeMs");
      expect(result).toHaveProperty("totalSolutions");
      expect(result).toHaveProperty("runId");
      expect(result.runId).toBe("run123");
      expect(QueenRun.create).toHaveBeenCalled();

      process.hrtime.bigint = originalHrtime;
    });

    test("should persist solutions to database", async () => {
      const mockSequentialSolutions = [[0, 4, 7, 5, 2, 6, 1, 3], [1, 3, 5, 7, 2, 0, 6, 4]];
      const mockThreadedSolutions = [[0, 4, 7, 5, 2, 6, 1, 3], [1, 3, 5, 7, 2, 0, 6, 4]];

      solveEightQueensSequential.mockReturnValue(mockSequentialSolutions);
      solveEightQueensThreaded.mockResolvedValue({
        solutions: mockThreadedSolutions,
        timeMs: 8.5,
      });

      const originalHrtime = process.hrtime.bigint;
      process.hrtime.bigint = jest.fn()
        .mockReturnValueOnce(BigInt(0))
        .mockReturnValueOnce(BigInt(10000000));

      QueenSolution.bulkWrite = jest.fn().mockResolvedValue({});
      QueenRun.create.mockResolvedValue({ id: "run123" });

      await queensService.computeAndPersistRun();

      expect(QueenSolution.bulkWrite).toHaveBeenCalledTimes(2); // Once for sequential, once for threaded
      expect(QueenSolution.bulkWrite).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            updateOne: expect.objectContaining({
              filter: expect.objectContaining({
                solutionKey: expect.any(String),
              }),
            }),
          }),
        ])
      );

      process.hrtime.bigint = originalHrtime;
    });
  });
});

