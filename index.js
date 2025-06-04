const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const User = require("./userModel");
const Game = require("./gameModel");
const Bet = require("./betModel");
const Counter = require("./counter");
dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URL).then(() => {
  console.log("Connected to MongoDB");

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

// api to create a new user

app.post("/user", async (req, res) => {
  try {
    const { email, password, name, phone, state, country } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      name,
      phone,
      state,
      country,
    });

    await user.save();

    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    res.status(400).json({ message: "Error creating user", error });
  }
});

// api to get all users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ message: "Users retrieved successfully", users });
  } catch (error) {
    res.status(400).json({ message: "Error retrieving users", error });
  }
});

// api to get a user by id
app.get("/user/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User retrieved successfully", user });
  } catch (error) {
    res.status(400).json({ message: "Error retrieving user", error });
  }
});

// api to add money to wallet
app.post("/user/:id/wallet", async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }
    user.walletBalance += amount;
    await user.save();
    res
      .status(200)
      .json({ message: "Money added to wallet successfully", user });
  } catch (error) {
    res.status(400).json({ message: "Error adding money to wallet", error });
  }
});



// api login for user login

app.post("/user-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found: use correct mail" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "incorrect password" });
    }
    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(400).json({ message: "Error logging in", error });
  }
});

// POST /games (admin only)

app.post("/add-games", async (req, res) => {
  try {
    const { homeTeam, awayTeam, league, sportType, startTime, odds } = req.body;

    // Validate all fields, including nested odds
    if (
      !homeTeam ||
      !awayTeam ||
      !league ||
      !sportType ||
      !startTime ||
      !odds ||
      odds.home == null ||
      odds.away == null ||
      odds.draw == null ||
      odds.GG == null ||
      odds.NG == null ||
      odds.correctScore == null
    ) {
      return res
        .status(400)
        .json({ message: "All fields are required including odds." });
    }

    const newGame = new Game({
      homeTeam,
      awayTeam,
      league,
      sportType,
      startTime,
      odds,
    });

    await newGame.save();

    res.status(201).json({
      message: `Match added Successfully! ${homeTeam} vs ${awayTeam}`,
      newGame,
    });
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.get("/all-game", async (req, res) => { 
  try {
    const games = await Game.find();
    res.status(200).json({ message: "Games retrieved successfully", games });
  } catch (error) {
    res.status(400).json({ message: "Error retrieving games", error });
  }
});


// api for one game at a time by gameID
app.get("/game/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const game = await Game.findById(id);   
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }
    res.status(200).json({ message: "Game retrieved successfully", game }); 
  } catch (error) {
    res.status(400).json({ message: "Error retrieving game", error });
  }
}); 



// ------------------------- milestone 2  - Deduct stake from wallet and record bet.  -------------------------


app.post("/place-bet", async (req, res) => {
  try {
    const { userId, gameId, selectedOutcome, stake } = req.body;

    const user = await User.findById(userId);
    const game = await Game.findById(gameId);

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!game) return res.status(404).json({ message: 'Game not found' });

    const odds = game.odds[selectedOutcome];
    if (!odds) return res.status(400).json({ message: 'Invalid selected outcome' });

    if (user.walletBalance < stake) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    user.walletBalance -= stake;
    await user.save();

    const potentialWin = stake * odds;

    const newBet = new Bet({
      user: user._id,
      game: game._id,
      selectedOutcome,
      stake,
      potentialWin
    });

    await newBet.save();

    res.status(201).json({
      message: 'Bet placed successfully',
      bet: newBet
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error placing bet', error });
  }
});



// ------------------------- Milestone 3  - Admin can update game result.  -------------------------
// app.put("/update-game/:id", async (req, res) => {
//   const { id } = req.params;
//   const { status, result } = req.body;

//   try {
//     const game = await Game.findById(id);
//     if (!game) {
//       return res.status(404).json({ message: "Game not found" });
//     } 

//     // Validate status and result
//     const validStatuses = ["upcoming", "ongoing", "finished"];  
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ message: "Invalid game status" });
//     }
//     const validResults = ["home", "draw", "away", null];
//     if (result && !validResults.includes(result)) {
//       return res.status(400).json({ message: "Invalid game result" });
//     }
//     game.status = status;
//     game.result = result || null; // Allow result to be null if not provided
//     await game.save();
//     res.status(200).json({ message: "Game updated successfully", game });
//   } catch (error) {
//     console.error("Error updating game:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// }
// );  


