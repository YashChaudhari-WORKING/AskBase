import { VoyageAIClient } from "voyageai";
import { env } from "../../config/env";

const voyage = new VoyageAIClient({ apiKey: env.VOYAGE_API_KEY });
const EMBED_MODEL = "voyage-3";
const RERANK_MODEL = "rerank-2";
const BATCH_SIZE = 128;
const MAX_CONCURRENT = 4;

/** True if the error is a Voyage rate-limit (429). */
export function isVoyageRateLimit(e: any): boolean {
  const code = e?.statusCode ?? e?.status ?? e?.response?.status;
  return code === 429 || /\b429\b|rate.?limit|too many requests/i.test(e?.message ?? "");
}

/**
 * Retry a Voyage call on 429 with short exponential backoff.
 * Kept modest so a live chat request never hangs: it absorbs transient/bursty
 * limits (common once standard limits are unlocked) and otherwise fails fast so
 * the caller can degrade gracefully instead of surfacing a raw 500.
 */
async function withVoyageRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e: any) {
      attempt++;
      if (isVoyageRateLimit(e) && attempt <= maxRetries) {
        await new Promise(r => setTimeout(r, 800 * Math.pow(2, attempt - 1))); // 0.8s, 1.6s
        continue;
      }
      throw e;
    }
  }
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    batches.push(texts.slice(i, i + BATCH_SIZE));
  }

  const results: number[][] = new Array(texts.length);

  // Process in windows of MAX_CONCURRENT
  for (let i = 0; i < batches.length; i += MAX_CONCURRENT) {
    const window = batches.slice(i, i + MAX_CONCURRENT);
    const responses = await Promise.all(
      window.map(batch =>
        voyage.embed({ input: batch, model: EMBED_MODEL, inputType: "document" })
      )
    );
    responses.forEach((res, wi) => {
      const offset = (i + wi) * BATCH_SIZE;
      (res.data ?? []).forEach((d: any, di: number) => {
        results[offset + di] = d.embedding as number[];
      });
    });
  }
  return results;
}

export async function embedQuery(text: string): Promise<number[]> {
  const res = await withVoyageRetry(() =>
    voyage.embed({ input: [text], model: EMBED_MODEL, inputType: "query" })
  );
  return (res.data ?? [])[0].embedding as number[];
}

export async function rerankDocuments(
  query: string,
  documents: string[],
  topK = 5
): Promise<Array<{ index: number; relevanceScore: number }>> {
  const res = await withVoyageRetry(() =>
    voyage.rerank({ query, documents, model: RERANK_MODEL, topK })
  );
  return (res.data ?? []).map((r: any) => ({
    index: r.index as number,
    relevanceScore: r.relevanceScore as number,
  }));
}
