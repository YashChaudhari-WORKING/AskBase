const { groqChatApiKey } = require("../../../config/env");
const AppError = require("../../../common/errors/AppError");
const logger = require("../../../common/utils/logger");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

const SYSTEM_PROMPT = `You are a helpful assistant that answers questions based ONLY on the provided context.

Rules:
- Answer using ONLY the information in the context below
- If the context does not contain enough information to answer, say "I don't have enough information in the provided documents to answer this question."
- Reference source numbers when citing information (e.g., "According to Source 1...")
- Be concise and accurate
- Do NOT make up information that isn't in the context`;

const generate = async (query, context) => {
  if (!groqChatApiKey) {
    throw new AppError("GROQ_CHAT_API_KEY is not configured", 500);
  }

  const userMessage = `Context:\n${context}\n\n---\n\nQuestion: ${query}`;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqChatApiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new AppError(`Groq API error: ${error}`, 502);
  }

  const data = await response.json();
  const answer = data.choices[0].message.content.trim();

  logger.info("Answer generated", {
    queryLength: query.length,
    contextLength: context.length,
    answerLength: answer.length,
  });

  return answer;
};

module.exports = { generate };
