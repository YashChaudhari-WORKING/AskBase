import { db, documents, chunks } from "@askbase/database";
import { eq, and } from "drizzle-orm";
import { ingestionQueue } from "../../common/utils/queue";

export class KnowledgeService {
  async queueDocument(tenantId: string, userId: string, file: Express.Multer.File, knowledgeBaseId?: string) {
    const [doc] = await db.insert(documents).values({
      tenantId,
      uploadedById: userId,
      knowledgeBaseId: knowledgeBaseId ?? null,
      title: file.originalname.replace(/\.[^.]+$/, ""),
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      storagePath: file.path,
      status: "processing",
    }).returning();

    await ingestionQueue.add("process-document", {
      documentId: doc.id,
      tenantId,
      type: "file",
      filePath: file.path,
      mimeType: file.mimetype,
    });

    return doc;
  }

  async queueUrl(tenantId: string, userId: string, url: string, title?: string, knowledgeBaseId?: string) {
    const hostname = new URL(url).hostname;
    const [doc] = await db.insert(documents).values({
      tenantId,
      uploadedById: userId,
      knowledgeBaseId: knowledgeBaseId ?? null,
      title: title ?? hostname,
      fileName: url,
      fileType: "text/html",
      fileSize: 0,
      storagePath: url,
      status: "processing",
    }).returning();

    await ingestionQueue.add("process-document", {
      documentId: doc.id,
      tenantId,
      type: "url",
      url,
    });

    return doc;
  }

  async listDocuments(tenantId: string) {
    return db.select().from(documents).where(eq(documents.tenantId, tenantId));
  }

  async deleteDocument(tenantId: string, documentId: string) {
    await db.delete(documents).where(
      and(eq(documents.id, documentId), eq(documents.tenantId, tenantId))
    );
  }

  async clearTenantData(tenantId: string) {
    await db.delete(chunks).where(eq(chunks.tenantId, tenantId));
    const deleted = await db
      .delete(documents)
      .where(eq(documents.tenantId, tenantId))
      .returning({ id: documents.id });
    return { deleted: deleted.length };
  }
}
