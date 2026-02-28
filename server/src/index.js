const app = require("./app");
const connectDB = require("./config/db");
const { port } = require("./config/env");
const logger = require("./common/utils/logger");

const start = async () => {
  await connectDB();

  app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });
};

start();
