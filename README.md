# PDSA Game System

A full-stack web application that implements various algorithmic games to demonstrate and compare different problem-solving approaches. The system features interactive games where players can solve problems while the backend compares multiple algorithmic solutions in real-time.

## Project Overview

This project is an educational game system built with React (frontend) and Node.js/Express (backend), designed to showcase different algorithms and data structures through interactive gameplay. Each game implements multiple algorithmic approaches, allowing players to see performance comparisons and learn about algorithm efficiency.

### Key Features

- **5 Interactive Algorithm Games**: Eight Queens, Snake & Ladder, Tower of Hanoi, Traffic Flow, and Traveling Salesman Problem
- **Algorithm Comparison**: Each game runs multiple algorithms simultaneously and displays performance metrics
- **User Authentication**: Player registration and login system
- **Leaderboard**: Track player scores and achievements
- **Real-time Performance Metrics**: Execution time comparisons between different algorithmic approaches
- **MySQL Database**: Relational database with Sequelize ORM for persistent storage of game results and player data
- **Unified Game Lifecycle**: All games follow a consistent data model for easy maintenance and extensibility

### Tech Stack

**Frontend:**
- React 19.2.0
- Vite 7.2.4
- Axios 1.13.2
- Recharts 3.4.1 (for data visualization)

**Backend:**
- Node.js
- Express 5.1.0
- MySQL with Sequelize 6.37.3 (ORM)
- mysql2 3.11.5 (MySQL driver)
- Worker Threads (for parallel processing in Queens game)

## Database Schema

The system uses a unified relational schema with 5 core tables that support all games:

### Core Tables

1. **players** - Stores player information
   - `id` (INTEGER, Primary Key, Auto Increment)
   - `name` (STRING(50), Unique, Not Null)
   - `createdAt`, `updatedAt` (Timestamps)

2. **game_rounds** - Represents a game instance/round
   - `id` (INTEGER, Primary Key, Auto Increment)
   - `playerId` (INTEGER, Foreign Key → players.id)
   - `playerName` (STRING(50), Not Null)
   - `gameType` (ENUM: "queens", "snakeLadder", "traffic", "tsp", "hanoi")
   - `gameConfig` (JSON) - Stores game-specific configuration
   - `createdAt`, `updatedAt` (Timestamps)

3. **algorithm_runs** - Stores algorithm execution times and results
   - `id` (INTEGER, Primary Key, Auto Increment)
   - `gameRoundId` (INTEGER, Foreign Key → game_rounds.id)
   - `algorithmName` (STRING(100)) - e.g., "BFS", "Sequential", "Edmonds-Karp"
   - `executionTimeMs` (DECIMAL(12,4)) - Algorithm execution time in milliseconds
   - `algorithmResult` (JSON) - Algorithm-specific results
   - `createdAt`, `updatedAt` (Timestamps)

4. **player_submissions** - Stores player answers/submissions
   - `id` (INTEGER, Primary Key, Auto Increment)
   - `gameRoundId` (INTEGER, Foreign Key → game_rounds.id, Unique)
   - `playerId` (INTEGER, Foreign Key → players.id)
   - `playerAnswer` (JSON) - Player's submission (varies by game type)
   - `isCorrect` (BOOLEAN, Default: false)
   - `score` (INTEGER, Default: 0)
   - `submissionMetadata` (JSON) - Additional metadata
   - `createdAt`, `updatedAt` (Timestamps)

5. **reference_solutions** - Stores correct solutions
   - `id` (INTEGER, Primary Key, Auto Increment)
   - `gameRoundId` (INTEGER, Foreign Key → game_rounds.id, Nullable)
   - `gameType` (ENUM: "queens", "snakeLadder", "traffic", "tsp", "hanoi")
   - `solutionKey` (STRING(500), Nullable) - Unique identifier (for Queens game)
   - `solution` (JSON) - The correct solution
   - `recognized` (BOOLEAN, Default: false) - For Queens game tracking
   - `recognizedBy` (STRING(50), Nullable)
   - `recognizedAt` (DATE, Nullable)
   - `createdAt`, `updatedAt` (Timestamps)
   - Unique Index: (gameType, solutionKey)

### Table Relationships

```
Player (1) ──< (N) GameRound
GameRound (1) ──< (N) AlgorithmRun
GameRound (1) ──< (1) PlayerSubmission
GameRound (1) ──< (N) ReferenceSolution
Player (1) ──< (N) PlayerSubmission
```

