import { useState, useMemo } from "react";
import { startGame, submitAnswer } from "../services/api";
import Leaderboard from "../components/Leaderboard";
import "./SnakeLadderPage.css";

// Rules Card Component
function RulesCard() {
    return (
        <div className="rules-card">
            <h4>📋 Game Rules</h4>
            <ul className="rules-details">
                <li><strong>Dice Range:</strong> 1 to 6</li>
                <li><strong>Start:</strong> Cell 1</li>
                <li><strong>Goal:</strong> Reach the last cell</li>
                <li><strong>Ladders:</strong> Climb up when you land on the base</li>
                <li><strong>Snakes:</strong> Slide down when you land on the head</li>
                <li><strong>Challenge:</strong> Find the shortest path!</li>
            </ul>
        </div>
    );
}

// Visual Board component to display snakes and ladders
function Board({ snakes, ladders, boardSize }) {
    const totalCells = boardSize * boardSize;
    // Increased cell size for better visibility - made bigger
    const cellSize = Math.min(800 / boardSize, 80); // Responsive cell size - increased significantly
    
    // Create cell positions in snake pattern (zigzag)
    // Cell 1 at bottom-left, zigzag up
    // This calculation MUST match exactly how cells are rendered in the grid
    // We need to reverse-engineer the grid position from the cell number
    const cellPositions = useMemo(() => {
        const positions = {};
        
        // First, build a map of cellNum -> grid position by simulating the grid rendering
        const cellToGridPos = {};
        for (let i = 0; i < totalCells; i++) {
            // This matches the grid rendering logic exactly
            const row = Math.floor(i / boardSize); // Top-down row index (0 = top row)
            const rowFromBottom = boardSize - 1 - row; // Bottom-up row index (0 = bottom row)
            const isEvenRow = rowFromBottom % 2 === 0;
            const colInRow = i % boardSize; // Column within the row (0 = left)
            
            let cellNum;
            if (isEvenRow) {
                // Even rows (from bottom): left to right
                cellNum = rowFromBottom * boardSize + colInRow + 1;
            } else {
                // Odd rows (from bottom): right to left
                cellNum = rowFromBottom * boardSize + (boardSize - 1 - colInRow) + 1;
            }
            
            // Store the grid position (row, col) for this cell number
            // colInRow is the actual CSS grid column position
            cellToGridPos[cellNum] = { row, col: colInRow };
        }
        
        // Now calculate center coordinates for each cell
        // The center of a cell at grid position (row, col) is:
        // CSS Grid positions cells at: (col * cellSize, row * cellSize) for top-left corner
        // The geometric center is exactly at: (col * cellSize + cellSize/2, row * cellSize + cellSize/2)
        // This matches the actual rendered cell centers in the DOM
        for (let cellNum = 1; cellNum <= totalCells; cellNum++) {
            const gridPos = cellToGridPos[cellNum];
            if (!gridPos || gridPos.row === undefined || gridPos.col === undefined) {
                console.warn(`Missing grid position for cell ${cellNum}`);
                continue;
            }
            const { row, col } = gridPos;
            
            // Calculate exact center coordinates - these MUST be the geometric center of each cell
            // CSS Grid: cell at (row, col) has top-left corner at (col * cellSize, row * cellSize)
            // The center point is exactly at: (col * cellSize + cellSize/2, row * cellSize + cellSize/2)
            // This ensures snakes and ladders start/end at the exact middle of each cell
            const x = col * cellSize + cellSize / 2;
            const y = row * cellSize + cellSize / 2;
            
            positions[cellNum] = { x, y, row, col };
        }
        
        return positions;
    }, [boardSize, totalCells, cellSize]);

    // Calculate SVG dimensions
    const svgWidth = boardSize * cellSize;
    const svgHeight = boardSize * cellSize;

    return (
        <div className="snake-ladder-board-container">
            <h2>🎲 Snake & Ladder Board ({boardSize}x{boardSize})</h2>
            <div className="board-wrapper">
                <svg 
                    className="board-svg" 
                    width={svgWidth} 
                    height={svgHeight}
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                >
                    {/* SVG Filters for visual effects */}
                    <defs>
                        <filter id="snake-shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                            <feOffset dx="1" dy="1" result="offsetblur"/>
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.3"/>
                            </feComponentTransfer>
                            <feMerge>
                                <feMergeNode/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                        <filter id="ladder-glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    
                    {/* Draw Ladders (upward - green) - behind snakes */}
                    {ladders && Object.entries(ladders).map(([start, end]) => {
                        const startCell = parseInt(start);
                        const endCell = parseInt(end);
                        if (!cellPositions || !cellPositions[startCell] || !cellPositions[endCell]) return null;
                        const startPos = cellPositions[startCell];
                        const endPos = cellPositions[endCell];
                        
                        const startX = startPos.x;
                        const startY = startPos.y;
                        const endX = endPos.x;
                        const endY = endPos.y;
                        
                        const dx = endX - startX;
                        const dy = endY - startY;
                        const length = Math.sqrt(dx * dx + dy * dy);
                        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                        const perpAngle = angle + 90;
                        const perpX = Math.cos(perpAngle * Math.PI / 180) * 10;
                        const perpY = Math.sin(perpAngle * Math.PI / 180) * 10;
                        
                        const numRungs = Math.max(4, Math.floor(length / 12));
                        
                        return (
                            <g key={`ladder-${start}`} filter="url(#ladder-glow)">
                                {/* Ladder rails - thicker and more visible */}
                                <line
                                    x1={startX - perpX}
                                    y1={startY - perpY}
                                    x2={endX - perpX}
                                    y2={endY - perpY}
                                    stroke="#00FFAA"
                                    strokeWidth="7"
                                    strokeLinecap="round"
                                    opacity="0.95"
                                />
                                <line
                                    x1={startX + perpX}
                                    y1={startY + perpY}
                                    x2={endX + perpX}
                                    y2={endY + perpY}
                                    stroke="#00FFAA"
                                    strokeWidth="7"
                                    strokeLinecap="round"
                                    opacity="0.95"
                                />
                                
                                {/* Ladder rungs - more visible */}
                                {Array.from({ length: numRungs }).map((_, i) => {
                                    const t = (i + 1) / (numRungs + 1);
                                    const rungX = startX + dx * t;
                                    const rungY = startY + dy * t;
                                    return (
                                        <line
                                            key={i}
                                            x1={rungX - perpX}
                                            y1={rungY - perpY}
                                            x2={rungX + perpX}
                                            y2={rungY + perpY}
                                            stroke="#00D4AA"
                                            strokeWidth="5"
                                            strokeLinecap="round"
                                            opacity="0.95"
                                        />
                                    );
                                })}
                                
                                {/* Ladder top - wider to show it's the top */}
                                <line
                                    x1={endX - perpX * 1.5}
                                    y1={endY - perpY * 1.5}
                                    x2={endX + perpX * 1.5}
                                    y2={endY + perpY * 1.5}
                                    stroke="#00FFAA"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    opacity="1"
                                />
                                
                                {/* Ladder start point marker - centered in cell */}
                                <circle
                                    cx={startX}
                                    cy={startY}
                                    r="4"
                                    fill="#00FFAA"
                                    stroke="#00D4AA"
                                    strokeWidth="1.5"
                                    opacity="0.9"
                                />
                                
                                {/* Ladder end point marker - centered in cell */}
                                <circle
                                    cx={endX}
                                    cy={endY}
                                    r="5"
                                    fill="#00FFAA"
                                    stroke="#00D4AA"
                                    strokeWidth="1.5"
                                    opacity="0.9"
                                />
                            </g>
                        );
                    })}

                    {/* Draw Snakes (downward - red) with enhanced shapes */}
                    {snakes && Object.entries(snakes).map(([start, end]) => {
                        const startCell = parseInt(start);
                        const endCell = parseInt(end);
                        if (!cellPositions || !cellPositions[startCell] || !cellPositions[endCell]) return null;
                        const startPos = cellPositions[startCell];
                        const endPos = cellPositions[endCell];
                        
                        // Snake head at right edge of start cell (right corner)
                        // startPos.x is the cell center, so right edge is startPos.x + cellSize/2
                        // We'll position it slightly inset from the right edge for better visibility
                        const startX = startPos.x + (cellSize / 2) - 6; // Right edge, slightly inset
                        const startY = startPos.y; // Center vertically
                        
                        // Snake tail at center of end cell
                        const endX = endPos.x;     // Exact center of end cell (snake tail)
                        const endY = endPos.y;     // Exact center of end cell (snake tail)
                        
                        const dx = endX - startX;
                        const dy = endY - startY;
                        const length = Math.sqrt(dx * dx + dy * dy);
                        const controlX1 = startX + dx * 0.25;
                        const controlY1 = startY + dy * 0.25 + Math.min(20, length * 0.1);
                        const controlX2 = startX + dx * 0.75;
                        const controlY2 = startY + dy * 0.75 + Math.min(20, length * 0.1);
                        
                        // Path starts from right edge of start cell and ends at center of end cell
                        const path = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
                        
                        // Calculate number of segments for snake body
                        const numSegments = Math.max(6, Math.floor(length / 15));
                        
                        return (
                            <g key={`snake-${start}`} className="snake-group">
                                {/* Snake body - main path with gradient effect */}
                                <path
                                    d={path}
                                    fill="none"
                                    stroke="#FF6B8B"
                                    strokeWidth="9"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity="0.95"
                                    filter="url(#snake-shadow)"
                                />
                                
                                {/* Snake body segments - scale pattern */}
                                {Array.from({ length: numSegments }).map((_, i) => {
                                    const t = (i + 0.5) / numSegments;
                                    // Approximate position along curve
                                    const segX = startX + dx * t;
                                    const segY = startY + dy * t + Math.sin(t * Math.PI) * 10;
                                    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                                    
                                    return (
                                        <ellipse
                                            key={`scale-${i}`}
                                            cx={segX}
                                            cy={segY}
                                            rx="6"
                                            ry="4"
                                            fill="#FF0000"
                                            opacity="0.7"
                                            transform={`rotate(${angle} ${segX} ${segY})`}
                                        />
                                    );
                                })}
                                
                                {/* Snake pattern - scales outline */}
                                <path
                                    d={path}
                                    fill="none"
                                    stroke="#FF0000"
                                    strokeWidth="3"
                                    strokeDasharray="8,4"
                                    opacity="0.5"
                                />
                                
                                {/* Snake head - enhanced with eyes and tongue */}
                                <g className="snake-head">
                                    {/* Head circle */}
                                    <circle
                                        cx={startX}
                                        cy={startY}
                                        r="10"
                                        fill="#FF6B8B"
                                        stroke="#FF0000"
                                        strokeWidth="2.5"
                                        opacity="0.95"
                                    />
                                    {/* Head highlight */}
                                    <ellipse
                                        cx={startX - 3}
                                        cy={startY - 3}
                                        rx="4"
                                        ry="3"
                                        fill="#FFB6C1"
                                        opacity="0.6"
                                    />
                                    {/* Eyes */}
                                    <circle
                                        cx={startX - 4}
                                        cy={startY - 2}
                                        r="2"
                                        fill="#FFFFFF"
                                    />
                                    <circle
                                        cx={startX + 4}
                                        cy={startY - 2}
                                        r="2"
                                        fill="#FFFFFF"
                                    />
                                    <circle
                                        cx={startX - 4}
                                        cy={startY - 2}
                                        r="1"
                                        fill="#000000"
                                    />
                                    <circle
                                        cx={startX + 4}
                                        cy={startY - 2}
                                        r="1"
                                        fill="#000000"
                                    />
                                    {/* Tongue */}
                                    <line
                                        x1={startX}
                                        y1={startY + 8}
                                        x2={startX - 3}
                                        y2={startY + 12}
                                        stroke="#FF0000"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                    <line
                                        x1={startX}
                                        y1={startY + 8}
                                        x2={startX + 3}
                                        y2={startY + 12}
                                        stroke="#FF0000"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </g>
                                
                                {/* Snake tail - tapered */}
                                <g className="snake-tail">
                                    <circle
                                        cx={endX}
                                        cy={endY}
                                        r="6"
                                        fill="#FF0000"
                                        stroke="#FF6B8B"
                                        strokeWidth="2"
                                        opacity="0.9"
                                    />
                                    <ellipse
                                        cx={endX}
                                        cy={endY}
                                        rx="3"
                                        ry="6"
                                        fill="#FF6B8B"
                                        opacity="0.6"
                                    />
                                </g>
                            </g>
                        );
                    })}
                </svg>

                {/* Grid cells */}
                <div 
                    className="board-grid" 
                    style={{
                        gridTemplateColumns: `repeat(${boardSize}, ${cellSize}px)`,
                        gridTemplateRows: `repeat(${boardSize}, ${cellSize}px)`,
                        width: svgWidth,
                        height: svgHeight,
                        marginTop: '25px',
                        marginLeft: '25px'
                    }}
                >
                    {Array.from({ length: totalCells }, (_, i) => {
                        // Calculate cell number in snake pattern
                        // Grid is rendered top to bottom (row 0 = top), but cells are numbered bottom to top
                        // Cell 1 is at bottom-left, Cell N² is at top-left (zigzag pattern)
                        const row = Math.floor(i / boardSize); // Top-down row index (0 = top row)
                        const rowFromBottom = boardSize - 1 - row; // Bottom-up row index (0 = bottom row)
                        const isEvenRow = rowFromBottom % 2 === 0;
                        const colInRow = i % boardSize; // Column within the row (0 = left)
                        
                        let cellNum;
                        if (isEvenRow) {
                            // Even rows (from bottom): left to right
                            // Example: Bottom row (rowFromBottom=0): cells 1,2,3,4,5,6,7,8
                            cellNum = rowFromBottom * boardSize + colInRow + 1;
                        } else {
                            // Odd rows (from bottom): right to left
                            // Example: Second from bottom (rowFromBottom=1): cells 16,15,14,13,12,11,10,9
                            cellNum = rowFromBottom * boardSize + (boardSize - 1 - colInRow) + 1;
                        }
                        
                        // Check if this cell is a snake/ladder start or end
                        const isSnakeStart = snakes[cellNum] !== undefined;
                        const isLadderStart = ladders[cellNum] !== undefined;
                        const isSnakeEnd = Object.values(snakes).includes(cellNum);
                        const isLadderEnd = Object.values(ladders).includes(cellNum);
                        
                        // Get destination for hints
                        const snakeDest = isSnakeStart ? snakes[cellNum] : null;
                        const ladderDest = isLadderStart ? ladders[cellNum] : null;
                        
                        return (
                            <div
                                key={cellNum}
                                className={`board-cell ${
                                    cellNum === 1 ? 'start' : 
                                    cellNum === totalCells ? 'end' :
                                    isSnakeStart ? 'snake-start' :
                                    isLadderStart ? 'ladder-start' :
                                    isSnakeEnd ? 'snake-end' :
                                    isLadderEnd ? 'ladder-end' : ''
                                }`}
                                style={{
                                    width: `${cellSize}px`,
                                    height: `${cellSize}px`,
                                    minWidth: `${cellSize}px`,
                                    minHeight: `${cellSize}px`,
                                    maxWidth: `${cellSize}px`,
                                    maxHeight: `${cellSize}px`,
                                    boxSizing: 'border-box'
                                }}
                            >
                                {/* Cell number */}
                                <span className="cell-number">{cellNum}</span>
                                
                                {/* Start/End labels */}
                                {cellNum === 1 && <span className="cell-label start-label">START</span>}
                                {cellNum === totalCells && <span className="cell-label end-label">FINISH</span>}
                                
                                {/* Snake/Ladder destination indicators - cleaner display */}
                                {isLadderStart && (
                                    <div className="cell-destination ladder-dest" title={`Ladder to cell ${ladderDest}`}>
                                        <span className="dest-icon">🪜</span>
                                        <span className="dest-number">{ladderDest}</span>
                                    </div>
                                )}
                                {isSnakeStart && (
                                    <div className="cell-destination snake-dest" title={`Snake to cell ${snakeDest}`}>
                                        <span className="dest-icon">🐍</span>
                                        <span className="dest-number">{snakeDest}</span>
                                    </div>
                                )}
                                {(isSnakeEnd || isLadderEnd) && (
                                    <div className={`cell-end-marker ${isSnakeEnd ? 'snake-end' : 'ladder-end'}`}></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="board-legend">
                <div className="legend-item">
                    <div className="legend-color ladder"></div>
                    <span>🪜 Ladder (Climb Up)</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color snake"></div>
                    <span>🐍 Snake (Slide Down)</span>
                </div>
            </div>
            
            {/* Info text */}
            <div className="board-info-text">
                <p>💡 <strong>Tip:</strong> Ladders go UP (green), Snakes go DOWN (red). Head shows the start position!</p>
            </div>
        </div>
    );
}

// Options component for MCQ
function Options({ options, onSelect }) {
    return (
        <div className="snake-ladder-options">
            <h3>What is the minimum number of dice throws needed?</h3>
            <div className="options-grid">
                {options.map((option, index) => (
                    <button
                        key={index}
                        className="option-button"
                        onClick={() => onSelect(option)}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Result card component
function ResultCard({ result, algoTimes }) {
    return (
        <div className={`result-card ${result === "WIN" ? "win" : "lose"}`}>
            <h2>{result === "WIN" ? "🎉 You Win!" : "😔 You Lose"}</h2>
            <p>{result === "WIN" ? "Correct answer!" : "Wrong answer. Try again!"}</p>
            {algoTimes && (
                <div className="algorithm-times">
                    <h4>Algorithm Performance:</h4>
                    <div className="time-stats">
                        <div className="time-stat">
                            <span className="time-label">BFS:</span>
                            <span className="time-value">{algoTimes.bfs?.toFixed(2)} ms</span>
                        </div>
                        <div className="time-stat">
                            <span className="time-label">Bidirectional BFS:</span>
                            <span className="time-value">{algoTimes.biBfs?.toFixed(2)} ms</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SnakeLadderPage({ player, onBack }) {
    const [gameData, setGameData] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [boardSize, setBoardSize] = useState(8);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const handleStart = async () => {
        const size = parseInt(boardSize);
        if (!size || isNaN(size) || size < 6 || size > 12) {
            setError("Board size must be between 6 and 12");
            setBoardSize(8); // Reset to default
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await startGame(size);
            if (res.data.success) {
                setGameData(res.data.data);
                setResult(null);
            } else {
                setError("Failed to start game");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to start game");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (option) => {
        if (!player) {
            setError("Please login first");
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
        const res = await submitAnswer({
                playerId: player.id,
                playerName: player.name,
            selectedOption: option,
            correctAnswer: gameData.correctAnswer,
            algoTimes: gameData.algoTimes,
            boardSize: gameData.boardSize
        });
            if (res.data.success) {
                setResult(res.data.data.result);
            } else {
                setError("Failed to submit answer");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit answer");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setGameData(null);
        setResult(null);
        setError(null);
    };

    return (
        <div className="snake-ladder-container">
            <div className="page-header">
                {onBack && (
                    <button onClick={onBack} className="back-button">
                        ← Back
                    </button>
                )}
                <button 
                    onClick={() => setShowLeaderboard(true)} 
                    className="leaderboard-button"
                >
                    🏆 Leaderboard
                </button>
            </div>
            
            {error && (
                <div className="error-message">{error}</div>
            )}

            {!gameData ? (
                <div className="start-section">
                    <h2>🎲 Snake & Ladder Game</h2>
                    <p>Find the minimum number of dice throws needed to reach the end!</p>
                    <div className="board-size-selector">
                        <label htmlFor="boardSize">Select Board Size (N×N):</label>
                        <input
                            id="boardSize"
                            type="number"
                            min="6"
                            max="12"
                            step="1"
                            value={boardSize}
                            onChange={(e) => {
                                const inputValue = e.target.value;
                                // Allow empty string or any number input
                                if (inputValue === '') {
                                    setBoardSize('');
                                    setError(null);
                                } else {
                                    const numValue = parseInt(inputValue, 10);
                                    // Allow typing any number, validate later
                                    if (!isNaN(numValue)) {
                                        setBoardSize(numValue);
                                        setError(null);
                                    }
                                }
                            }}
                            onBlur={(e) => {
                                const value = parseInt(e.target.value, 10);
                                if (isNaN(value) || value < 6) {
                                    setBoardSize(6);
                                } else if (value > 12) {
                                    setBoardSize(12);
                                } else {
                                    setBoardSize(value);
                                }
                            }}
                            onKeyDown={(e) => {
                                // Allow: backspace, delete, tab, escape, enter, decimal point
                                if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                                    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                                    (e.keyCode === 65 && e.ctrlKey === true) ||
                                    (e.keyCode === 67 && e.ctrlKey === true) ||
                                    (e.keyCode === 86 && e.ctrlKey === true) ||
                                    (e.keyCode === 88 && e.ctrlKey === true) ||
                                    // Allow: home, end, left, right
                                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                                    return;
                                }
                                // Ensure that it is a number and stop the keypress
                                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                                    e.preventDefault();
                                }
                            }}
                            className="board-size-input"
                            disabled={loading}
                        />
                        <span className="board-size-info">
                            Board will have {boardSize - 2 || 4} ladders and {boardSize - 2 || 4} snakes
                        </span>
                    </div>
                    <button 
                        onClick={handleStart} 
                        disabled={loading}
                        className="start-button"
                    >
                        {loading ? "Starting..." : "Start Game"}
                    </button>
                </div>
            ) : !result ? (
                <>
                    <div className="game-board-section">
                        <div className="board-container-wrapper">
                            <Board 
                                snakes={gameData.snakes} 
                                ladders={gameData.ladders}
                                boardSize={gameData.boardSize}
                            />
                        </div>
                        {/* <RulesCard /> */}
                    </div>
                    <Options 
                        options={gameData.options} 
                        onSelect={handleSubmit}
                    />
                    {loading && <div className="loading">Submitting...</div>}
                </>
            ) : (
                <>
                    <ResultCard result={result} algoTimes={gameData?.algoTimes} />
                    <button onClick={handleReset} className="reset-button">
                        Play Again
                    </button>
                </>
            )}

            {showLeaderboard && (
                <Leaderboard 
                    gameType="snakeLadder" 
                    onClose={() => setShowLeaderboard(false)} 
                />
            )}
        </div>
    );
}
