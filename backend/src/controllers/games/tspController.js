const Success = require("../../utils/successResponse");
const ErrorResponse = require("../../utils/errorHandler");
const {
  GameRound,
  AlgorithmRun,
  PlayerSubmission,
  ReferenceSolution,
} = require("../../models");
const service = require("../../services/games/tspService");

/**
 * START GAME - Generate cities, distance matrix, and select home city
 */
exports.startGame = async (req, res, next) => {
  try {
    // Generate cities A to J
    const cities = service.generateCities();

    // Generate distance matrix with random distances (50-100 km)
    const distanceMatrix = service.generateDistanceMatrix(cities);

    // Select random home city
    const homeCity = service.selectHomeCity(cities);

    // Get complexity analysis
    const complexityAnalysis = service.getComplexityAnalysis();

    return Success(res, {
      cities,
      distanceMatrix,
      homeCity,
      complexityAnalysis,
    });
  } catch (err) {
    next(new ErrorResponse(`Error starting game: ${err.message}`, 500));
  }
};

/**
 * SOLVE TSP - Calculate shortest route using all three algorithms
 */
exports.solveTSP = async (req, res, next) => {
  try {
    const { homeCity, citiesToVisit, distanceMatrix } = req.body;

    // Validation
    if (!homeCity || typeof homeCity !== "string") {
      return next(new ErrorResponse("Home city is required", 400));
    }

    if (!citiesToVisit || !Array.isArray(citiesToVisit)) {
      return next(new ErrorResponse("Cities to visit must be an array", 400));
    }

    if (citiesToVisit.length === 0) {
      return next(new ErrorResponse("At least one city must be selected", 400));
    }

    if (!distanceMatrix || typeof distanceMatrix !== "object") {
      return next(new ErrorResponse("Distance matrix is required", 400));
    }

    // Validate cities are strings
    if (!citiesToVisit.every((city) => typeof city === "string")) {
      return next(new ErrorResponse("All cities must be strings", 400));
    }

    // Validate home city is not in cities to visit
    if (citiesToVisit.includes(homeCity)) {
      return next(new ErrorResponse("Home city cannot be in cities to visit", 400));
    }

    // Solve TSP using all three algorithms
    const results = service.solveTSP(homeCity, citiesToVisit, distanceMatrix);

    return Success(res, {
      results,
      shortestDistance: results.shortestDistance,
    });
  } catch (err) {
    if (err.message.includes("not found") || err.message.includes("Invalid")) {
      return next(new ErrorResponse(err.message, 400));
    }
    next(new ErrorResponse(`Error solving TSP: ${err.message}`, 500));
  }
};

/**
 * SUBMIT ANSWER - Validate player's answer and save to database
 */
