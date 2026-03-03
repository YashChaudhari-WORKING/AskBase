const { rewriteQuery } = require("./queryRewriter");
const { hydeSearch } = require("./hyde");
const { hybridSearch } = require("../../knowledgebase/services/retrieval");
const { rerank } = require("./reranker");
const { buildContext } = require("./contextBuilder");
const { generate } = require("./generator");
const logger = require("../../../common/utils/logger");

const ask = async (query, options = {}) => {
  const { documentId = null, topK = 3 } = options;

  logger.info("RAG pipeline started", { query, documentId });

  // Step 1: Query Rewrite
  const rewrittenQuery = await rewriteQuery(query);

  // Step 2: Hybrid Search (vector + keyword) with original + rewritten query
  const hybridResults = await hybridSearch(rewrittenQuery, {
    documentId,
    topK: topK * 3,
  });

  // Step 3: HyDE Search (hypothetical document embedding)
  const hydeResults = await hydeSearch(rewrittenQuery, documentId, topK * 2);

  // Step 4: Merge results (deduplicate by chunk _id)
  const seen = new Set();
  const merged = [];

  for (const chunk of [...hybridResults, ...hydeResults]) {
    const id = chunk._id.toString();
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(chunk);
    }
  }

  logger.info("Search results merged", {
    hybrid: hybridResults.length,
    hyde: hydeResults.length,
    merged: merged.length,
  });

  if (merged.length === 0) {
    return {
      answer: "I couldn't find any relevant information in the documents to answer your question.",
      sources: [],
      meta: { originalQuery: query, rewrittenQuery, chunksFound: 0 },
    };
  }

  // Step 5: Rerank with Voyage AI
  const reranked = await rerank(rewrittenQuery, merged, topK);

  // Step 6: Build context from top chunks
  const { context, sources } = buildContext(reranked);

  // Step 7: Generate answer with Groq
  const answer = await generate(query, context);

  logger.info("RAG pipeline complete", {
    sources: sources.length,
    answerLength: answer.length,
  });

  return {
    answer,
    sources,
    meta: {
      originalQuery: query,
      rewrittenQuery,
      chunksFound: merged.length,
      chunksUsed: reranked.length,
    },
  };
};

module.exports = { ask };
