const { voyageApiKey } = require("../../../config/env");
const AppError = require("../../../common/errors/AppError");
const logger = require("../../../common/utils/logger");

const VOYAGE_RERANK_URL = "https://api.voyageai.com/v1/rerank";
const MODEL = "rerank-2-lite";

const rerank = async (query, chunks, topK = 5) => {
  if (!voyageApiKey) {
    throw new AppError("VOYAGE_API_KEY is not configured", 500);
  }

  if (chunks.length === 0) {
    return [];
  }

  const documents = chunks.map((c) => c.text);

  const response = await fetch(VOYAGE_RERANK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${voyageApiKey}`,
    },
    body: JSON.stringify({
      query,
      documents,
      model: MODEL,
      top_k: topK,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new AppError(`Voyage Rerank API error: ${error}`, 502);
  }

  const data = await response.json();
  const results = data.data || data.results;

  if (!results || !Array.isArray(results)) {
    logger.error("Unexpected rerank response", { keys: Object.keys(data) });
    return chunks.slice(0, topK).map((c) => ({ ...c, relevanceScore: 0 }));
  }

  const reranked = results.map((result) => ({
    ...chunks[result.index],
    relevanceScore: result.relevance_score,
  }));

  reranked.sort((a, b) => b.relevanceScore - a.relevanceScore);

  logger.info("Reranking complete", {
    inputChunks: chunks.length,
    outputChunks: reranked.length,
    topScore: reranked[0]?.relevanceScore,
  });

  return reranked;
};

module.exports = { rerank };
