const Success = require("../../utils/successResponse");
const ErrorResponse = require("../../utils/errorHandler");
const GameResult = require("../../models/gameResultModel");
const service = require("../../services/games/trafficService");

/**
 * START GAME - Generate a new traffic network and calculate max flow
 */
exports.startGame = async (req, res, next) => {
  try {
    // Generate network with random capacities
    const network = service.generateNetwork();

    // Calculate maximum flow using both algorithms
    const result = service.calculateMaxFlow(network.edges);

    // Generate some wrong options for the player
    const correct = result.maxFlow;
    const option2 = Math.max(1, correct + Math.floor(Math.random() * 5) + 1);
    const option3 = Math.max(1, correct - Math.floor(Math.random() * 5) - 1);
    const option4 = Math.max(1, correct + Math.floor(Math.random() * 10) + 5);

    // Shuffle options
    const options = [correct, option2, option3, option4]
      .filter((val, idx, arr) => arr.indexOf(val) === idx) // Remove duplicates
      .sort(() => Math.random() - 0.5);

    return Success(res, {
      network: {
        nodes: network.nodes,
        edges: network.edges,
      },
      correctAnswer: correct,
      options: options.length >= 3 ? options : [correct, option2, option3],
      algoTimes: {
        edmondsKarp: result.edmondsKarpTime,
        fordFulkerson: result.fordFulkersonTime,
      },
    });
  } catch (err) {
    next(new ErrorResponse(`Error starting game: ${err.message}`, 500));
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
      selectedAnswer,
      correctAnswer,
      algoTimes,
    } = req.body;

    // Validation
    if (!playerId) {
      return next(new ErrorResponse("Player ID is required", 400));
    }

    if (!playerName || typeof playerName !== "string" || playerName.trim().length === 0) {
      return next(new ErrorResponse("Valid player name is required", 400));
    }

    if (selectedAnswer === undefined || selectedAnswer === null) {
      return next(new ErrorResponse("Selected answer is required", 400));
    }

    if (correctAnswer === undefined || correctAnswer === null) {
      return next(new ErrorResponse("Correct answer is required", 400));
    }

    if (!algoTimes || typeof algoTimes !== "object") {
      return next(new ErrorResponse("Algorithm times are required", 400));
    }

    // Validate answer is a number
    const selectedNum = Number(selectedAnswer);
    const correctNum = Number(correctAnswer);

    if (isNaN(selectedNum) || isNaN(correctNum)) {
      return next(new ErrorResponse("Answer must be a valid number", 400));
    }

    const isCorrect = selectedNum === correctNum;

    // Save to database
    await GameResult.create({
      playerId,
      playerName: playerName.trim(),
      gameType: "traffic",
      score: isCorrect ? 1 : 0,
      isCorrect,
      gameData: {
        selectedAnswer: selectedNum,
        correctAnswer: correctNum,
      },
      algorithmTimes: {
        edmondsKarp: algoTimes.edmondsKarp || 0,
        fordFulkerson: algoTimes.fordFulkerson || 0,
      },
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
      correctAnswer: correctNum,
      playerAnswer: selectedNum,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return next(new ErrorResponse(`Validation error: ${err.message}`, 400));
    }
    if (err.name === "CastError") {
      return next(new ErrorResponse(`Invalid data format: ${err.message}`, 400));
    }
    next(new ErrorResponse(`Error submitting answer: ${err.message}`, 500));
  }
};

/**
 * GET LEADERBOARD - Get top players for traffic simulation game
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    if (limit < 1 || limit > 100) {
      return next(new ErrorResponse("Limit must be between 1 and 100", 400));
    }

    const results = await GameResult.find({
      gameType: "traffic",
      isCorrect: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("playerId", "name")
      .lean();

    return Success(res, results);
  } catch (err) {
    next(new ErrorResponse(`Error fetching leaderboard: ${err.message}`, 500));
  }
};
