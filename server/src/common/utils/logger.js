const levels = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel = process.env.LOG_LEVEL || "info";

const log = (level, message, data = {}) => {
  if (levels[level] > levels[currentLevel]) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
};

module.exports = {
  error: (msg, data) => log("error", msg, data),
  warn: (msg, data) => log("warn", msg, data),
  info: (msg, data) => log("info", msg, data),
  debug: (msg, data) => log("debug", msg, data),
};