### Game Lifecycle

All games follow this unified lifecycle:

1. **Game Round Creation**: `GameRound` created with game configuration
2. **Algorithm Execution**: `AlgorithmRun` records created for each algorithm
3. **Reference Solution Storage**: `ReferenceSolution` created with correct answer
4. **Player Submission**: `PlayerSubmission` created with player's answer
5. **Evaluation**: Correctness determined and stored in `isCorrect` field

## Algorithms Used Per Game

### 1. Eight Queens Puzzle

**Problem**: Place 8 queens on an 8×8 chessboard such that no two queens attack each other.

**Algorithms:**
- **Sequential Backtracking**: Classic recursive backtracking algorithm that explores all possible placements sequentially using constraint checking (columns, diagonals)
  - Time Complexity: O(n!)
  - Space Complexity: O(n)
  - Implementation: Uses sets to track columns and diagonals for efficient conflict detection
  
- **Threaded Backtracking**: Parallel implementation using worker threads, where each thread handles a different starting position
  - Time Complexity: O(n!) (parallelized)
  - Space Complexity: O(n) per thread
  - Performance: Faster execution through parallel processing across multiple CPU cores
  - Implementation: Distributes work across worker threads for concurrent solution finding

### 2. Snake and Ladder

**Problem**: Find the minimum number of dice rolls required to reach the end of the board from the start, considering snakes and ladders.

**Algorithms:**
- **BFS (Breadth-First Search)**: Standard BFS to find shortest path in unweighted graph representation of the board
  - Time Complexity: O(V + E) where V = cells, E = edges (dice moves + snakes/ladders)
  - Space Complexity: O(V)
  - Implementation: Models board as graph where each cell connects to next 6 cells (dice rolls) plus snake/ladder connections
  
- **Bidirectional BFS**: Searches from both start and end simultaneously, meeting in the middle
  - Time Complexity: O(V + E) (typically faster in practice)
  - Space Complexity: O(V)
  - Performance: Often faster than standard BFS, especially for larger boards, as it explores fewer nodes
  - Implementation: Maintains two queues and checks for intersection between forward and backward searches

### 3. Tower of Hanoi

**Problem**: Move all disks from source peg to destination peg using auxiliary pegs, following the rules of Tower of Hanoi (only move one disk at a time, never place larger disk on smaller).

**Algorithms:**

**For 3 Pegs:**
- **Recursive Solution**: Classic divide-and-conquer recursive approach
  - Time Complexity: O(2^n)
  - Space Complexity: O(n) (recursion stack)
  - Implementation: Recursively moves n-1 disks to auxiliary, moves largest to destination, then moves n-1 to destination
  
- **Iterative Solution**: Stack-based iterative implementation using explicit stack
  - Time Complexity: O(2^n)
  - Space Complexity: O(n)
  - Performance: Avoids recursion overhead, uses iterative pattern based on move number
  - Implementation: Uses pattern-based approach where move direction depends on disk number and total moves

**For 4 Pegs:**
- **Frame-Stewart Recursive**: Recursive implementation of the Frame-Stewart algorithm (optimal for 4 pegs)
  - Time Complexity: O(2^(n^(1/2)))
  - Space Complexity: O(n)
  - Implementation: Optimally splits disks into groups, uses 4 pegs for first group, 3 pegs for remainder
  - Optimal k value: k = ⌈n - √(2n + 1) + 1⌉
  
- **Frame-Stewart Iterative**: Iterative version using stack-based simulation
  - Time Complexity: O(2^(n^(1/2)))
  - Space Complexity: O(n)
  - Performance: More efficient for 4-peg problems, avoids recursion overhead
  - Implementation: Simulates recursive calls using explicit stack with phase tracking

### 4. Traffic Flow (Maximum Flow Problem)

**Problem**: Find the maximum flow from source (A) to sink (T) in a network with capacity constraints on edges.

**Algorithms:**
- **Edmonds-Karp Algorithm**: BFS-based approach to find augmenting paths
  - Time Complexity: O(V × E²) where V = vertices, E = edges
  - Space Complexity: O(V + E)
  - Performance: Guaranteed polynomial time, more predictable performance
  - Implementation: Uses BFS to find shortest augmenting path in residual graph, updates flow iteratively
  
