const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  count: {
    type: Number,
    default: 10,
  },
});

const Counter = mongoose.model("Counter", counterSchema);

module.exports = Counter;


// This code defines a Mongoose schema and model for a counter. The counter is used to generate unique IDs for users in the user model. The schema has two fields: `name` and `count`. The `name` field is a string that is required and must be unique, while the `count` field is a number that defaults to 0. The model is then exported for use in other parts of the application.


// The `Counter` model can be used to create, read, update, and delete counter documents in the MongoDB database. It is typically used in conjunction with the user model to generate unique user IDs based on a specific naming convention.