const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
require("dotenv").config();
const cpt = require("../middleware/cryp");
const jwt = require("jsonwebtoken");
const tokenFuncs = require("../middleware/tokens");
const validationFuncs = require("../middleware/validation");
const idFuncs = require("../middleware/id");
const stringFuncs = require("../middleware/strings");

const connection = mysql.createConnection(process.env.DATABASE_URL);

router.post("/clearEvents", (req, res) => {
    console.log("Clearing events");
});

module.exports = router;