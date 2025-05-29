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


