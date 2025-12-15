const express = require('express');
const router = express.Router();
const hanoiController = require('../../controllers/games/hanoiController');

// Generate game configuration
router.get('/generate', hanoiController.generateGame);

// Solve Tower of Hanoi
router.post('/solve', hanoiController.solveHanoi);

// Submit user answer
router.post('/submit', hanoiController.submitAnswer);

// Get all results
router.get('/results', hanoiController.getResults);

// Get results by player
router.get('/results/:playerName', hanoiController.getResultsByPlayer);

module.exports = router;