import type { Response } from "express";
import type { AuthRequest } from "../../common/middleware/auth.middleware";
import { db, knowledgeBases, documents, chunks } from "@askbase/database";
import { eq, and } from "drizzle-orm";
import { success, error } from "../../common/utils/response";

export async function listKnowledgeBases(req: AuthRequest, res: Response) {
  try {
    const kbs = await db
      .select()
      .from(knowledgeBases)
      .where(eq(knowledgeBases.tenantId, req.user!.tenantId));

    // Attach doc counts per KB
    const enriched = await Promise.all(kbs.map(async kb => {
      const docs = await db
        .select({ id: documents.id, status: documents.status })
        .from(documents)
        .where(and(
          eq(documents.knowledgeBaseId, kb.id),
          eq(documents.tenantId, req.user!.tenantId),
        ));

      return {
        ...kb,
        documentCount: docs.length,
        readyCount: docs.filter(d => d.status === "ready").length,
        processingCount: docs.filter(d => d.status === "processing").length,
        failedCount: docs.filter(d => d.status === "failed").length,
      };
    }));

    return success(res, enriched);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function createKnowledgeBase(req: AuthRequest, res: Response) {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return error(res, "Name is required", 400);

    const [kb] = await db.insert(knowledgeBases).values({
      tenantId: req.user!.tenantId,
      name: name.trim(),
      description: description?.trim() || null,
    }).returning();

    return success(res, kb, "Knowledge base created", 201);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function updateKnowledgeBase(req: AuthRequest, res: Response) {
  try {
    const { name, description } = req.body;
    const [updated] = await db
      .update(knowledgeBases)
      .set({ name, description, updatedAt: new Date() })
      .where(and(
        eq(knowledgeBases.id, req.params.id),
        eq(knowledgeBases.tenantId, req.user!.tenantId),
      ))
      .returning();

    if (!updated) return error(res, "Knowledge base not found", 404);
    return success(res, updated);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function deleteKnowledgeBase(req: AuthRequest, res: Response) {
  try {
    // Cascade: documents.knowledgeBaseId → set null, chunks remain until doc deleted
    await db.delete(knowledgeBases).where(
      and(
        eq(knowledgeBases.id, req.params.id),
        eq(knowledgeBases.tenantId, req.user!.tenantId),
      )
    );
    return success(res, null, "Knowledge base deleted");
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function getKnowledgeBaseDocuments(req: AuthRequest, res: Response) {
  try {
    const docs = await db
      .select()
      .from(documents)
      .where(and(
        eq(documents.knowledgeBaseId, req.params.id),
        eq(documents.tenantId, req.user!.tenantId),
      ));
    return success(res, docs);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function clearKnowledgeBase(req: AuthRequest, res: Response) {
  try {
    // Delete chunks first (FK constraint), then documents
    await db.delete(chunks).where(eq(chunks.tenantId, req.user!.tenantId));
    const result = await db
      .delete(documents)
      .where(and(
        eq(documents.knowledgeBaseId, req.params.id),
        eq(documents.tenantId, req.user!.tenantId),
      ))
      .returning({ id: documents.id });

    return success(res, { deleted: result.length }, `Cleared ${result.length} documents`);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}
