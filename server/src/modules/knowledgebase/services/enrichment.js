const { groqEnrichApiKey } = require("../../../config/env");
const AppError = require("../../../common/errors/AppError");
const logger = require("../../../common/utils/logger");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

const callGroq = async (prompt, chunkText) => {
  if (!groqEnrichApiKey) {
    throw new AppError("GROQ_ENRICH_API_KEY is not configured", 500);
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqEnrichApiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: chunkText },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new AppError(`Groq API error: ${error}`, 502);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
};

const ENRICH_PROMPT = `You are a metadata extraction engine. Given a text chunk from a document, extract the following and return ONLY valid JSON:

{
  "keywords": ["keyword1", "keyword2", ...],
  "summary": "A 1-2 sentence summary of the chunk content",
  "hypotheticalQuestions": ["question1", "question2", "question3"]
}

Rules:
- keywords: 3-7 specific, relevant keywords (not generic words like "the", "and")
- summary: concise summary capturing the main point of the chunk
- hypotheticalQuestions: 2-4 questions a user might ask that this chunk would answer
- Return ONLY the JSON object, nothing else`;

const enrichChunk = async (text) => {
  try {
    const result = await callGroq(ENRICH_PROMPT, text);

    return {
      keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 7) : [],
      summary: typeof result.summary === "string" ? result.summary : "",
      hypotheticalQuestions: Array.isArray(result.hypotheticalQuestions)
        ? result.hypotheticalQuestions.slice(0, 4)
        : [],
    };
  } catch (error) {
    logger.error("Chunk enrichment failed", { error: error.message });
    return { keywords: [], summary: "", hypotheticalQuestions: [] };
  }
};

const enrichBatch = async (chunks) => {
  const results = [];
  for (let i = 0; i < chunks.length; i++) {
    logger.info("Enriching chunk", { index: i + 1, total: chunks.length });
    const metadata = await enrichChunk(chunks[i].text);
    results.push(metadata);

    // small delay to respect Groq free tier rate limits
    if (i < chunks.length - 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return results;
};

module.exports = { enrichChunk, enrichBatch, callGroq };
