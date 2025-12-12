const Player = require("../models/playerModel");
const success = require("../utils/successResponse");
const ErrorResponse = require("../utils/errorHandler");

const signup = async (req, res, next) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new ErrorResponse("Player name is required", 400);
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length > 50) {
      throw new ErrorResponse("Player name must be 50 characters or less", 400);
    }

    // Check if player already exists
    let player = await Player.findOne({ name: trimmedName });
    
    if (player) {
      // Player exists, return success (login)
      return success(res, {
        player: {
          id: player._id,
          name: player.name,
          createdAt: player.createdAt,
        },
        isNewPlayer: false,
      }, "Welcome back!");
    }

    // Create new player
    player = await Player.create({ name: trimmedName });
    
    return success(res, {
      player: {
        id: player._id,
        name: player.name,
        createdAt: player.createdAt,
      },
      isNewPlayer: true,
    }, "Player created successfully!");
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      const existingPlayer = await Player.findOne({ name: req.body.name.trim() });
      return success(res, {
        player: {
          id: existingPlayer._id,
          name: existingPlayer.name,
          createdAt: existingPlayer.createdAt,
        },
        isNewPlayer: false,
      }, "Welcome back!");
    }
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new ErrorResponse("Player name is required", 400);
    }

    const player = await Player.findOne({ name: name.trim() });
    
    if (!player) {
      throw new ErrorResponse("Player not found. Please sign up first.", 404);
    }

    return success(res, {
      player: {
        id: player._id,
        name: player.name,
        createdAt: player.createdAt,
      },
    }, "Login successful!");
  } catch (error) {
    return next(error);
  }
};

const getPlayer = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    
    const player = await Player.findById(playerId);
    
    if (!player) {
      throw new ErrorResponse("Player not found", 404);
    }

    return success(res, {
      player: {
        id: player._id,
        name: player.name,
        createdAt: player.createdAt,
      },
    }, "Player retrieved successfully");
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  signup,
  login,
  getPlayer,
};

