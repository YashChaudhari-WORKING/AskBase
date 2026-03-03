const express = require("express");
const { runEvaluation } = require("../controllers/evalController");

const router = express.Router();

router.post("/evaluate", runEvaluation);

module.exports = router;
