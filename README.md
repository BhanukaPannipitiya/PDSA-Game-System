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
- **MongoDB Integration**: Persistent storage for game results and player data

### Tech Stack

**Frontend:**
- React 19.2.0
- Vite
- Axios
- Recharts (for data visualization)

**Backend:**
- Node.js
- Express 5.1.0
- MongoDB with Mongoose
- Worker Threads (for parallel processing)

## Algorithms Used Per Game

### 1. Eight Queens Puzzle

**Problem**: Place 8 queens on an 8×8 chessboard such that no two queens attack each other.

**Algorithms:**
- **Sequential Backtracking**: Classic recursive backtracking algorithm that explores all possible placements sequentially
  - Time Complexity: O(n!)
  - Space Complexity: O(n)
  
- **Threaded Backtracking**: Parallel implementation using worker threads, where each thread handles a different starting position
  - Time Complexity: O(n!) (parallelized)
  - Space Complexity: O(n) per thread
  - Performance: Faster execution through parallel processing

### 2. Snake and Ladder

**Problem**: Find the minimum number of dice rolls required to reach the end of the board from the start.

**Algorithms:**
- **BFS (Breadth-First Search)**: Standard BFS to find shortest path in unweighted graph
  - Time Complexity: O(V + E) where V = cells, E = edges
  - Space Complexity: O(V)
  
- **Bidirectional BFS**: Searches from both start and end simultaneously, meeting in the middle
  - Time Complexity: O(V + E) (typically faster in practice)
  - Space Complexity: O(V)
  - Performance: Often faster than standard BFS, especially for larger boards

### 3. Tower of Hanoi

**Problem**: Move all disks from source peg to destination peg using auxiliary pegs, following the rules of Tower of Hanoi.

**Algorithms:**

**For 3 Pegs:**
- **Recursive Solution**: Classic divide-and-conquer recursive approach
  - Time Complexity: O(2^n)
  - Space Complexity: O(n) (recursion stack)
  
- **Iterative Solution**: Stack-based iterative implementation
  - Time Complexity: O(2^n)
  - Space Complexity: O(n)
  - Performance: Avoids recursion overhead

**For 4 Pegs:**
- **Frame-Stewart Recursive**: Recursive implementation of the Frame-Stewart algorithm
  - Time Complexity: O(2^(n^(1/2)))
  - Space Complexity: O(n)
  
- **Frame-Stewart Iterative**: Iterative version of Frame-Stewart algorithm
  - Time Complexity: O(2^(n^(1/2)))
  - Space Complexity: O(n)
  - Performance: More efficient for 4-peg problems

### 4. Traffic Flow (Maximum Flow Problem)

**Problem**: Find the maximum flow from source (A) to sink (T) in a network with capacity constraints.

**Algorithms:**
- **Edmonds-Karp Algorithm**: BFS-based approach to find augmenting paths
  - Time Complexity: O(V × E²)
  - Space Complexity: O(V + E)
  - Performance: Guaranteed polynomial time, more predictable
  
- **Ford-Fulkerson Algorithm**: DFS-based approach to find augmenting paths
  - Time Complexity: O(E × max_flow) (can be exponential in worst case)
  - Space Complexity: O(V + E)
  - Performance: Faster in practice for many cases, but worst-case can be slow

### 5. Traveling Salesman Problem (TSP)

**Problem**: Find the shortest route that visits each city exactly once and returns to the starting city.

**Algorithms:**
- **Brute Force**: Generates all possible permutations and finds the minimum
  - Time Complexity: O(n!)
  - Space Complexity: O(n)
  - Performance: Only used for n ≤ 7 cities due to exponential growth
  
- **Nearest Neighbor (Greedy)**: Always visits the nearest unvisited city
  - Time Complexity: O(n²)
  - Space Complexity: O(n)
  - Performance: Fast but may not find optimal solution (approximation)
  
- **Dynamic Programming with Bitmasking**: Optimal solution using memoization
  - Time Complexity: O(2^n × n²)
  - Space Complexity: O(2^n × n)
  - Performance: Finds optimal solution, used for n ≤ 15 cities

## How to Run the Project

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas account)

### Installation Steps

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd PDSA-Game-System
   ```

2. **Set up the Backend**:
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend` directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/pdsa-game-system
   PORT=5002
   ```
   
   For MongoDB Atlas, use:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/pdsa-game-system
   PORT=5002
   ```

4. **Set up the Frontend**:
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start MongoDB** (if using local MongoDB):
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Linux
   sudo systemctl start mongod
   
   # On Windows
   net start MongoDB
   ```

2. **Start the Backend Server**:
   ```bash
   cd backend
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```
   
   The backend will run on `http://localhost:5002`

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
│   │   ├── algorithms/        # Core algorithm implementations
│   │   │   └── queens/
│   │   ├── config/            # Database configuration
│   │   ├── controllers/       # Request handlers
│   │   │   └── games/
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # MongoDB models
│   │   ├── routes/            # API routes
│   │   │   └── games/
│   │   ├── services/          # Business logic
│   │   │   └── games/
│   │   ├── tests/             # Test files
│   │   ├── utils/             # Utility functions
│   │   └── server.js          # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Game pages
│   │   ├── services/          # API service layer
│   │   └── utils/             # Utility functions
│   └── package.json
└── README.md
```

### Troubleshooting

**Backend won't start:**
- Ensure MongoDB is running
- Check that `MONGO_URI` in `.env` is correct
- Verify port 5002 is not already in use

**Frontend can't connect to backend:**
- Ensure backend is running on port 5002
- Check CORS configuration in `backend/src/server.js`
- Verify API endpoints in `frontend/src/services/api.js`

**Database connection issues:**
- Verify MongoDB is running (local) or connection string is correct (Atlas)
- Check network connectivity for MongoDB Atlas
- Ensure database credentials are correct

### API Endpoints

The backend provides RESTful API endpoints for each game:

- **Authentication**: `/api/auth/*`
- **Queens**: `/api/games/queens/*`
- **Snake & Ladder**: `/api/games/snake-ladder/*`
- **Tower of Hanoi**: `/api/games/hanoi/*`
- **Traffic Flow**: `/api/games/traffic/*`
- **TSP**: `/api/games/tsp/*`
- **Leaderboard**: `/api/leaderboard/*`

## Contributing

This is an educational project. Feel free to explore the codebase and experiment with different algorithms or game implementations.

## License

This project is created for educational purposes as part of the PDSA (Programming and Data Structures & Algorithms) course.

