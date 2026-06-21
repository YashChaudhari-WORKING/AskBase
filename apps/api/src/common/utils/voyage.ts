import { VoyageAIClient } from "voyageai";
import { env } from "../../config/env";

const voyage = new VoyageAIClient({ apiKey: env.VOYAGE_API_KEY });
const EMBED_MODEL = "voyage-3";
const RERANK_MODEL = "rerank-2";
const BATCH_SIZE = 128;
const MAX_CONCURRENT = 4;

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
  const res = await voyage.embed({ input: [text], model: EMBED_MODEL, inputType: "query" });
  return (res.data ?? [])[0].embedding as number[];
}

export async function rerankDocuments(
  query: string,
  documents: string[],
  topK = 5
): Promise<Array<{ index: number; relevanceScore: number }>> {
  const res = await voyage.rerank({ query, documents, model: RERANK_MODEL, topK });
  return (res.data ?? []).map((r: any) => ({
    index: r.index as number,
    relevanceScore: r.relevanceScore as number,
  }));
}
