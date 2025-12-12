const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      minlength: 1,
      maxlength: 50
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for faster lookups
playerSchema.index({ name: 1 });

module.exports = mongoose.model("Player", playerSchema);

