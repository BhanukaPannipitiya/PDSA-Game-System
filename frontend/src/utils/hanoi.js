export const calculateMinMoves = (n, numPegs) => {
  if (!Number.isInteger(n) || n <= 0) return 0;
  if (n === 1) return 1;

  if (numPegs === 3) {
    return Math.pow(2, n) - 1;
  }

  if (numPegs === 4) {
    const k = Math.max(
      1,
      Math.min(
        n - 1,
        Math.ceil(n - Math.sqrt(2 * n + 1) + 1)
      )
    );
    return 2 * calculateMinMoves(k, 4) + Math.pow(2, n - k) - 1;
  }

  return 0;
};

