import { createHash } from "crypto";
import { db, apiKeys } from "@askbase/database";
import { eq, and } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-api-key"] as string;
  if (!key) return res.status(401).json({ success: false, message: "API key required" });

  const keyHash = createHash("sha256").update(key).digest("hex");

  const [found] = await db
    .select({ tenantId: apiKeys.tenantId, isActive: apiKeys.isActive, expiresAt: apiKeys.expiresAt, id: apiKeys.id, projectId: apiKeys.projectId })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)))
    .limit(1);

  if (!found) return res.status(401).json({ success: false, message: "Invalid API key" });
  if (found.expiresAt && found.expiresAt < new Date()) return res.status(401).json({ success: false, message: "API key expired" });

  db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, found.id)).catch(() => {});

  (req as any).tenantId = found.tenantId;
  (req as any).projectId = found.projectId ?? null;
  next();
}
