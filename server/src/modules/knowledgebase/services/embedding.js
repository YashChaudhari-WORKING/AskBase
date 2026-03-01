const { voyageApiKey } = require("../../../config/env");
const AppError = require("../../../common/errors/AppError");
const logger = require("../../../common/utils/logger");

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-3-lite";
const BATCH_SIZE = 20;

const embedSingle = async (text) => {
  const results = await embedBatch([text]);
  return results[0];
};

const embedBatch = async (texts) => {
  if (!voyageApiKey) {
    throw new AppError("VOYAGE_API_KEY is not configured", 500);
  }

  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    logger.info("Embedding batch", {
      batch: `${i + 1}-${i + batch.length}`,
      total: texts.length,
    });

    const response = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${voyageApiKey}`,
      },
      body: JSON.stringify({
        input: batch,
        model: MODEL,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AppError(`Voyage AI API error: ${error}`, 502);
    }

    const data = await response.json();
    const embeddings = data.data.map((item) => item.embedding);
    allEmbeddings.push(...embeddings);
  }

  logger.info("Embedding complete", {
    count: allEmbeddings.length,
    dimensions: allEmbeddings[0]?.length,
  });

  return allEmbeddings;
};

module.exports = { embedSingle, embedBatch };
