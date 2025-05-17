const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
  {
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    league: { type: String, required: true },
    sportType: { type: String, required: true },
    startTime: { type: Date, required: true },
    odds: {
      home: { type: Number, required: true },
      away: { type: Number, required: true },
      draw: { type: Number, required: true },
      GG: { type: Number, required: true },
      NG: { type: Number, required: true },
      correctScore: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

const Game = mongoose.model("Game", gameSchema);
module.exports = Game;
