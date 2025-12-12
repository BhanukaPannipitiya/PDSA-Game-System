const { Worker } = require("worker_threads");
const path = require("path");

const WORKER_PATH = path.join(__dirname, "threadedWorker.js");

/**
 * Splits the work by fixing the queen in the first row to each column and
 * delegating the remaining rows to worker threads. Returns { solutions, timeMs }.
 */
async function solveEightQueensThreaded(size = 8) {
  const start = process.hrtime.bigint();
  const workerJobs = [];

  for (let col = 0; col < size; col += 1) {
    workerJobs.push(runWorker({ size, firstCol: col }));
  }

  const partialResults = await Promise.all(workerJobs);
  const solutions = partialResults.flat();
  const end = process.hrtime.bigint();
  const timeMs = Number(end - start) / 1_000_000;

  return { solutions, timeMs };
}

function runWorker(payload) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, { workerData: payload });
    worker.on("message", (message) => resolve(message.solutions));
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}

module.exports = { solveEightQueensThreaded };

