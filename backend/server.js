const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Health check / default route
app.get("/", (req, res) => {
  res.status(200).send("🍕 Pizza backend is working!");
});

// API routes
app.use("/api/pizzas", require("./routes/pizzaRoutes"));

// IMPORTANT: use Render-provided PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
