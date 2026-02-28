const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  groqApiKey: process.env.GROQ_API_KEY,
  voyageApiKey: process.env.VOYAGE_API_KEY,
  llamaParseApiKey: process.env.LLAMAPARSE_API_KEY,
  nodeEnv: process.env.NODE_ENV || "development",
};
