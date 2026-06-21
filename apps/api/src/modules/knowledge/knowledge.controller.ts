import type { Response } from "express";
import type { AuthRequest } from "../../common/middleware/auth.middleware";
import { KnowledgeService } from "./knowledge.service";
import { success, error } from "../../common/utils/response";
import { db, chunks, documents } from "@askbase/database";
import { eq, and, asc } from "drizzle-orm";
import * as cheerio from "cheerio";
import axios from "axios";
import Sitemapper from "sitemapper";
// got-scraping is ESM-only — load once lazily via dynamic import
let _gotScraping: typeof import("got-scraping")["gotScraping"] | null = null;
async function getGotScraping() {
  if (!_gotScraping) {
    const mod = await import("got-scraping");
    _gotScraping = mod.gotScraping;
  }
  return _gotScraping;
}

// ── Types ────────────────────────────────────────────────
interface DiscoveredPage { url: string; title: string }

export interface PageTreeNode {
  id: string;
  name: string;
  type: "file" | "folder";
  url?: string;
  children?: PageTreeNode[];
}

// ── HTTP client (axios — used for robots.txt only) ────────
const ax = axios.create({
  timeout: 10000,
  maxRedirects: 5,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
  },
  validateStatus: (s) => s < 500,
});

// ── Browser-fingerprint fetch (got-scraping — bypasses basic bot blocks) ─
async function browserFetch(url: string): Promise<string | null> {
  try {
    const gotScraping = await getGotScraping();
    const res = await gotScraping({
      url,
      responseType: "text",
      timeout: { request: 12000 },
      retry: { limit: 2 },
      followRedirect: true,
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    return typeof res.body === "string" ? res.body : null;
  } catch {
    return null;
  }
}

// ── Sitemap / BFS crawler ────────────────────────────────
async function fetchUrls(baseUrl: string): Promise<DiscoveredPage[]> {
  const origin = new URL(baseUrl).origin;
  const seen = new Set<string>();
  const pages: DiscoveredPage[] = [];

  // 1. Try robots.txt for extra sitemap hints
  const sitemapCandidates: string[] = [];
  try {
    const robots = await ax.get(`${origin}/robots.txt`, { responseType: "text" });
    if (typeof robots.data === "string") {
      const matches = Array.from(robots.data.matchAll(/^Sitemap:\s*(\S+)/gim));
      matches.forEach(m => sitemapCandidates.push(m[1].trim()));
    }
  } catch {}

  // Standard locations always included
  sitemapCandidates.push(`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/sitemap/`);

  // 2. Parse sitemaps via sitemapper (handles gzip, indexes, retries automatically)
  const sitemap = new Sitemapper({ timeout: 12000, retries: 2 });

  for (const sUrl of sitemapCandidates) {
    if (pages.length >= 200) break;
    try {
      const { sites } = await sitemap.fetch(sUrl);
      for (const u of sites) {
        if (seen.has(u) || pages.length >= 200) continue;
        seen.add(u);
        const path = (() => { try { return new URL(u).pathname; } catch { return u; } })();
        const slug = path.split("/").filter(Boolean).pop() ?? "(home)";
        pages.push({ url: u, title: slug.replace(/[-_]/g, " ").replace(/\.\w+$/, "") || "(home)" });
      }
    } catch {}
  }

  // 3. Fallback BFS crawl using got-scraping (browser fingerprint — bypasses basic blockers)
  if (pages.length < 5) {
    const crawlQueue = [baseUrl];
    const crawlQueueSet = new Set<string>([baseUrl]);
    while (crawlQueue.length && pages.length < 150) {
      const u = crawlQueue.shift()!;
      if (seen.has(u)) continue;
      seen.add(u);

      const html = await browserFetch(u);
      if (!html) continue;

      const $ = cheerio.load(html);
      const title = $("title").first().text().trim()
        || $("h1").first().text().trim()
        || new URL(u).pathname.split("/").filter(Boolean).pop()
        || "(home)";
      pages.push({ url: u, title });

      $("a[href]").each((_, el) => {
        try {
          const href = $(el).attr("href") ?? "";
          if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;
          const abs = new URL(href, u).href.split("#")[0].replace(/\?.*$/, "");
          if (
            abs.startsWith(origin) &&
            !seen.has(abs) &&
            !crawlQueueSet.has(abs) &&
            !abs.match(/\.(jpg|jpeg|png|gif|svg|pdf|zip|css|js|ico|woff|ttf)(\?|$)/i)
          ) {
            crawlQueue.push(abs);
            crawlQueueSet.add(abs);
          }
        } catch {}
      });
    }
  }

  return pages;
}

function buildTree(pages: DiscoveredPage[]): PageTreeNode[] {
  if (!pages.length) return [];

  let origin: string;
  let hostname: string;
  try {
    const first = new URL(pages[0].url);
    origin = first.origin;
    hostname = first.hostname;
  } catch { return []; }

  const root: PageTreeNode = { id: origin, name: hostname, type: "folder", children: [] };
  const nodeMap = new Map<string, PageTreeNode>();
  nodeMap.set("", root);

  for (const page of pages) {
    let pathname: string;
    try {
      // Normalize both http/https origins to the same tree root
      pathname = new URL(page.url).pathname.replace(/\/$/, "") || "/";
    } catch { continue; }

    if (pathname === "/") {
      root.children!.unshift({ id: page.url, name: "(home)", type: "file", url: page.url });
      continue;
    }
    const segments = pathname.split("/").filter(Boolean);
    let parent = root;
    let pathSoFar = "";

    for (let i = 0; i < segments.length; i++) {
      pathSoFar += "/" + segments[i];
      const isLast = i === segments.length - 1;
      let node = nodeMap.get(pathSoFar);

      if (!node) {
        node = isLast
          ? { id: page.url, name: segments[i], type: "file", url: page.url }
          : { id: origin + pathSoFar, name: segments[i], type: "folder", children: [] };
        nodeMap.set(pathSoFar, node);
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else if (isLast && node.type === "folder") {
        node.url = page.url;
      }

      if (!isLast) {
        // Ensure node can act as a parent folder
        if (!node.children) node.children = [];
        if (node.type === "file") node.type = "folder";
        parent = node;
      }
    }
  }

  return [root];
}

const knowledgeService = new KnowledgeService();

export async function uploadDocument(req: AuthRequest, res: Response) {
  if (!req.file) return error(res, "No file uploaded", 400);
  try {
    const knowledgeBaseId = (req.body.knowledgeBaseId ?? req.body.projectId) as string | undefined;
    const doc = await knowledgeService.queueDocument(req.user!.tenantId, req.user!.id, req.file, knowledgeBaseId);
    return success(res, doc, "Document queued for processing", 201);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function scrapeUrl(req: AuthRequest, res: Response) {
  const { url, title, knowledgeBaseId, projectId } = req.body;
  if (!url) return error(res, "URL is required", 400);
  try {
    new URL(url); // validate
    const doc = await knowledgeService.queueUrl(req.user!.tenantId, req.user!.id, url, title, knowledgeBaseId ?? projectId);
    return success(res, doc, "URL queued for processing", 201);
  } catch (err: any) {
    return error(res, err.message ?? "Invalid URL", 400);
  }
}

export async function clearTenantData(req: AuthRequest, res: Response) {
  try {
    const result = await knowledgeService.clearTenantData(req.user!.tenantId);
    return success(res, result, `Cleared ${result.deleted} documents and all embeddings`);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function listDocuments(req: AuthRequest, res: Response) {
  const docs = await knowledgeService.listDocuments(req.user!.tenantId);
  return success(res, docs);
}

export async function deleteDocument(req: AuthRequest, res: Response) {
  try {
    await knowledgeService.deleteDocument(req.user!.tenantId, String(req.params.id));
    return success(res, null, "Document deleted");
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function discoverPages(req: AuthRequest, res: Response) {
  const { url } = req.body;
  if (!url) return error(res, "URL is required", 400);
  try {
    new URL(url);
  } catch {
    return error(res, "Invalid URL", 400);
  }
  try {
    const pages = await fetchUrls(url);
    const tree = buildTree(pages);
    return success(res, { tree, pages, count: pages.length });
  } catch (err: any) {
    console.error("[discover]", err?.message, err?.stack);
    return error(res, err?.message ?? "Discovery failed", 500);
  }
}

export async function getDocumentChunks(req: AuthRequest, res: Response) {
  try {
    const [doc] = await db
      .select({ id: documents.id, title: documents.title, status: documents.status })
      .from(documents)
      .where(and(eq(documents.id, String(req.params.id)), eq(documents.tenantId, req.user!.tenantId)))
      .limit(1);

    if (!doc) return error(res, "Document not found", 404);

    const docChunks = await db
      .select({
        id: chunks.id,
        content: chunks.content,
        chunkIndex: chunks.chunkIndex,
        tokenCount: chunks.tokenCount,
        metadata: chunks.metadata,
        createdAt: chunks.createdAt,
      })
      .from(chunks)
      .where(eq(chunks.documentId, String(req.params.id)))
      .orderBy(asc(chunks.chunkIndex));

    return success(res, { document: doc, chunks: docChunks });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}