exports.submitAnswer = async (req, res, next) => {
  try {
    const {
      playerId,
      playerName,
      homeCity,
      citiesToVisit,
      selectedRoute,
      selectedDistance,
      correctDistance,
      algorithmTimes,
    } = req.body;

    // Validation
    if (!playerId) {
      return next(new ErrorResponse("Player ID is required", 400));
    }

    if (!playerName || typeof playerName !== "string" || playerName.trim().length === 0) {
      return next(new ErrorResponse("Valid player name is required", 400));
    }

    if (!homeCity || typeof homeCity !== "string") {
      return next(new ErrorResponse("Home city is required", 400));
    }

    if (!citiesToVisit || !Array.isArray(citiesToVisit)) {
      return next(new ErrorResponse("Cities to visit must be an array", 400));
    }

    if (!selectedRoute || !Array.isArray(selectedRoute)) {
      return next(new ErrorResponse("Selected route must be an array", 400));
    }

    if (selectedDistance === undefined || selectedDistance === null) {
      return next(new ErrorResponse("Selected distance is required", 400));
    }

    if (correctDistance === undefined || correctDistance === null) {
      return next(new ErrorResponse("Correct distance is required", 400));
    }

    if (!algorithmTimes || typeof algorithmTimes !== "object") {
      return next(new ErrorResponse("Algorithm times are required", 400));
    }

    // Validate distance is a number
    const selectedNum = Number(selectedDistance);
    const correctNum = Number(correctDistance);

    if (isNaN(selectedNum) || isNaN(correctNum)) {
      return next(new ErrorResponse("Distance must be a valid number", 400));
    }

    // Validate route starts and ends with home city
    if (
      selectedRoute.length < 2 ||
      selectedRoute[0] !== homeCity ||
      selectedRoute[selectedRoute.length - 1] !== homeCity
    ) {
      return next(new ErrorResponse("Route must start and end with the home city", 400));
    }

    // Validate all cities to visit are in the route
    const routeSet = new Set(selectedRoute.slice(1, -1)); // Exclude first and last (home city)
    const citiesSet = new Set(citiesToVisit);

    if (citiesSet.size !== routeSet.size) {
      return next(new ErrorResponse("Route must visit exactly the selected cities", 400));
    }

    for (const city of citiesSet) {
      if (!routeSet.has(city)) {
        return next(
          new ErrorResponse(`Route must visit all selected cities. Missing: ${city}`, 400)
        );
      }
    }

    // Check if answer is correct (allow small tolerance for floating point)
    const isCorrect = Math.abs(selectedNum - correctNum) < 0.01;

    // Create game round
    const gameRound = await GameRound.create({
      playerId,
      playerName: playerName.trim(),
      gameType: "tsp",
      gameConfig: {
        homeCity,
        citiesToVisit,
      },
    });

    // Store reference solution
    await ReferenceSolution.create({
      gameRoundId: gameRound.id,
      gameType: "tsp",
      solution: {
        correctDistance: correctNum,
      },
    });

    // Store algorithm runs
    if (algorithmTimes.bruteForce) {
      await AlgorithmRun.create({
        gameRoundId: gameRound.id,
        algorithmName: "Brute Force",
        executionTimeMs: algorithmTimes.bruteForce || null,
      });
    }

    if (algorithmTimes.nearestNeighbor) {
      await AlgorithmRun.create({
        gameRoundId: gameRound.id,
        algorithmName: "Nearest Neighbor",
        executionTimeMs: algorithmTimes.nearestNeighbor || null,
      });
    }

    if (algorithmTimes.dynamicProgramming) {
      await AlgorithmRun.create({
        gameRoundId: gameRound.id,
        algorithmName: "Dynamic Programming",
        executionTimeMs: algorithmTimes.dynamicProgramming || null,
      });
    }

    // Save player submission
    await PlayerSubmission.create({
      gameRoundId: gameRound.id,
      playerId,
      playerAnswer: {
        homeCity,
        citiesToVisit,
        selectedRoute,
        selectedDistance: selectedNum,
        correctDistance: correctNum,
      },
      isCorrect,
      score: isCorrect ? 1 : 0,
    });

    // Determine result
    let result;
    if (isCorrect) {
      result = "WIN";
    } else {
      result = "LOSE";
    }

    return Success(res, {
      result,
      isCorrect,
      correctDistance: correctNum,
      playerDistance: selectedNum,
    });
  } catch (err) {
    if (err.name === "SequelizeValidationError") {
      return next(new ErrorResponse(`Validation error: ${err.message}`, 400));
    }
    if (err.name === "SequelizeDatabaseError") {
      return next(new ErrorResponse(`Invalid data format: ${err.message}`, 400));
    }
    next(new ErrorResponse(`Error submitting answer: ${err.message}`, 500));
  }
};

/**
 * GET LEADERBOARD - Get top players for TSP game
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    if (limit < 1 || limit > 100) {
      return next(new ErrorResponse("Limit must be between 1 and 100", 400));
    }

    const results = await PlayerSubmission.findAll({
      where: { isCorrect: true },
      include: [
        {
          model: GameRound,
          as: "gameRound",
          where: { gameType: "tsp" },
          include: [
            {
              model: require("../../models").Player,
              as: "player",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
    });

    return Success(res, results);
  } catch (err) {
    next(new ErrorResponse(`Error fetching leaderboard: ${err.message}`, 500));
  }
};
