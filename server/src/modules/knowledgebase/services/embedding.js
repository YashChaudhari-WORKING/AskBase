const { voyageApiKey } = require("../../../config/env");
const AppError = require("../../../common/errors/AppError");
const logger = require("../../../common/utils/logger");

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-3-lite";
const BATCH_SIZE = 5;
const MAX_RETRIES = 3;

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

    let lastError;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
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

      if (response.ok) {
        const data = await response.json();
        const embeddings = data.data.map((item) => item.embedding);
        allEmbeddings.push(...embeddings);
        lastError = null;
        break;
      }

      lastError = await response.text();
      if (response.status === 429 && attempt < MAX_RETRIES) {
        const wait = attempt * 20000;
        logger.warn("Rate limited, retrying", { attempt, waitMs: wait });
        await new Promise((r) => setTimeout(r, wait));
      } else {
        throw new AppError(`Voyage AI API error: ${lastError}`, 502);
      }
    }

    // delay between batches to stay within free tier RPM
    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 21000));
    }
  }

  logger.info("Embedding complete", {
    count: allEmbeddings.length,
    dimensions: allEmbeddings[0]?.length,
  });

  return allEmbeddings;
};

module.exports = { embedSingle, embedBatch };
