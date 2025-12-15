/**
 * Script to generate 15 rounds of data for each game
 * 
 * WHAT IT DOES:
 * - Runs each game (Snake & Ladder, Traffic Flow, Tower of Hanoi, TSP, Queens) 15 times
 * - Each round uses different random inputs
 * - Stores results in game_rounds and algorithm_runs tables
 * - Creates a "system" player if it doesn't exist
 * 
 * USAGE:
 *   npm run generate-rounds
 *   OR
 *   node generate-15-rounds.js
 * 
 * REQUIREMENTS:
 * - Database must be running and accessible
 * - Environment variables must be set (DB_NAME, DB_USER, DB_PASSWORD, etc.)
 * 
 * OUTPUT:
 * - 15 rounds per game = 75 total rounds
 * - Each round has 2+ algorithm runs recorded
 * - All data is stored in MySQL database
 * 
 * VERIFICATION:
 * After running, you can verify with:
 *   SELECT COUNT(*) FROM game_rounds WHERE game_type = 'snakeLadder';
 *   SELECT COUNT(*) FROM algorithm_runs WHERE gameRoundId IN 
 *     (SELECT id FROM game_rounds WHERE game_type = 'snakeLadder');
 */

require('dotenv').config();
const { connectDB, sequelize } = require('./src/config/db');
const {
  Player,
  GameRound,
  AlgorithmRun,
  ReferenceSolution,
  PlayerSubmission,
} = require('./src/models');

// Import services
const snakeLadderService = require('./src/services/games/snakeLadderService');
const trafficService = require('./src/services/games/trafficService');
const tspService = require('./src/services/games/tspService');
const queensService = require('./src/services/games/queensService');
const {
  recursive3Pegs,
  iterative3Pegs,
  frameStewart4Pegs,
  iterativeFrameStewart4Pegs,
} = require('./src/services/games/hanoiService');
const { performance } = require('perf_hooks');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Small delay to ensure different timestamps
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get or create system player
async function getSystemPlayer() {
  let systemPlayer = await Player.findOne({ where: { name: 'system' } });
  if (!systemPlayer) {
    systemPlayer = await Player.create({ name: 'system' });
    log('Created system player', 'green');
  }
  return systemPlayer;
}

// Generate 15 rounds for Snake & Ladder
async function generateSnakeLadderRounds(systemPlayer) {
  log('\n=== Generating Snake & Ladder Rounds ===', 'cyan');
  const rounds = [];

  for (let round = 1; round <= 15; round++) {
    try {
      // Random board size between 6 and 12
      const boardSize = Math.floor(Math.random() * 7) + 6; // 6-12

      // Generate board with random snakes and ladders
      const { snakes, ladders } = snakeLadderService.generateBoard(boardSize);

      // Solve the board
      const result = snakeLadderService.solveBoard(snakes, ladders, boardSize);

      if (result.bfs === -1 || result.biBfs === -1) {
        log(`Round ${round}: No solution found, retrying...`, 'yellow');
        round--; // Retry this round
        continue;
      }

      // Create game round
      const gameRound = await GameRound.create({
        playerId: systemPlayer.id,
        playerName: 'system',
        gameType: 'snakeLadder',
        gameConfig: {
          boardSize,
          snakes,
          ladders,
          correctAnswer: result.bfs,
        },
      });

      // Store algorithm runs
      await AlgorithmRun.create({
        gameRoundId: gameRound.id,
        algorithmName: 'BFS',
        executionTimeMs: parseFloat(result.bfsTime.toFixed(4)),
        algorithmResult: {
          moves: result.bfs,
        },
      });

      await AlgorithmRun.create({
        gameRoundId: gameRound.id,
        algorithmName: 'Bidirectional BFS',
        executionTimeMs: parseFloat(result.biTime.toFixed(4)),
        algorithmResult: {
          moves: result.biBfs,
        },
      });

      // Store reference solution
      await ReferenceSolution.create({
        gameRoundId: gameRound.id,
        gameType: 'snakeLadder',
        solution: {
          correctAnswer: result.bfs,
        },
      });

      rounds.push(gameRound.id);
      log(`Round ${round}: Board size ${boardSize}, BFS: ${result.bfsTime.toFixed(4)}ms, BiBFS: ${result.biTime.toFixed(4)}ms`, 'green');
      
      // Small delay to ensure different timestamps
      await delay(100);
    } catch (error) {
      log(`Round ${round} failed: ${error.message}`, 'red');
    }
  }

  log(`✓ Generated ${rounds.length} Snake & Ladder rounds`, 'green');
  return rounds;
}

