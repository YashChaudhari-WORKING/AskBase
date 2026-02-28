const { nodeEnv } = require("../../config/env");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal server error";

  if (nodeEnv === "development") {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(nodeEnv === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
