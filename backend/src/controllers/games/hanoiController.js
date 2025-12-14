const {
  GameRound,
  AlgorithmRun,
  PlayerSubmission,
  ReferenceSolution,
} = require("../../models");
const {
  recursive3Pegs,
  iterative3Pegs,
  frameStewart4Pegs,
  iterativeFrameStewart4Pegs,
  calculateMinMoves,
} = require("../../services/games/hanoiService");

// Generate random game configuration
exports.generateGame = async (req, res) => {
  try {
    const numDisks = Math.floor(Math.random() * 6) + 5; // 5 to 10

    res.json({
      success: true,
      data: {
        numDisks,
        minPegs: 3,
        maxPegs: 4,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Solve the Tower of Hanoi problem
exports.solveHanoi = async (req, res) => {
  try {
    const { numDisks, numPegs } = req.body;

    // Validation
    if (!numDisks || numDisks < 5 || numDisks > 10) {
      return res.status(400).json({
        success: false,
        message: "Number of disks must be between 5 and 10",
      });
    }

    if (!numPegs || (numPegs !== 3 && numPegs !== 4)) {
      return res.status(400).json({
        success: false,
        message: "Number of pegs must be 3 or 4",
      });
    }

    let solution1, solution2, time1, time2, algo1Name, algo2Name;

    if (numPegs === 3) {
      // Algorithm 1: Recursive
      const start1 = performance.now();
      solution1 = recursive3Pegs(numDisks, "A", "C", "B");
      const end1 = performance.now();
      time1 = end1 - start1;
      algo1Name = "Recursive 3-Peg";

      // Algorithm 2: Iterative
      const start2 = performance.now();
      solution2 = iterative3Pegs(numDisks, "A", "C", "B");
      const end2 = performance.now();
      time2 = end2 - start2;
      algo2Name = "Iterative 3-Peg";
    } else {
      // Algorithm 1: Frame-Stewart Recursive
      const start1 = performance.now();
      solution1 = frameStewart4Pegs(numDisks, "A", "D", "B", "C");
      const end1 = performance.now();
      time1 = end1 - start1;
      algo1Name = "Frame-Stewart Recursive";

      // Algorithm 2: Frame-Stewart Iterative
      const start2 = performance.now();
      solution2 = iterativeFrameStewart4Pegs(numDisks, "A", "D", "B", "C");
      const end2 = performance.now();
      time2 = end2 - start2;
      algo2Name = "Frame-Stewart Iterative";
    }

    const minMoves = calculateMinMoves(numDisks, numPegs);

    res.json({
      success: true,
      data: {
        numMoves: solution1.length,
        sequence: solution1,
        minMoves: minMoves,
        algorithm1: {
          name: algo1Name,
          time: time1,
          moves: solution1.length,
        },
        algorithm2: {
          name: algo2Name,
          time: time2,
          moves: solution2.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Submit user answer
exports.submitAnswer = async (req, res) => {
  try {
    const { playerId, playerName, numDisks, numPegs, userMoves, userSequence } =
      req.body;

    // Validation
    if (!playerId) {
      return res.status(400).json({
        success: false,
        message: "Player ID is required",
      });
    }

    if (!playerName || !playerName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Player name is required",
      });
    }

    if (!numDisks || numDisks < 5 || numDisks > 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid number of disks",
      });
    }

    if (!numPegs || (numPegs !== 3 && numPegs !== 4)) {
      return res.status(400).json({
        success: false,
        message: "Invalid number of pegs",
      });
    }

    if (!userMoves || userMoves < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid number of moves",
      });
    }

    if (!userSequence || !Array.isArray(userSequence)) {
      return res.status(400).json({
        success: false,
        message: "Invalid move sequence",
      });
    }

    // Get correct solution
    let correctSequence, time1, time2, algo1Name, algo2Name;

    if (numPegs === 3) {
      const start1 = performance.now();
      correctSequence = recursive3Pegs(numDisks, "A", "C", "B");
      const end1 = performance.now();
      time1 = end1 - start1;
      algo1Name = "Recursive 3-Peg";

      const start2 = performance.now();
      iterative3Pegs(numDisks, "A", "C", "B");
      const end2 = performance.now();
      time2 = end2 - start2;
      algo2Name = "Iterative 3-Peg";
    } else {
      const start1 = performance.now();
      correctSequence = frameStewart4Pegs(numDisks, "A", "D", "B", "C");
      const end1 = performance.now();
      time1 = end1 - start1;
      algo1Name = "Frame-Stewart Recursive";

      const start2 = performance.now();
      iterativeFrameStewart4Pegs(numDisks, "A", "D", "B", "C");
      const end2 = performance.now();
      time2 = end2 - start2;
      algo2Name = "Frame-Stewart Iterative";
    }

    const correctMoves = correctSequence.length;
    const isCorrect =
      userMoves === correctMoves &&
      JSON.stringify(userSequence) === JSON.stringify(correctSequence);

    // Create game round
    const gameRound = await GameRound.create({
      playerId,
      playerName: playerName.trim(),
      gameType: "hanoi",
      gameConfig: {
        numDisks,
        numPegs,
      },
    });

    // Store reference solution
    await ReferenceSolution.create({
      gameRoundId: gameRound.id,
      gameType: "hanoi",
      solution: {
        correctMoves,
        correctSequence,
      },
    });

    // Store algorithm runs
    await AlgorithmRun.create({
      gameRoundId: gameRound.id,
      algorithmName: algo1Name,
      executionTimeMs: time1,
      algorithmResult: {
        moves: correctSequence.length,
      },
    });

    await AlgorithmRun.create({
      gameRoundId: gameRound.id,
      algorithmName: algo2Name,
      executionTimeMs: time2,
      algorithmResult: {
        moves: correctSequence.length,
      },
    });

    // Save player submission
    const playerSubmission = await PlayerSubmission.create({
      gameRoundId: gameRound.id,
      playerId,
      playerAnswer: {
        userMoves,
        userSequence,
      },
      isCorrect,
      score: isCorrect ? 1 : 0,
      submissionMetadata: {
        correctMoves,
        correctSequence,
      },
    });

    res.json({
      success: true,
      data: {
        isCorrect,
        correctMoves,
        userMoves,
        message: isCorrect ? "Correct answer!" : "Incorrect answer. Try again!",
        gameResult: {
          id: playerSubmission.id,
          isCorrect,
          score: playerSubmission.score,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all game results
exports.getResults = async (req, res) => {
  try {
    const results = await PlayerSubmission.findAll({
      include: [
        {
          model: GameRound,
          as: "gameRound",
          where: { gameType: "hanoi" },
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
    });

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get results by player name
exports.getResultsByPlayer = async (req, res) => {
  try {
    const { playerName } = req.params;
    const { Op } = require("sequelize");

    const results = await PlayerSubmission.findAll({
      include: [
        {
          model: GameRound,
          as: "gameRound",
          where: {
            gameType: "hanoi",
            playerName: { [Op.like]: `%${playerName}%` },
          },
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
    });

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
