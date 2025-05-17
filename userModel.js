const mongoose = require("mongoose");
const Counter = require("./counter"); // Import the Counter model

const userSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: " ",
    },
    phone: {
      type: String,
      default: " ",
    },
    state: {
      type: String,
      default: " ",
    },
    country: {
      type: String,
      default: " ",
    },
    walletBalance: { type: Number, default: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);


// This is used to generate UserID apart from mongoose generated ID... incase users want to send money across to each other within the platform

// BW stands for BetWise

userSchema.pre("save", async function (next) {
  if (this.isNew) {
    const fullYear = new Date().getFullYear();
    const year = String(fullYear).slice(-2); // "25" instead of "2025"

    const counter = await Counter.findOneAndUpdate(
      { name: `user-${year}` },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );

    const countStr = String(counter.count).padStart(3, "0");
    this.userID = `BW-${year}${countStr}`;
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