// Generate 15 rounds for Traffic Flow
async function generateTrafficRounds(systemPlayer) {
  log('\n=== Generating Traffic Flow Rounds ===', 'cyan');
  const rounds = [];

  for (let round = 1; round <= 15; round++) {
    try {
      // Generate network with random capacities
      const network = trafficService.generateNetwork();

      // Calculate max flow
      const result = trafficService.calculateMaxFlow(network.edges);

      // Create game round
      const gameRound = await GameRound.create({
        playerId: systemPlayer.id,
        playerName: 'system',
        gameType: 'traffic',
        gameConfig: {
          network,
          correctAnswer: result.maxFlow,
        },
      });

      // Store algorithm runs
      await AlgorithmRun.create({
        gameRoundId: gameRound.id,
        algorithmName: 'Edmonds-Karp',
        executionTimeMs: parseFloat(result.edmondsKarpTime.toFixed(4)),
        algorithmResult: {
          maxFlow: result.edmondsKarpFlow,
        },
      });

      await AlgorithmRun.create({
        gameRoundId: gameRound.id,
        algorithmName: 'Ford-Fulkerson',
        executionTimeMs: parseFloat(result.fordFulkersonTime.toFixed(4)),
        algorithmResult: {
          maxFlow: result.fordFulkersonFlow,
        },
      });

      // Store reference solution
      await ReferenceSolution.create({
        gameRoundId: gameRound.id,
        gameType: 'traffic',
        solution: {
          correctAnswer: result.maxFlow,
        },
      });

      rounds.push(gameRound.id);
      log(`Round ${round}: Max Flow ${result.maxFlow}, EK: ${result.edmondsKarpTime.toFixed(4)}ms, FF: ${result.fordFulkersonTime.toFixed(4)}ms`, 'green');
      
      // Small delay to ensure different timestamps
      await delay(100);
    } catch (error) {
      log(`Round ${round} failed: ${error.message}`, 'red');
    }
  }

  log(`✓ Generated ${rounds.length} Traffic Flow rounds`, 'green');
  return rounds;
}

// Generate 15 rounds for Tower of Hanoi
async function generateHanoiRounds(systemPlayer) {
  log('\n=== Generating Tower of Hanoi Rounds ===', 'cyan');
  const rounds = [];

  for (let round = 1; round <= 15; round++) {
    try {
      // Random number of disks (5-10)
      const numDisks = Math.floor(Math.random() * 6) + 5;
      // Random number of pegs (3 or 4)
      const numPegs = Math.random() < 0.5 ? 3 : 4;

      let solution1, solution2, time1, time2, algo1Name, algo2Name;

      if (numPegs === 3) {
        // Algorithm 1: Recursive
        const start1 = performance.now();
        solution1 = recursive3Pegs(numDisks, 'A', 'C', 'B');
        const end1 = performance.now();
        time1 = end1 - start1;
        algo1Name = 'Recursive 3-Peg';

        // Algorithm 2: Iterative
        const start2 = performance.now();
        solution2 = iterative3Pegs(numDisks, 'A', 'C', 'B');
        const end2 = performance.now();
        time2 = end2 - start2;
        algo2Name = 'Iterative 3-Peg';
      } else {
        // Algorithm 1: Frame-Stewart Recursive
        const start1 = performance.now();
        solution1 = frameStewart4Pegs(numDisks, 'A', 'D', 'B', 'C');
        const end1 = performance.now();
        time1 = end1 - start1;
        algo1Name = 'Frame-Stewart Recursive';

        // Algorithm 2: Frame-Stewart Iterative
        const start2 = performance.now();
        solution2 = iterativeFrameStewart4Pegs(numDisks, 'A', 'D', 'B', 'C');
        const end2 = performance.now();
        time2 = end2 - start2;
        algo2Name = 'Frame-Stewart Iterative';
      }

      const correctMoves = solution1.length;

      // Create game round
      const gameRound = await GameRound.create({
        playerId: systemPlayer.id,
        playerName: 'system',
        gameType: 'hanoi',
        gameConfig: {
          numDisks,
          numPegs,
          correctMoves,
        },
      });

      // Store algorithm runs
      await AlgorithmRun.create({
        gameRoundId: gameRound.id,
        algorithmName: algo1Name,
        executionTimeMs: parseFloat(time1.toFixed(4)),
        algorithmResult: {
          moves: correctMoves,
        },
      });

      await AlgorithmRun.create({
        gameRoundId: gameRound.id,
        algorithmName: algo2Name,
        executionTimeMs: parseFloat(time2.toFixed(4)),
        algorithmResult: {
          moves: correctMoves,
        },
      });

      // Store reference solution
      await ReferenceSolution.create({
        gameRoundId: gameRound.id,
        gameType: 'hanoi',
        solution: {
          correctMoves,
          correctSequence: solution1,
        },
      });

      rounds.push(gameRound.id);
      log(`Round ${round}: ${numDisks} disks, ${numPegs} pegs, ${correctMoves} moves, ${algo1Name}: ${time1.toFixed(4)}ms, ${algo2Name}: ${time2.toFixed(4)}ms`, 'green');
      
      // Small delay to ensure different timestamps
      await delay(100);
    } catch (error) {
      log(`Round ${round} failed: ${error.message}`, 'red');
    }
  }

  log(`✓ Generated ${rounds.length} Tower of Hanoi rounds`, 'green');
  return rounds;
}

