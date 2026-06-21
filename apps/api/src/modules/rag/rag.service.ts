import { db } from "@askbase/database";
import { sql } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { env } from "../../config/env";
import type { RagResult, MessageSource } from "@askbase/shared";
import { embedQuery, rerankDocuments } from "../../common/utils/voyage";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const groq = env.GROQ_API_KEY ? new Groq({ apiKey: env.GROQ_API_KEY }) : null;

// Reciprocal Rank Fusion — merges vector + BM25 rankings into one score
function reciprocalRankFusion(
  vectorChunks: any[],
  keywordChunks: any[],
  k = 60
): any[] {
  const scores = new Map<string, { chunk: any; score: number }>();

  vectorChunks.forEach((chunk, rank) => {
    scores.set(chunk.id, { chunk, score: 1 / (k + rank + 1) });
  });

  keywordChunks.forEach((chunk, rank) => {
    const rrf = 1 / (k + rank + 1);
    if (scores.has(chunk.id)) {
      scores.get(chunk.id)!.score += rrf;
    } else {
      scores.set(chunk.id, { chunk, score: rrf });
    }
  });

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map(e => e.chunk);
}

// Jaccard-based deduplication — drops chunks that are too similar to an already-kept one
function deduplicateChunks(chunks: any[], threshold = 0.65): any[] {
  const kept: any[] = [];
  for (const chunk of chunks) {
    const wordsA = new Set(chunk.content.toLowerCase().split(/\s+/));
    const isDup = kept.some(k => {
      const wordsB = new Set(k.content.toLowerCase().split(/\s+/));
      const intersection = Array.from(wordsA).filter(w => wordsB.has(w)).length;
      const union = new Set(Array.from(wordsA).concat(Array.from(wordsB))).size;
      return intersection / union > threshold;
    });
    if (!isDup) kept.push(chunk);
  }
  return kept;
}

