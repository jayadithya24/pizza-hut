const mongoose = require("mongoose");
const Pizza = require("./models/Pizza");
const pizzas = require("./data/pizzas");
require("dotenv").config();

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing
    await Pizza.deleteMany();
    console.log("Old pizzas removed");

    // Insert new pizzas
    await Pizza.insertMany(pizzas);
    console.log("New pizzas added");

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedData();
