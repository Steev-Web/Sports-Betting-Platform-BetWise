// models/Bet.js
const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  selectedOutcome: { type: String, required: true },
  stake: { type: Number, required: true },
  potentialWin: { type: Number },
  status: { type: String, enum: ['pending', 'won', 'lost'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bet', betSchema);
// This code defines a Mongoose schema for a betting system.
// It includes fields for the user placing the bet, the game being bet on, the selected outcome,        
// the stake amount, potential winnings, status of the bet, and the creation date.
//     res.status(500).json({ message: "Error creating game", error });