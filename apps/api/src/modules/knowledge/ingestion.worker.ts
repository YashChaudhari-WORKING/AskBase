import { Worker } from "bullmq";
import { redis } from "../../common/utils/queue";
import { db, documents, chunks } from "@askbase/database";
import { eq } from "drizzle-orm";
import { chunkTextSentenceAware } from "../../common/utils/chunker";
import { io } from "../../server";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import * as cheerio from "cheerio";
import axios from "axios";
import { readFileSync } from "fs";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});
// strip images and raw links — keep text and structure
turndown.remove(["img", "figure", "picture", "svg", "button", "form", "input", "select"]);
turndown.addRule("removeEmpty", {
  filter: (node) => node.nodeType === 1 && !(node as Element).textContent?.trim(),
  replacement: () => "",
});

function emit(documentId: string, event: string, data: object) {
  io.to(`document:${documentId}`).emit(event, { documentId, ...data });
}

async function parseContent(job: any): Promise<string> {
  const { type, filePath, url, mimeType } = job;

  if (type === "url") {
    emit(job.documentId, "document:stage", { stage: "scraping", message: "Fetching page…" });
    const res = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AskBase/1.0; +https://askbase.ai)" },
      timeout: 15000,
      responseType: "text",
    });

    // 1. Try Readability (Firefox reader-mode extraction)
    try {
      const dom = new JSDOM(res.data, { url });
      const reader = new Readability(dom.window.document, {
        charThreshold: 100,
        keepClasses: false,
      });
      const article = reader.parse();
      if (article?.content && article.textContent.trim().length > 200) {
        emit(job.documentId, "document:stage", { stage: "scraping", message: "Cleaning content…" });
        const md = turndown.turndown(article.content);
        const header = [
          article.title ? `# ${article.title}` : "",
          article.byline ? `*${article.byline}*` : "",
          article.excerpt ? `> ${article.excerpt}` : "",
        ].filter(Boolean).join("\n\n");
        return `${header}\n\n${md}`.replace(/\n{3,}/g, "\n\n").trim();
      }
    } catch {}

    // 2. Fallback: cheerio structured extraction
    emit(job.documentId, "document:stage", { stage: "scraping", message: "Extracting text…" });
    const $ = cheerio.load(res.data);
    $(["script","style","nav","footer","header","aside","noscript",
       ".ads","#ads","[class*='cookie']","[class*='banner']",
       "[class*='popup']","[id*='modal']","[aria-hidden='true']"
    ].join(",")).remove();

    // collect meaningful text blocks preserving headings
    const parts: string[] = [];
    $("h1,h2,h3,h4,h5,h6,p,li,td,th,blockquote,pre,code").each((_, el) => {
      const tag = el.type === "tag" ? el.name : "";
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (!text || text.length < 15) return;
      if (/^h[1-6]$/.test(tag)) {
        const level = "#".repeat(Number(tag[1]));
        parts.push(`${level} ${text}`);
      } else {
        parts.push(text);
      }
    });
    return parts.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  if (mimeType === "application/pdf") {
    emit(job.documentId, "document:stage", { stage: "parsing", message: "Parsing PDF..." });
    const buffer = readFileSync(filePath);
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    emit(job.documentId, "document:stage", { stage: "parsing", message: "Parsing DOCX..." });
    const buffer = readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // plain text / markdown
  emit(job.documentId, "document:stage", { stage: "parsing", message: "Reading file..." });
  return readFileSync(filePath, "utf-8");
}