- **Ford-Fulkerson Algorithm**: DFS-based approach to find augmenting paths
  - Time Complexity: O(E × max_flow) (can be exponential in worst case)
  - Space Complexity: O(V + E)
  - Performance: Faster in practice for many cases, but worst-case can be slow
  - Implementation: Uses DFS to find any augmenting path, may take longer paths than BFS

### 5. Traveling Salesman Problem (TSP)

**Problem**: Find the shortest route that visits each city exactly once and returns to the starting city.

**Algorithms:**
- **Brute Force**: Generates all possible permutations and finds the minimum
  - Time Complexity: O(n!)
  - Space Complexity: O(n)
  - Performance: Only used for n ≤ 7 cities due to exponential growth
  - Implementation: Generates all permutations, calculates distance for each, returns minimum
  
- **Nearest Neighbor (Greedy)**: Always visits the nearest unvisited city
  - Time Complexity: O(n²)
  - Space Complexity: O(n)
  - Performance: Fast but may not find optimal solution (approximation algorithm)
  - Implementation: Starts from home city, repeatedly selects closest unvisited city
  
- **Dynamic Programming with Bitmasking**: Optimal solution using memoization
  - Time Complexity: O(2^n × n²)
  - Space Complexity: O(2^n × n)
  - Performance: Finds optimal solution, used for n ≤ 15 cities
  - Implementation: Uses bitmask to represent visited cities subset, memoizes subproblems
  - State: dp[mask][lastCity] = minimum distance to visit cities in mask ending at lastCity

## How to Run the Project

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MySQL Server (v5.7 or higher, or MySQL 8.0+)

### Installation Steps

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd PDSA-Game-System
   ```

2. **Set up MySQL Database**:
   ```sql
   CREATE DATABASE pdsa_game_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Set up the Backend**:
   ```bash
   cd backend
   npm install
   ```

4. **Configure Environment Variables**:
   Create a `.env` file in the `backend` directory:
   ```env
   # Database Configuration
   DB_NAME=pdsa_game_system
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_HOST=localhost
   DB_PORT=3306

   # Server Configuration
   PORT=5002
   NODE_ENV=development
   ```

5. **Set up the Frontend**:
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start MySQL Server**:
   ```bash
   # On macOS with Homebrew
   brew services start mysql
   
   # On Linux
   sudo systemctl start mysql
   # or
   sudo service mysql start
   
   # On Windows
   net start MySQL80
   # or check Services panel for MySQL service
   ```

2. **Start the Backend Server**:
   ```bash
   cd backend
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```
   
   The backend will:
   - Connect to MySQL database
   - Automatically create/update tables (in development mode)
   - Start listening on `http://localhost:5002`
   
   You should see:
   ```
   MySQL Connected Successfully!
   Database synchronized!
   Server running on port 5002
   ```

3. **Start the Frontend Development Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   
   The frontend will typically run on `http://localhost:5173` (Vite default port)

4. **Access the Application**:
   Open your browser and navigate to the frontend URL (usually `http://localhost:5173`)

### Development Scripts

**Backend:**
- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon (auto-reload)
- `npm test` - Run test suite

