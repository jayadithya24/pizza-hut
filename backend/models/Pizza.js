const mongoose = require("mongoose");

const pizzaSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  image: String,
});

module.exports = mongoose.model("Pizza", pizzaSchema);
