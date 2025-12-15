const Success = require("../../utils/successResponse");
const ErrorResponse = require("../../utils/errorHandler");
const {
  GameRound,
  AlgorithmRun,
  PlayerSubmission,
  ReferenceSolution,
} = require("../../models");
const service = require("../../services/games/snakeLadderService");

// START GAME
exports.startGame = async (req, res, next) => {
  try {
    const { boardSize } = req.body;

    // Validation: Check if boardSize is provided
    if (boardSize === undefined || boardSize === null) {
      return next(new ErrorResponse("Board size is required", 400));
    }

    // Validation: Check if boardSize is a number
    const size = parseInt(boardSize);
    if (isNaN(size)) {
      return next(new ErrorResponse("Board size must be a number", 400));
    }

    // Validation: Check if boardSize is within valid range
    if (size < 6 || size > 12) {
      return next(new ErrorResponse("Board size must be between 6 and 12", 400));
    }

    // Generate board with snakes and ladders
    const { snakes, ladders } = service.generateBoard(size);

    // Validate board generation
    if (!snakes || !ladders) {
      return next(new ErrorResponse("Failed to generate game board", 500));
    }

    // Solve the board using algorithms
    const result = service.solveBoard(snakes, ladders, size);

    // Validate solution
    if (result.bfs === -1 || result.biBfs === -1) {
      return next(new ErrorResponse("No solution found for this board configuration", 500));
    }

    // Generate MCQ options - ensure all are positive and different
    const correct = result.bfs;
    let option2, option3;

    // Generate valid options
    do {
      option2 = correct + Math.floor(Math.random() * 5) + 1;
    } while (option2 === correct || option2 <= 0);

    do {
      option3 = Math.max(1, correct - Math.floor(Math.random() * 5) - 1);
    } while (option3 === correct || option3 === option2 || option3 <= 0);

    // Ensure all options are unique
    const options = [correct, option2, option3];
    const uniqueOptions = [...new Set(options)];

    // If we lost an option due to duplicates, add a new one
    while (uniqueOptions.length < 3) {
      const newOption = correct + Math.floor(Math.random() * 10) + 1;
      if (!uniqueOptions.includes(newOption) && newOption > 0) {
        uniqueOptions.push(newOption);
      }
    }

    // Shuffle options
    const shuffledOptions = uniqueOptions.sort(() => Math.random() - 0.5);

    return Success(res, {
      snakes,
      ladders,
      correctAnswer: correct,
      options: shuffledOptions,
      algoTimes: {
        bfs: parseFloat(result.bfsTime.toFixed(4)),
        biBfs: parseFloat(result.biTime.toFixed(4)),
      },
      boardSize: size,
    });
  } catch (err) {
    console.error("Error in startGame:", err);
    next(new ErrorResponse("Internal server error while starting game", 500));
  }
};

// SUBMIT ANSWER
exports.submitAnswer = async (req, res, next) => {
  try {
    const { playerId, playerName, selectedOption, correctAnswer, algoTimes, boardSize } =
      req.body;

    // Validation: Check required fields
    if (!playerId) {
      return next(new ErrorResponse("Player ID is required", 400));
    }

    if (playerName === undefined || playerName === null || playerName.trim() === "") {
      return next(new ErrorResponse("Player name is required", 400));
    }

    if (selectedOption === undefined || selectedOption === null) {
      return next(new ErrorResponse("Selected option is required", 400));
    }

    if (correctAnswer === undefined || correctAnswer === null) {
      return next(new ErrorResponse("Correct answer is required", 400));
    }

    // Validation: Check if selectedOption is a valid number
    const selected = parseInt(selectedOption);
    const correct = parseInt(correctAnswer);

    if (isNaN(selected) || selected <= 0) {
      return next(new ErrorResponse("Selected option must be a positive number", 400));
    }

    if (isNaN(correct) || correct <= 0) {
      return next(new ErrorResponse("Invalid correct answer", 400));
    }

    // Validation: Check algorithm times
    if (!algoTimes || typeof algoTimes !== "object") {
      return next(new ErrorResponse("Algorithm times are required", 400));
    }

    if (algoTimes.bfs === undefined || algoTimes.biBfs === undefined) {
      return next(
        new ErrorResponse("Both algorithm times (BFS and Bidirectional BFS) are required", 400)
      );
    }

    // Check if answer is correct
    const isCorrect = selected === correct;

    // Create game round
    const gameRound = await GameRound.create({
      playerId,
      playerName: playerName.trim(),
      gameType: "snakeLadder",
      gameConfig: {
        boardSize: boardSize || null,
        correctAnswer: correct,
      },
    });

    // Store reference solution
    await ReferenceSolution.create({
      gameRoundId: gameRound.id,
      gameType: "snakeLadder",
      solution: {
        correctAnswer: correct,
      },
    });

    // Store algorithm runs
    await AlgorithmRun.create({
      gameRoundId: gameRound.id,
      algorithmName: "BFS",
      executionTimeMs: parseFloat(algoTimes.bfs) || 0,
    });

    await AlgorithmRun.create({
      gameRoundId: gameRound.id,
      algorithmName: "Bidirectional BFS",
      executionTimeMs: parseFloat(algoTimes.biBfs) || 0,
    });

    // Save player submission
    await PlayerSubmission.create({
      gameRoundId: gameRound.id,
      playerId,
      playerAnswer: {
        selectedOption: selected,
        correctAnswer: correct,
      },
      isCorrect,
      score: isCorrect ? 1 : 0,
      submissionMetadata: {
        boardSize: boardSize || null,
      },
    });

    return Success(res, {
      result: isCorrect ? "WIN" : "LOSE",
      message: isCorrect
        ? "Congratulations! Your answer is correct."
        : "Sorry, your answer is incorrect. Try again!",
    });
  } catch (err) {
    console.error("Error in submitAnswer:", err);

    // Handle Sequelize validation errors
    if (err.name === "SequelizeValidationError") {
      return next(new ErrorResponse(`Validation error: ${err.message}`, 400));
    }

    // Handle duplicate key errors
    if (err.name === "SequelizeUniqueConstraintError") {
      return next(new ErrorResponse("Duplicate entry detected", 409));
    }

    next(new ErrorResponse("Internal server error while submitting answer", 500));
  }
};

// LEADERBOARD
exports.getLeaderboard = async (req, res, next) => {
  try {
    const results = await PlayerSubmission.findAll({
      where: { isCorrect: true },
      include: [
        {
          model: GameRound,
          as: "gameRound",
          where: { gameType: "snakeLadder" },
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
      limit: 10,
    });

    return Success(res, results);
  } catch (err) {
    next(err);
  }
};
