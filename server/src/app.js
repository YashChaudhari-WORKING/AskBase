const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./common/middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

module.exports = app;