app.post('/admin/set-result', async (req, res) => {
  try {
    const { gameId, result } = req.body;

    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: 'Game not found' });

    if (!['home', 'draw', 'away'].includes(result)) {
      return res.status(400).json({ message: 'Invalid result value' });
    }

    game.result = result;
    await game.save();

    res.status(200).json({ message: 'Result set successfully', game });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// api to update game status
app.put("/update-game-status/:id", async (req, res) => {  
  const { id } = req.params;
  const { status } = req.body;

  try {
    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Validate status
    const validStatuses = ["upcoming", "ongoing", "finished"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid game status" });
    }

    game.status = status;
    await game.save();
    res.status(200).json({ message: "Game status updated successfully", game });
  } catch (error) {
    console.error("Error updating game status:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
}
);



// ------------------------- Milestone 3 - Admin can view all bets and their status.  -------------------------
app.get("/bets", async (req, res) => {
  try {
    const bets = await Bet.find().populate("user game");
    res.status(200).json({ message: "Bets retrieved successfully", bets });
  } catch (error) {
    res.status(400).json({ message: "Error retrieving bets", error });
  }
}); 


// ------------------------- Milestone 3 - Calculate payouts and update wallets.  -------------------------

//api for Calculate payouts and update wallets.
app.post("/calculate-payouts", async (req, res) => {
  try {
    const { gameId } = req.body;

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }
    if (game.status !== "finished") {
      return res.status(400).json({ message: "Game Ongoing: Game must be finished to calculate payouts" });
    }
    const bets = await Bet.find({ game: gameId, status: "upcoming" }).populate("user");
    if (bets.length === 0) {
      return res.status(200).json({ message: "No bets to process for this game" });
    }
    const payouts = [];
    for (const bet of bets) {
      let payout = 0;
      if (bet.selectedOutcome === game.result) {
        payout = bet.potentialWin;
        bet.status = "won";
      } else {
        bet.status = "lost";
      }
      bet.save();
      bet.user.walletBalance += payout;
      await bet.user.save();
      payouts.push({ user: bet.user.email, payout });
    }
    res.status(200).json({
      message: "Payouts calculated successfully",
      payouts,
    });
  } catch (error) {
    console.error("Error calculating payouts:", error);
    res.status(500).json({ message: "Internal server error", error });
  } 
}
);

// api to settle bets after a game result is set
// This endpoint is used to settle bets after a game result is set.

app.post('/settle-bets', async (req, res) => {
  try {
    const { gameId } = req.body;

    const game = await Game.findById(gameId);
    if (!game || !game.result) {
      return res.status(404).json({ message: 'Game result not set or game not found' });
    }

    const bets = await Bet.find({ game: gameId, status: 'pending' }).populate('user');

    for (const bet of bets) {
      if (bet.selectedOutcome === game.result) {
        // User won
        bet.status = 'won';
        bet.user.walletBalance += bet.potentialWin;

        await bet.user.save();
      } else {
        // User lost
        bet.status = 'lost';
      }
      await bet.save();
    }

    res.status(200).json({ message: 'Bets settled', gameId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


// GET endpoints for viewing bet history and results.
app.get('/user/:id/bets', async (req, res) => {
  const { id } = req.params;

  try {
    const bets = await Bet.find({ user: id }).populate('game');
    res.status(200).json({ message: 'Bets retrieved successfully', bets });
  } catch (error) {
    res.status(400).json({ message: 'Error retrieving bets', error });
  }
});