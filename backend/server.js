const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// Default route
app.get("/", (req, res) => {
  res.send("Pizza backend is working!");
});

// Pizza API routes
app.use("/api/pizzas", require("./routes/pizzaRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
