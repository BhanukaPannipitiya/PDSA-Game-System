/**
 * Test script to verify all games are working after MySQL migration
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5002/api';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, error = null) {
  if (passed) {
    log(`✓ ${name}`, 'green');
    testResults.passed++;
  } else {
    log(`✗ ${name}`, 'red');
    if (error) log(`  Error: ${error.message}`, 'red');
    testResults.failed++;
  }
  testResults.tests.push({ name, passed, error: error?.message });
}

async function testEndpoint(method, url, data = null, description) {
  try {
    const config = { method, url: `${BASE_URL}${url}` };
    if (data) {
      config.data = data;
    }
    const response = await axios(config);
    logTest(description, response.status >= 200 && response.status < 300);
    return { success: true, data: response.data };
  } catch (error) {
    logTest(description, false, error);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n=== Testing All Games After MySQL Migration ===\n', 'blue');

  // Test 1: Server Health Check
  log('\n1. Testing Server Health...', 'yellow');
  try {
    const response = await axios.get('http://localhost:5002/');
    logTest('Root endpoint', response.status >= 200 && response.status < 300);
  } catch (error) {
    logTest('Root endpoint', false, error);
  }

  // Test 2: Authentication (Create/Login Player)
  log('\n2. Testing Authentication...', 'yellow');
  const playerResult = await testEndpoint(
    'post',
    '/auth/signup',
    { name: 'TestPlayer' },
    'Player signup'
  );
  let playerId = null;
  if (playerResult.success && playerResult.data?.data?.player?.id) {
    playerId = playerResult.data.data.player.id;
    log(`  Player ID: ${playerId}`, 'blue');
  }

  // Test 3: Queens Game
  log('\n3. Testing Queens Game...', 'yellow');
  await testEndpoint('get', '/games/queens/stats', null, 'Get Queens stats');
  await testEndpoint('post', '/games/queens/compute', null, 'Compute Queens solutions');
  
  if (playerId) {
    await testEndpoint(
      'post',
      '/games/queens/submit',
      {
        playerId,
        playerName: 'TestPlayer',
        solution: [0, 4, 7, 5, 2, 6, 1, 3],
        algorithmTimes: { sequential: 1.5, threaded: 1.2 }
      },
      'Submit Queens solution'
    );
  }

  // Test 4: Hanoi Game
  log('\n4. Testing Tower of Hanoi Game...', 'yellow');
  await testEndpoint('get', '/games/hanoi/generate', null, 'Generate Hanoi game');
  
  const hanoiSolve = await testEndpoint(
    'post',
    '/games/hanoi/solve',
    { numDisks: 5, numPegs: 3 },
    'Solve Hanoi'
  );
  
  if (playerId && hanoiSolve.success) {
    await testEndpoint(
      'post',
      '/games/hanoi/submit',
      {
        playerId,
        playerName: 'TestPlayer',
        numDisks: 5,
        numPegs: 3,
        userMoves: 31,
        userSequence: hanoiSolve.data?.data?.sequence || []
      },
      'Submit Hanoi answer'
    );
  }

  // Test 5: Snake & Ladder Game
  log('\n5. Testing Snake & Ladder Game...', 'yellow');
  const snakeLadderStart = await testEndpoint(
    'post',
    '/games/snakeladder/start',
    { boardSize: 6 },
    'Start Snake & Ladder game'
  );
  
  if (playerId && snakeLadderStart.success) {
    await testEndpoint(
      'post',
      '/games/snakeladder/answer',
      {
        playerId,
        playerName: 'TestPlayer',
        selectedOption: snakeLadderStart.data?.data?.correctAnswer || 5,
        correctAnswer: snakeLadderStart.data?.data?.correctAnswer || 5,
        algoTimes: snakeLadderStart.data?.data?.algoTimes || { bfs: 1.0, biBfs: 1.0 },
        boardSize: 6
      },
      'Submit Snake & Ladder answer'
    );
  }

  // Test 6: Traffic Flow Game
  log('\n6. Testing Traffic Flow Game...', 'yellow');
  const trafficStart = await testEndpoint(
    'post',
    '/games/traffic/start',
    null,
    'Start Traffic Flow game'
  );
  
  if (playerId && trafficStart.success) {
    await testEndpoint(
      'post',
      '/games/traffic/answer',
      {
        playerId,
        playerName: 'TestPlayer',
        selectedAnswer: trafficStart.data?.data?.correctAnswer || 10,
        correctAnswer: trafficStart.data?.data?.correctAnswer || 10,
        algoTimes: trafficStart.data?.data?.algoTimes || { edmondsKarp: 1.0, fordFulkerson: 1.0 }
      },
      'Submit Traffic Flow answer'
    );
  }

  // Test 7: TSP Game
  log('\n7. Testing TSP Game...', 'yellow');
  const tspStart = await testEndpoint(
    'post',
    '/games/tsp/start',
    null,
    'Start TSP game'
  );
  
  if (playerId && tspStart.success && tspStart.data?.data) {
    const { homeCity, cities, distanceMatrix } = tspStart.data.data;
    const citiesToVisit = cities.filter(c => c !== homeCity).slice(0, 3);
    
    const tspSolve = await testEndpoint(
      'post',
      '/games/tsp/solve',
      {
        homeCity,
        citiesToVisit,
        distanceMatrix
      },
      'Solve TSP'
    );
    
    if (tspSolve.success && playerId) {
      await testEndpoint(
        'post',
        '/games/tsp/answer',
        {
          playerId,
          playerName: 'TestPlayer',
          homeCity,
          citiesToVisit,
          selectedRoute: tspSolve.data?.data?.results?.nearestNeighbor?.route || [homeCity, ...citiesToVisit, homeCity],
          selectedDistance: tspSolve.data?.data?.results?.nearestNeighbor?.distance || 100,
          correctDistance: tspSolve.data?.data?.shortestDistance || 100,
          algorithmTimes: {
            nearestNeighbor: tspSolve.data?.data?.results?.nearestNeighbor?.time || 1.0
          }
        },
        'Submit TSP answer'
      );
    }
  }

  // Test 8: Leaderboard
  log('\n8. Testing Leaderboard...', 'yellow');
  await testEndpoint('get', '/leaderboard/queens?limit=10', null, 'Get Queens leaderboard');
  await testEndpoint('get', '/leaderboard/snakeLadder?limit=10', null, 'Get Snake & Ladder leaderboard');

  // Summary
  log('\n=== Test Summary ===', 'blue');
  log(`Total Tests: ${testResults.passed + testResults.failed}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  
  if (testResults.failed > 0) {
    log('\nFailed Tests:', 'red');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => log(`  - ${t.name}: ${t.error}`, 'red'));
  }
  
  log('\n', 'reset');
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Check if server is running
axios.get(`${BASE_URL.replace('/api', '')}/`)
  .then(() => {
    log('Server is running, starting tests...\n', 'green');
    runTests();
  })
  .catch(() => {
    log('ERROR: Server is not running!', 'red');
    log('Please start the server first with: npm run dev', 'yellow');
    process.exit(1);
  });

