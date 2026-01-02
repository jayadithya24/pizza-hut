const express = require("express");
const router = express.Router();
const { getPizzas } = require("../controllers/pizzaController");

router.get("/", getPizzas);

module.exports = router;
