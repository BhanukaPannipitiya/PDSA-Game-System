const Success = require("../../utils/successResponse");
const ErrorResponse = require("../../utils/errorHandler");
const GameResult = require("../../models/gameResultsModel");
const service = require("../../services/games/snakeLadderService");

// START GAME
exports.startGame = async (req, res, next) => {
  try {
    const { boardSize } = req.body;

    if (!boardSize || boardSize < 6 || boardSize > 12) {
      return next(new ErrorResponse("Board size must be between 6 and 12", 400));
    }

    const { snakes, ladders } = service.generateBoard(boardSize);
    const result = service.solveBoard(snakes, ladders, boardSize);

    // Generate MCQ options
    const correct = result.bfs;
    const option2 = correct + Math.floor(Math.random() * 3) + 1;
    const option3 = correct - Math.floor(Math.random() * 3) + 1;

    return Success(res, {
      snakes,
      ladders,
      correctAnswer: correct,
      options: [correct, option2, option3].sort(() => Math.random() - 0.5),
      algoTimes: {
        bfs: result.bfsTime,
        biBfs: result.biTime
      },
      boardSize
    });
  } catch (err) {
    next(err);
  }
};

// SUBMIT ANSWER
exports.submitAnswer = async (req, res, next) => {
  try {
    const { playerName, selectedOption, correctAnswer, algoTimes, boardSize } =
      req.body;

    const isCorrect = selectedOption == correctAnswer;

    await GameResult.create({
      game: "snakeladder",
      playerName,
      selectedOption,
      correctAnswer,
      isCorrect,
      algo1Time: algoTimes.bfs,
      algo2Time: algoTimes.biBfs,
      boardSize
    });

    return Success(res, {
      result: isCorrect ? "WIN" : "LOSE"
    });
  } catch (err) {
    next(err);
  }
};

// LEADERBOARD
exports.getLeaderboard = async (req, res, next) => {
  try {
    const results = await GameResult.find({ game: "snakeladder", isCorrect: true })
      .sort({ createdAt: -1 })
      .limit(10);

    return Success(res, results);
  } catch (err) {
    next(err);
  }
};
