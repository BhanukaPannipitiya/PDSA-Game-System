// Algorithm 1: Recursive Solution for 3 Pegs
function recursive3Pegs(n, source, destination, auxiliary) {
  const moves = [];
  
  function solve(n, src, dest, aux) {
    if (n === 1) {
      moves.push(`${src} -> ${dest}`);
      return;
    }
    solve(n - 1, src, aux, dest);
    moves.push(`${src} -> ${dest}`);
    solve(n - 1, aux, dest, src);
  }
  
  solve(n, source, destination, auxiliary);
  return moves;
}

// Algorithm 2: Iterative Solution for 3 Pegs
function iterative3Pegs(n, source, destination, auxiliary) {
  const moves = [];
  const totalMoves = Math.pow(2, n) - 1;
  
  const pegs = { A: [], B: [], C: [] };
  for (let i = n; i >= 1; i--) {
    pegs[source].push(i);
  }
  
  const pegNames = [source, auxiliary, destination];
  if (n % 2 === 0) {
    [pegNames[1], pegNames[2]] = [pegNames[2], pegNames[1]];
  }
  
  for (let i = 1; i <= totalMoves; i++) {
    if (i % 3 === 1) {
      moveDisk(pegs, pegNames[0], pegNames[2], moves);
    } else if (i % 3 === 2) {
      moveDisk(pegs, pegNames[0], pegNames[1], moves);
    } else {
      moveDisk(pegs, pegNames[1], pegNames[2], moves);
    }
  }
  
  return moves;
}

function moveDisk(pegs, from, to, moves) {
  if (pegs[from].length === 0) {
    [from, to] = [to, from];
  } else if (pegs[to].length === 0) {
    // Move from 'from' to 'to'
  } else if (pegs[from][pegs[from].length - 1] > pegs[to][pegs[to].length - 1]) {
    [from, to] = [to, from];
  }
  
  const disk = pegs[from].pop();
  pegs[to].push(disk);
  moves.push(`${from} -> ${to}`);
}

// Algorithm 3: Frame-Stewart Algorithm for 4 Pegs (Recursive)
function frameStewart4Pegs(n, source, destination, aux1, aux2) {
  const moves = [];
  
  function solve(n, src, dest, aux1, aux2) {
    if (n === 0) return;
    if (n === 1) {
      moves.push(`${src} -> ${dest}`);
      return;
    }
    
    // Optimal k value (approximation)
    const k = Math.ceil(n - Math.sqrt(2 * n + 1) + 1);
    
    // Move top k disks from source to aux1 using all 4 pegs
    solve(k, src, aux1, aux2, dest);
    
    // Move remaining n-k disks from source to destination using 3 pegs
    solve3Pegs(n - k, src, dest, aux2, moves);
    
    // Move k disks from aux1 to destination using all 4 pegs
    solve(k, aux1, dest, src, aux2);
  }
  
  function solve3Pegs(n, src, dest, aux, movesList) {
    if (n === 1) {
      movesList.push(`${src} -> ${dest}`);
      return;
    }
    solve3Pegs(n - 1, src, aux, dest, movesList);
    movesList.push(`${src} -> ${dest}`);
    solve3Pegs(n - 1, aux, dest, src, movesList);
  }
  
  solve(n, source, destination, aux1, aux2);
  return moves;
}

// Algorithm 4: Iterative Frame-Stewart for 4 Pegs
function iterativeFrameStewart4Pegs(n, source, destination, aux1, aux2) {
  // Simplified iterative approach using stack-based simulation
  const moves = [];
  const stack = [];
  
  stack.push({
    n: n,
    src: source,
    dest: destination,
    aux1: aux1,
    aux2: aux2,
    phase: 0
  });
  
  while (stack.length > 0) {
    const task = stack.pop();
    
    if (task.n === 0) continue;
    
    if (task.n === 1) {
      moves.push(`${task.src} -> ${task.dest}`);
      continue;
    }
    
    const k = Math.ceil(task.n - Math.sqrt(2 * task.n + 1) + 1);
    
    if (task.phase === 0) {
      // Push tasks in reverse order
      task.phase = 1;
      stack.push(task);
      
      // Move k disks from aux1 to dest
      stack.push({
        n: k,
        src: task.aux1,
        dest: task.dest,
        aux1: task.src,
        aux2: task.aux2,
        phase: 0
      });
    } else if (task.phase === 1) {
      task.phase = 2;
      stack.push(task);
      
      // Move n-k disks from src to dest using 3 pegs
      solve3PegsIterative(task.n - k, task.src, task.dest, task.aux2, moves);
    } else if (task.phase === 2) {
      // Move top k disks from src to aux1
      stack.push({
        n: k,
        src: task.src,
        dest: task.aux1,
        aux1: task.aux2,
        aux2: task.dest,
        phase: 0
      });
    }
  }
  
  return moves;
}

function solve3PegsIterative(n, src, dest, aux, moves) {
  const totalMoves = Math.pow(2, n) - 1;
  const pegs = { A: [], B: [], C: [], D: [] };
  
  for (let i = n; i >= 1; i--) {
    pegs[src].push(i);
  }
  
  const pegNames = [src, aux, dest];
  if (n % 2 === 0) {
    [pegNames[1], pegNames[2]] = [pegNames[2], pegNames[1]];
  }
  
  for (let i = 1; i <= totalMoves; i++) {
    if (i % 3 === 1) {
      moveDiskHelper(pegs, pegNames[0], pegNames[2], moves);
    } else if (i % 3 === 2) {
      moveDiskHelper(pegs, pegNames[0], pegNames[1], moves);
    } else {
      moveDiskHelper(pegs, pegNames[1], pegNames[2], moves);
    }
  }
}

function moveDiskHelper(pegs, from, to, moves) {
  if (pegs[from].length === 0) {
    [from, to] = [to, from];
  } else if (pegs[to].length === 0) {
    // Keep as is
  } else if (pegs[from][pegs[from].length - 1] > pegs[to][pegs[to].length - 1]) {
    [from, to] = [to, from];
  }
  
  const disk = pegs[from].pop();
  pegs[to].push(disk);
  moves.push(`${from} -> ${to}`);
}

// Calculate minimum moves
function calculateMinMoves(n, numPegs) {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  
  if (numPegs === 3) {
    return Math.pow(2, n) - 1;
  } else if (numPegs === 4) {
    // Frame-Stewart formula approximation
    const k = Math.max(1, Math.min(n - 1, Math.ceil(n - Math.sqrt(2 * n + 1) + 1)));
    return 2 * calculateMinMoves(k, 4) + Math.pow(2, n - k) - 1;
  }
  return 0;
}

module.exports = {
  recursive3Pegs,
  iterative3Pegs,
  frameStewart4Pegs,
  iterativeFrameStewart4Pegs,
  calculateMinMoves
};