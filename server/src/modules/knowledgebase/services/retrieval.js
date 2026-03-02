const { embedSingle } = require("./embedding");
const Chunk = require("../models/Chunk");
const logger = require("../../../common/utils/logger");

const cosineSimilarity = (a, b) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const vectorSearch = async (queryEmbedding, documentId, topK = 10) => {
  const filter = documentId ? { documentId } : {};
  const chunks = await Chunk.find(filter).lean();

  const scored = chunks.map((chunk) => ({
    ...chunk,
    vectorScore: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.vectorScore - a.vectorScore);
  return scored.slice(0, topK);
};

const keywordSearch = async (query, documentId, topK = 10) => {
  const filter = documentId
    ? { documentId, $text: { $search: query } }
    : { $text: { $search: query } };

  const chunks = await Chunk.find(filter, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .limit(topK)
    .lean();

  return chunks.map((chunk) => ({
    ...chunk,
    keywordScore: chunk.score || 0,
  }));
};

const hybridSearch = async (query, options = {}) => {
  const {
    documentId = null,
    topK = 5,
    vectorWeight = 0.7,
    keywordWeight = 0.3,
  } = options;

  logger.info("Starting hybrid search", { query, documentId, topK });

  const queryEmbedding = await embedSingle(query);

  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(queryEmbedding, documentId, topK * 2),
    keywordSearch(query, documentId, topK * 2),
  ]);

  // merge results by chunk _id
  const scoreMap = new Map();

  // normalize vector scores to 0-1
  const maxVector = vectorResults[0]?.vectorScore || 1;
  for (const chunk of vectorResults) {
    const normalized = chunk.vectorScore / maxVector;
    scoreMap.set(chunk._id.toString(), {
      chunk,
      vectorScore: normalized,
      keywordScore: 0,
    });
  }

  // normalize keyword scores to 0-1
  const maxKeyword = keywordResults[0]?.keywordScore || 1;
  for (const chunk of keywordResults) {
    const id = chunk._id.toString();
    const normalized = chunk.keywordScore / maxKeyword;
    if (scoreMap.has(id)) {
      scoreMap.get(id).keywordScore = normalized;
    } else {
      scoreMap.set(id, {
        chunk,
        vectorScore: 0,
        keywordScore: normalized,
      });
    }
  }

  // compute combined score
  const results = Array.from(scoreMap.values()).map((entry) => ({
    _id: entry.chunk._id,
    documentId: entry.chunk.documentId,
    text: entry.chunk.text,
    heading: entry.chunk.heading,
    index: entry.chunk.index,
    tokens: entry.chunk.tokens,
    metadata: entry.chunk.metadata,
    scores: {
      vector: parseFloat(entry.vectorScore.toFixed(4)),
      keyword: parseFloat(entry.keywordScore.toFixed(4)),
      combined: parseFloat(
        (entry.vectorScore * vectorWeight + entry.keywordScore * keywordWeight).toFixed(4)
      ),
    },
  }));

  results.sort((a, b) => b.scores.combined - a.scores.combined);
  const topResults = results.slice(0, topK);

  logger.info("Hybrid search complete", {
    vectorHits: vectorResults.length,
    keywordHits: keywordResults.length,
    merged: results.length,
    returned: topResults.length,
  });

  return topResults;
};

module.exports = { hybridSearch, vectorSearch, keywordSearch, cosineSimilarity };