// Generate 15 rounds for TSP
async function generateTSPRounds(systemPlayer) {
  log('\n=== Generating TSP Rounds ===', 'cyan');
  const rounds = [];

  for (let round = 1; round <= 15; round++) {
    try {
      // Generate cities
      const cities = tspService.generateCities();

      // Generate distance matrix with random distances
      const distanceMatrix = tspService.generateDistanceMatrix(cities);

      // Select random home city
      const homeCity = tspService.selectHomeCity(cities);

      // Select random cities to visit (3-7 cities to keep algorithms feasible)
      const availableCities = cities.filter(c => c !== homeCity);
      const numCitiesToVisit = Math.floor(Math.random() * 5) + 3; // 3-7 cities
      const shuffled = availableCities.sort(() => Math.random() - 0.5);
      const citiesToVisit = shuffled.slice(0, numCitiesToVisit);

      // Solve TSP
      const results = tspService.solveTSP(homeCity, citiesToVisit, distanceMatrix);

      // Create game round
      const gameRound = await GameRound.create({
        playerId: systemPlayer.id,
        playerName: 'system',
        gameType: 'tsp',
        gameConfig: {
          homeCity,
          citiesToVisit,
          shortestDistance: results.shortestDistance,
        },
      });

      // Store algorithm runs (only if they were executed)
      if (results.bruteForce && results.bruteForce.time !== null) {
        await AlgorithmRun.create({
          gameRoundId: gameRound.id,
          algorithmName: 'Brute Force',
          executionTimeMs: parseFloat(results.bruteForce.time.toFixed(4)),
          algorithmResult: {
            distance: results.bruteForce.distance,
            route: results.bruteForce.route,
          },
        });
      }

      if (results.nearestNeighbor && results.nearestNeighbor.time !== null) {
        await AlgorithmRun.create({
          gameRoundId: gameRound.id,
          algorithmName: 'Nearest Neighbor',
          executionTimeMs: parseFloat(results.nearestNeighbor.time.toFixed(4)),
          algorithmResult: {
            distance: results.nearestNeighbor.distance,
            route: results.nearestNeighbor.route,
          },
        });
      }

      if (results.dynamicProgramming && results.dynamicProgramming.time !== null) {
        await AlgorithmRun.create({
          gameRoundId: gameRound.id,
          algorithmName: 'Dynamic Programming',
          executionTimeMs: parseFloat(results.dynamicProgramming.time.toFixed(4)),
          algorithmResult: {
            distance: results.dynamicProgramming.distance,
            route: results.dynamicProgramming.route,
          },
        });
      }

      // Store reference solution
      await ReferenceSolution.create({
        gameRoundId: gameRound.id,
        gameType: 'tsp',
        solution: {
          correctDistance: results.shortestDistance,
        },
      });

      rounds.push(gameRound.id);
      const algos = [];
      if (results.bruteForce?.time) algos.push(`BF: ${results.bruteForce.time.toFixed(4)}ms`);
      if (results.nearestNeighbor?.time) algos.push(`NN: ${results.nearestNeighbor.time.toFixed(4)}ms`);
      if (results.dynamicProgramming?.time) algos.push(`DP: ${results.dynamicProgramming.time.toFixed(4)}ms`);
      log(`Round ${round}: ${numCitiesToVisit} cities, Distance: ${results.shortestDistance}, ${algos.join(', ')}`, 'green');
      
      // Small delay to ensure different timestamps
      await delay(100);
    } catch (error) {
      log(`Round ${round} failed: ${error.message}`, 'red');
    }
  }

  log(`✓ Generated ${rounds.length} TSP rounds`, 'green');
  return rounds;
}