export class RagService {
  async query(
    tenantId: string,
    question: string,
    systemPrompt?: string | null,
    confidenceThreshold = 0.35,
    contextMessages: Array<{ role: "user" | "assistant"; content: string }> = [],
    documentScope: string[] | null = null,
    rewrittenQuery?: string  // pre-computed by intent layer
  ): Promise<RagResult> {

    // Use rewritten query for embedding if available, fallback to original
    const searchQuery = rewrittenQuery ?? question;

    // Phase 1 — embed the (possibly rewritten) query
    const embedding = await embedQuery(searchQuery);

    // Phase 2 — check learned responses (human-approved fast path)
    const learnedMatches = await db.execute(sql`
      SELECT id, question, answer, confidence_boost,
             1 - (embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
      FROM learned_responses
      WHERE tenant_id = ${tenantId}
        AND is_approved = true
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector
      LIMIT 3
    `);

    const topLearned = (learnedMatches as any[]).filter(r => r.similarity > 0.72);
    if (topLearned.length > 0) {
      const best = topLearned[0];
      const boostedConfidence = Math.min(1, best.similarity + best.confidence_boost);
      return {
        answer: best.answer,
        sources: [],
        confidence: boostedConfidence,
        shouldHandoff: boostedConfidence < confidenceThreshold,
      };
    }

    // Build scope filter — convert JS array to PostgreSQL array literal string
    const scopeFilter = documentScope?.length
      ? sql`AND c.document_id = ANY(${'{' + documentScope.join(',') + '}'}::uuid[])`
      : sql``;

    // Phase 3a — vector similarity search (raised threshold: 0.2 → 0.5)
    const vectorResults = await db.execute(sql`
      SELECT c.id, c.content, c.document_id, d.title as document_title,
             1 - (c.embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
      FROM chunks c
      JOIN documents d ON d.id = c.document_id
      WHERE c.tenant_id = ${tenantId} AND d.status = 'ready' ${scopeFilter}
        AND 1 - (c.embedding <=> ${JSON.stringify(embedding)}::vector) > 0.5
      ORDER BY c.embedding <=> ${JSON.stringify(embedding)}::vector
      LIMIT 20
    `);

    // Phase 3b — BM25 keyword search via PostgreSQL tsvector
    let keywordResults: any[] = [];
    try {
      const kwRows = await db.execute(sql`
        SELECT c.id, c.content, c.document_id, d.title as document_title,
               ts_rank_cd(to_tsvector('english', c.content), plainto_tsquery('english', ${searchQuery})) as bm25_score
        FROM chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE c.tenant_id = ${tenantId} AND d.status = 'ready' ${scopeFilter}
          AND to_tsvector('english', c.content) @@ plainto_tsquery('english', ${searchQuery})
        ORDER BY bm25_score DESC
        LIMIT 20
      `);
      keywordResults = kwRows as any[];
    } catch {
      // tsvector query can fail on stop-word-only queries — silently skip
    }

    // Phase 3c — RRF fusion of vector + keyword results
    const vectorList = vectorResults as any[];
    const fusedCandidates = reciprocalRankFusion(vectorList, keywordResults);

    if (fusedCandidates.length === 0) {
      // Fallback: if strict 0.5 threshold filtered everything, retry at 0.35
      const fallbackRows = await db.execute(sql`
        SELECT c.id, c.content, c.document_id, d.title as document_title,
               1 - (c.embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
        FROM chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE c.tenant_id = ${tenantId} AND d.status = 'ready' ${scopeFilter}
          AND 1 - (c.embedding <=> ${JSON.stringify(embedding)}::vector) > 0.35
        ORDER BY c.embedding <=> ${JSON.stringify(embedding)}::vector
        LIMIT 10
      `);
      if ((fallbackRows as any[]).length === 0) {
        return { answer: "", sources: [], confidence: 0, shouldHandoff: true };
      }
      fusedCandidates.push(...(fallbackRows as any[]));
    }

    // Phase 4 — deduplicate overlapping chunks
    const dedupedCandidates = deduplicateChunks(fusedCandidates, 0.65);

    // Phase 5 — rerank top candidates with Voyage rerank-2
    const reranked = await rerankDocuments(
      searchQuery,
      dedupedCandidates.map(c => c.content),
      6  // slightly wider net after dedup
    );

    const topChunks = reranked.map(r => ({
      ...dedupedCandidates[r.index],
      rerankScore: r.relevanceScore,
    }));

    const confidence = topChunks[0]?.rerankScore ?? 0;
    const context = topChunks.map(c => c.content).join("\n\n---\n\n");

    const sources: MessageSource[] = topChunks.map(c => ({
      documentId: c.document_id,
      documentTitle: c.document_title,
      chunkContent: c.content.substring(0, 200),
      score: c.rerankScore,
    }));

    // Phase 6 — generate answer
    const prompt = systemPrompt ??
      "You are a helpful customer support assistant. Answer strictly based on the provided context. If the context does not contain the answer, say you don't have that information — do not guess.";

    let answer = "";
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: `${prompt}\n\nRelevant context:\n${context}`,
      });

      const contents = [
        ...contextMessages.map(m => ({
          role: m.role === "assistant" ? "model" : "user" as const,
          parts: [{ text: m.content }],
        })),
        { role: "user" as const, parts: [{ text: question }] },
      ];

      const result = await model.generateContent({
        contents,
        generationConfig: { temperature: 0.2, maxOutputTokens: 1200 },
      });
      answer = result.response.text();
    } catch {
      if (groq) {
        const groqMessages = [
          { role: "system" as const, content: `${prompt}\n\nRelevant context:\n${context}` },
          ...contextMessages,
          { role: "user" as const, content: question },
        ];
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: groqMessages,
          temperature: 0.2,
          max_tokens: 1200,
        });
        answer = completion.choices[0].message.content ?? "";
      } else {
        throw new Error("LLM unavailable");
      }
    }

    // Enforce threshold regardless of whether sources were found
    const shouldHandoff = !answer.trim() || confidence < confidenceThreshold;

    return { answer, sources, confidence, shouldHandoff };
  }
}
