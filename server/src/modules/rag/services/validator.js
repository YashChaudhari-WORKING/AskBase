const { groqChatApiKey } = require("../../../config/env");
const AppError = require("../../../common/errors/AppError");
const logger = require("../../../common/utils/logger");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

const VALIDATION_PROMPT = `You are a fact-checking validator for a RAG system. Given an answer and the context it was generated from, check if the answer is grounded in the context.

Analyze the answer and return ONLY valid JSON:

{
  "grounded": true/false,
  "relevance": "high" | "medium" | "low",
  "confidence": 0.0 to 1.0,
  "flaggedClaims": ["claim that is NOT supported by context", ...]
}

Rules:
- grounded: true if ALL claims in the answer can be found in the context
- relevance: how well the answer addresses the original question
- confidence: overall confidence score (0.0 = no confidence, 1.0 = fully confident)
- flaggedClaims: list any specific claims in the answer that are NOT supported by the context. Empty array if all claims are grounded
- Be strict: if the answer adds information not in the context, flag it`;

const validate = async (question, answer, context) => {
  if (!groqChatApiKey) {
    logger.warn("GROQ_CHAT_API_KEY not set, skipping validation");
    return { grounded: null, relevance: null, confidence: null, flaggedClaims: [] };
  }

  try {
    const userMessage = `Question: ${question}\n\nAnswer: ${answer}\n\nContext:\n${context}`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqChatApiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: VALIDATION_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${await response.text()}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    const validation = {
      grounded: typeof result.grounded === "boolean" ? result.grounded : null,
      relevance: ["high", "medium", "low"].includes(result.relevance) ? result.relevance : null,
      confidence: typeof result.confidence === "number" ? Math.min(1, Math.max(0, result.confidence)) : null,
      flaggedClaims: Array.isArray(result.flaggedClaims) ? result.flaggedClaims : [],
    };

    logger.info("Validation complete", {
      grounded: validation.grounded,
      relevance: validation.relevance,
      confidence: validation.confidence,
      flaggedCount: validation.flaggedClaims.length,
    });

    return validation;
  } catch (error) {
    logger.error("Validation failed", { error: error.message });
    return { grounded: null, relevance: null, confidence: null, flaggedClaims: [] };
  }
};

module.exports = { validate };
