import React from 'react';

const GameBoard = ({ numDisks, numPegs }) => {
  const pegs = numPegs === 3 ? ['A', 'B', 'D'] : ['A', 'B', 'C', 'D'];
  
  const getColor = (diskIndex) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B739', '#52B788'
    ];
    return colors[diskIndex % colors.length];
  };

  return (
    <div className="game-board">
      <div className="pegs-container">
        {pegs.map((peg) => (
          <div key={peg} className="peg-column">
            <div className="peg-label">{peg}</div>
            <div className="peg">
              {peg === 'A' && (
                <div className="disks">
                  {Array.from({ length: numDisks }).map((_, index) => {
                    const diskSize = numDisks - index;
                    const width = 30 + (diskSize * 15);
                    return (
                      <div
                        key={index}
                        className="disk"
                        style={{
                          width: `${width}px`,
                          backgroundColor: getColor(index),
                          bottom: `${index * 25}px`
                        }}
                      >
                        {diskSize}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="base"></div>
          </div>
        ))}
      </div>
      
      <div className="rules-box">
        <h4>Rules:</h4>
        <ul>
          <li>Only one disk can be moved at a time</li>
          <li>A larger disk cannot be placed on a smaller disk</li>
          <li>Move all disks from peg A to peg D</li>
          <li>Use auxiliary pegs to help</li>
        </ul>
      </div>
    </div>
  );
};

export default GameBoard;