**Frontend:**
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
PDSA-Game-System/
├── backend/
│   ├── src/
│   │   ├── algorithms/          # Core algorithm implementations
│   │   │   ├── queens/          # Sequential and threaded solvers
│   │   │   ├── snakeLadder/     # BFS and bidirectional BFS
│   │   │   ├── hanoi/           # Recursive and iterative solutions
│   │   │   ├── trafficFlow/     # Edmonds-Karp and Ford-Fulkerson
│   │   │   └── tsp/             # Brute force, greedy, and DP solutions
│   │   ├── config/              # Database configuration (Sequelize)
│   │   ├── controllers/         # Request handlers
│   │   │   ├── games/           # Game-specific controllers
│   │   │   ├── authController.js
│   │   │   └── leaderboardController.js
│   │   ├── middleware/          # Express middleware
│   │   │   ├── errorMiddleware.js
│   │   │   └── validate.js
│   │   ├── models/              # Sequelize models
│   │   │   ├── Player.js
│   │   │   ├── GameRound.js
│   │   │   ├── AlgorithmRun.js
│   │   │   ├── PlayerSubmission.js
│   │   │   ├── ReferenceSolution.js
│   │   │   └── index.js         # Model associations
│   │   ├── routes/              # API routes
│   │   │   ├── games/           # Game-specific routes
│   │   │   ├── authRoute.js
│   │   │   ├── leaderboardRoute.js
│   │   │   └── index.js
│   │   ├── services/            # Business logic
│   │   │   └── games/           # Game-specific services
│   │   ├── tests/               # Test files
│   │   ├── utils/               # Utility functions
│   │   └── server.js            # Entry point
│   ├── SETUP.md                 # Detailed setup instructions
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ChartComponent.jsx
│   │   │   ├── GameBoard.jsx
│   │   │   ├── GameMenu.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── LoginSignup.jsx
│   │   │   ├── ResultModal.jsx
│   │   │   └── WinLoseModal.jsx
│   │   ├── pages/               # Game pages
│   │   │   ├── QueensPage.jsx
│   │   │   ├── SnakeLadderPage.jsx
│   │   │   ├── TowerOfHanoi.jsx
│   │   │   ├── TrafficPage.jsx
│   │   │   └── TspPage.jsx
│   │   ├── services/            # API service layer
│   │   │   └── api.js
│   │   ├── utils/               # Utility functions
│   │   └── App.jsx
│   └── package.json
├── MIGRATION_SUMMARY.md         # MongoDB to MySQL migration details
└── README.md
```

### Troubleshooting

**Backend won't start:**
- Ensure MySQL is running
- Check that database credentials in `.env` are correct
- Verify port 5002 is not already in use
- Check MySQL connection: `mysql -u root -p` and verify database exists

**MySQL Connection Errors:**
- **Error:** `Access denied for user`
  - Solution: Verify `DB_USER` and `DB_PASSWORD` in `.env` are correct
  - Check MySQL user permissions: `SHOW GRANTS FOR 'root'@'localhost';`

- **Error:** `ER_NOT_SUPPORTED_AUTH_MODE`
  - Solution: Update MySQL user authentication:
    ```sql
    ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
    FLUSH PRIVILEGES;
    ```

- **Error:** `ECONNREFUSED`
  - Solution: Ensure MySQL server is running
  - Check MySQL is listening on correct port (default 3306)

**Database tables not created:**
- Check database connection is successful
- Verify user has CREATE TABLE permissions
- Check `NODE_ENV` is set to `development` for auto-sync
- Manually verify database: `USE pdsa_game_system; SHOW TABLES;`

**Frontend can't connect to backend:**
- Ensure backend is running on port 5002
- Check CORS configuration in `backend/src/server.js`
- Verify API endpoints in `frontend/src/services/api.js`
- Check browser console for CORS errors

**Algorithm execution errors:**
- Check Node.js version (v14+ required)
- For Queens threaded solver, ensure sufficient system resources
- For TSP brute force, ensure city count ≤ 7

### API Endpoints

The backend provides RESTful API endpoints for each game:

**Authentication:**
- `POST /api/auth/register` - Register new player
- `POST /api/auth/login` - Login player

**Games:**
- `POST /api/games/queens/start` - Start new Queens game
- `POST /api/games/queens/submit` - Submit Queens solution
- `POST /api/games/snakeladder/start` - Start Snake & Ladder game
- `POST /api/games/snakeladder/submit` - Submit Snake & Ladder answer
- `POST /api/games/hanoi/solve` - Solve Tower of Hanoi
- `POST /api/games/hanoi/submit` - Submit Hanoi solution
- `POST /api/games/traffic/start` - Start Traffic Flow game
- `POST /api/games/traffic/submit` - Submit Traffic Flow answer
- `POST /api/games/tsp/start` - Start TSP game
- `POST /api/games/tsp/submit` - Submit TSP route

**Leaderboard:**
- `GET /api/leaderboard` - Get leaderboard data
- `GET /api/leaderboard/:gameType` - Get leaderboard for specific game

## Database Design Philosophy

The system uses a **unified relational schema** that supports all games through a consistent data model:

- **Flexibility**: JSON columns (`gameConfig`, `playerAnswer`, `algorithmResult`, `solution`) allow game-specific data while maintaining relational structure
- **Consistency**: All games follow the same lifecycle (GameRound → AlgorithmRun → ReferenceSolution → PlayerSubmission)
- **Extensibility**: Easy to add new games by following the established pattern
- **Performance**: Indexed foreign keys and gameType for efficient queries
- **Data Integrity**: Foreign key constraints ensure referential integrity

## Contributing

This is an educational project. Feel free to explore the codebase and experiment with different algorithms or game implementations.

## License

This project is created for educational purposes as part of the PDSA (Programming and Data Structures & Algorithms) course.
