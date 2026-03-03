const { groqChatApiKey } = require("../../../config/env");
const { embedSingle } = require("../../knowledgebase/services/embedding");
const { vectorSearch } = require("../../knowledgebase/services/retrieval");
const logger = require("../../../common/utils/logger");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

const HYDE_PROMPT = `You are a helpful assistant. Given a question, write a short paragraph (3-5 sentences) that would be a perfect answer to this question. Write it as if it's from a document, not as a chatbot response.

Rules:
- Write factual, document-style text
- Keep it concise (3-5 sentences)
- Do NOT say "Based on the document" or "According to..."
- Just write the answer as if it were part of a knowledge base article`;

const generateHypothetical = async (query) => {
  if (!groqChatApiKey) {
    return null;
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqChatApiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: HYDE_PROMPT },
          { role: "user", content: query },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${await response.text()}`);
    }

    const data = await response.json();
    const hypothetical = data.choices[0].message.content.trim();

    logger.info("HyDE generated", { queryLength: query.length, hydeLength: hypothetical.length });
    return hypothetical;
  } catch (error) {
    logger.error("HyDE generation failed", { error: error.message });
    return null;
  }
};

const hydeSearch = async (query, documentId, topK = 10) => {
  const hypothetical = await generateHypothetical(query);

  if (!hypothetical) {
    return [];
  }

  const hydeEmbedding = await embedSingle(hypothetical);
  const results = await vectorSearch(hydeEmbedding, documentId, topK);

  logger.info("HyDE search complete", { results: results.length });
  return results.map((r) => ({ ...r, hydeScore: r.vectorScore }));
};

module.exports = { generateHypothetical, hydeSearch };