// Generate 15 rounds for Queens
async function generateQueensRounds(systemPlayer) {
  log('\n=== Generating Queens Rounds ===', 'cyan');
  const rounds = [];

  // Get current count of rounds before starting
  const initialCount = await GameRound.count({
    where: {
      playerId: systemPlayer.id,
      gameType: 'queens',
    },
  });

  for (let round = 1; round <= 15; round++) {
    try {
      // Use computeAndPersistRun which runs both algorithms and stores results
      // This function already creates a game round and algorithm runs
      await queensService.computeAndPersistRun();

      // Get the newly created game round (should be the one at position initialCount + round)
      const gameRounds = await GameRound.findAll({
        where: {
          playerId: systemPlayer.id,
          gameType: 'queens',
        },
        order: [['createdAt', 'ASC']],
        limit: initialCount + round,
      });

      const gameRound = gameRounds[gameRounds.length - 1];

      if (gameRound) {
        // Get algorithm runs for this round
        const algorithmRuns = await AlgorithmRun.findAll({
          where: { gameRoundId: gameRound.id },
        });

        rounds.push(gameRound.id);
        const sequentialRun = algorithmRuns.find(r => r.algorithmName === 'Sequential');
        const threadedRun = algorithmRuns.find(r => r.algorithmName === 'Threaded');
        
        if (sequentialRun && threadedRun) {
          log(`Round ${round}: Sequential: ${sequentialRun.executionTimeMs.toFixed(4)}ms, Threaded: ${threadedRun.executionTimeMs.toFixed(4)}ms`, 'green');
        } else {
          log(`Round ${round}: Created successfully`, 'green');
        }
      } else {
        log(`Round ${round}: Warning - Game round not found after creation`, 'yellow');
      }
      
      // Small delay to ensure different timestamps
      await delay(100);
    } catch (error) {
      log(`Round ${round} failed: ${error.message}`, 'red');
    }
  }

  log(`✓ Generated ${rounds.length} Queens rounds`, 'green');
  return rounds;
}

// Main function
async function main() {
  try {
    log('\n🚀 Starting 15-Round Data Generation Script\n', 'blue');

    // Connect to database
    await connectDB();
    log('✓ Database connected', 'green');

    // Get or create system player
    const systemPlayer = await getSystemPlayer();
    log(`✓ Using system player (ID: ${systemPlayer.id})\n`, 'green');

    // Generate rounds for each game
    const results = {
      snakeLadder: [],
      traffic: [],
      hanoi: [],
      tsp: [],
      queens: [],
    };

    // Generate Snake & Ladder rounds
    results.snakeLadder = await generateSnakeLadderRounds(systemPlayer);

    // Generate Traffic Flow rounds
    results.traffic = await generateTrafficRounds(systemPlayer);

    // Generate Tower of Hanoi rounds
    results.hanoi = await generateHanoiRounds(systemPlayer);

    // Generate TSP rounds
    results.tsp = await generateTSPRounds(systemPlayer);

    // Generate Queens rounds
    results.queens = await generateQueensRounds(systemPlayer);

    // Summary
    log('\n=== Generation Summary ===', 'blue');
    log(`Snake & Ladder: ${results.snakeLadder.length} rounds`, 'cyan');
    log(`Traffic Flow: ${results.traffic.length} rounds`, 'cyan');
    log(`Tower of Hanoi: ${results.hanoi.length} rounds`, 'cyan');
    log(`TSP: ${results.tsp.length} rounds`, 'cyan');
    log(`Queens: ${results.queens.length} rounds`, 'cyan');

    const totalRounds = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
    log(`\n✓ Total: ${totalRounds} rounds generated successfully!`, 'green');

    // Verify data
    log('\n=== Verifying Data ===', 'blue');
    for (const [gameType, roundIds] of Object.entries(results)) {
      const gameRounds = await GameRound.count({
        where: { id: roundIds, gameType },
      });
      const algorithmRuns = await AlgorithmRun.count({
        include: [
          {
            model: GameRound,
            as: 'gameRound',
            where: { id: roundIds, gameType },
          },
        ],
      });
      log(`${gameType}: ${gameRounds} rounds, ${algorithmRuns} algorithm runs`, 'cyan');
    }

    log('\n✅ Script completed successfully!', 'green');
    log('\nYou can now query the database:', 'yellow');
    log('SELECT * FROM game_rounds WHERE game_type = \'snakeLadder\';', 'yellow');
    log('SELECT * FROM algorithm_runs WHERE gameRoundId IN (SELECT id FROM game_rounds WHERE game_type = \'snakeLadder\');', 'yellow');
    log('\n', 'reset');

    process.exit(0);
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();

