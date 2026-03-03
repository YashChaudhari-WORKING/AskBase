const { groqChatApiKey } = require("../../../config/env");
const AppError = require("../../../common/errors/AppError");
const logger = require("../../../common/utils/logger");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

const REWRITE_PROMPT = `You are a query rewriter for a RAG search system. Your job is to take a user's raw question and rewrite it into a clear, well-formed search query.

Rules:
- Fix typos, grammar, and unclear phrasing
- Keep the original intent
- Make it specific and searchable
- Return ONLY the rewritten query, nothing else
- Do NOT add information the user didn't ask about
- If the query is already clear, return it as-is`;

const rewriteQuery = async (query) => {
  if (!groqChatApiKey) {
    logger.warn("GROQ_CHAT_API_KEY not set, skipping query rewrite");
    return query;
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
          { role: "system", content: REWRITE_PROMPT },
          { role: "user", content: query },
        ],
        temperature: 0,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${await response.text()}`);
    }

    const data = await response.json();
    const rewritten = data.choices[0].message.content.trim();

    logger.info("Query rewritten", { original: query, rewritten });
    return rewritten;
  } catch (error) {
    logger.error("Query rewrite failed, using original", { error: error.message });
    return query;
  }
};

module.exports = { rewriteQuery };