export function startIngestionWorker() {
  const worker = new Worker(
    "document-ingestion",
    async (job) => {
      const { documentId, tenantId } = job.data;

      try {
        // Parse
        const text = await parseContent(job.data);

        // Chunk
        emit(documentId, "document:stage", { stage: "chunking", message: "Splitting into chunks..." });
        const rawChunks = chunkTextSentenceAware(text);

        // Deduplicate against content already indexed for this tenant
        emit(documentId, "document:stage", { stage: "chunking", message: "Checking for duplicates..." });
        const existing = await db.select({ content: chunks.content }).from(chunks).where(eq(chunks.tenantId, tenantId));
        const existingSet = new Set(existing.map(c => c.content));
        const chunkObjects = rawChunks.filter(c => !existingSet.has(c.content) && c.content.length >= 80);

        const skipped = rawChunks.length - chunkObjects.length;
        if (skipped > 0) {
          emit(documentId, "document:stage", { stage: "chunking", message: `Skipped ${skipped} duplicate/tiny chunks.` });
        }

        if (chunkObjects.length === 0) {
          await db.update(documents)
            .set({ status: "ready", chunkCount: 0, updatedAt: new Date() })
            .where(eq(documents.id, documentId));
          emit(documentId, "document:ready", { stage: "ready", message: "All content already indexed.", chunkCount: 0 });
          return;
        }

        const totalChunks = chunkObjects.length;
        emit(documentId, "document:progress", { stage: "chunking", percent: 100, total: totalChunks });

        // Embed with progress
        emit(documentId, "document:stage", { stage: "embedding", message: `Embedding ${totalChunks} chunks...` });

        // Free tier: 3 RPM / 10K TPM — send 1 batch/min with ~20s breathing room
        const BATCH_SIZE = 64;
        const RATE_LIMIT_RPM = 3;
        const WINDOW_MS = 60_000;
        const MIN_DELAY_MS = Math.ceil(WINDOW_MS / RATE_LIMIT_RPM) + 500; // ~20.5 s

        const allTexts = chunkObjects.map(c => c.content);
        const embeddings: number[][] = new Array(allTexts.length);

        const batches: string[][] = [];
        for (let i = 0; i < allTexts.length; i += BATCH_SIZE) {
          batches.push(allTexts.slice(i, i + BATCH_SIZE));
        }

        const { VoyageAIClient } = await import("voyageai");
        const voyageWorker = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY! });

        let completedChunks = 0;
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];

          // Emit ETA so the UI shows something useful during the wait
          if (i > 0) {
            const remaining = batches.length - i;
            const etaSec = Math.round((remaining * MIN_DELAY_MS) / 1000);
            emit(documentId, "document:stage", {
              stage: "embedding",
              message: `Embedding batch ${i + 1}/${batches.length} — ~${etaSec}s left (rate limit)…`,
            });
            await new Promise(r => setTimeout(r, MIN_DELAY_MS));
          } else {
            emit(documentId, "document:stage", {
              stage: "embedding",
              message: `Embedding batch 1/${batches.length}…`,
            });
          }

          let res: Awaited<ReturnType<typeof voyageWorker.embed>>;
          let attempts = 0;
          while (true) {
            try {
              res = await voyageWorker.embed({ input: batch, model: "voyage-3", inputType: "document" });
              break;
            } catch (e: any) {
              attempts++;
              const isRateLimit = e?.statusCode === 429 || /rate.limit/i.test(e?.message ?? "");
              if (isRateLimit && attempts <= 3) {
                const backoff = attempts * MIN_DELAY_MS;
                emit(documentId, "document:stage", {
                  stage: "embedding",
                  message: `Rate limited — retrying in ${Math.round(backoff / 1000)}s (attempt ${attempts}/3)…`,
                });
                await new Promise(r => setTimeout(r, backoff));
                continue;
              }
              throw e;
            }
          }

          (res!.data ?? []).forEach((d: any, di: number) => {
            embeddings[i * BATCH_SIZE + di] = d.embedding as number[];
          });
          completedChunks += batch.length;

          const percent = Math.round((completedChunks / allTexts.length) * 100);
          emit(documentId, "document:progress", { stage: "embedding", percent, total: totalChunks });
        }

        // Insert chunks in batches of 500
        emit(documentId, "document:stage", { stage: "saving", message: "Saving to database..." });
        const INSERT_BATCH = 500;
        for (let i = 0; i < chunkObjects.length; i += INSERT_BATCH) {
          await db.insert(chunks).values(
            chunkObjects.slice(i, i + INSERT_BATCH).map((chunk, j) => ({
              tenantId,
              documentId,
              content: chunk.content,
              embedding: embeddings[i + j],
              chunkIndex: i + j,
              tokenCount: chunk.tokenCount,
            }))
          );
        }

        // Mark ready
        await db.update(documents)
          .set({ status: "ready", chunkCount: totalChunks, updatedAt: new Date() })
          .where(eq(documents.id, documentId));

        emit(documentId, "document:ready", {
          stage: "ready",
          message: "Processing complete!",
          chunkCount: totalChunks,
        });

      } catch (err: any) {
        await db.update(documents)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(documents.id, documentId));

        emit(documentId, "document:failed", {
          stage: "failed",
          message: err.message ?? "Processing failed",
        });
        throw err;
      }
    },
    { connection: redis, concurrency: 3 }
  );

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
