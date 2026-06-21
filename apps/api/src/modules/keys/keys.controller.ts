import type { Request, Response } from "express";
import { randomBytes, createHash } from "crypto";
import { db, apiKeys } from "@askbase/database";
import { eq, and } from "drizzle-orm";
import { CreateApiKeySchema } from "@askbase/shared";
import { success, error } from "../../common/utils/response";

export async function listKeys(req: Request, res: Response) {
  try {
    const tenantId = (req as any).user.tenantId;
    const keys = await db.select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      isActive: apiKeys.isActive,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    }).from(apiKeys).where(eq(apiKeys.tenantId, tenantId));
    return success(res, keys);
  } catch (e) {
    return error(res, "Failed to list keys", 500);
  }
}

export async function createKey(req: Request, res: Response) {
  try {
    const tenantId = (req as any).user.tenantId;
    const parsed = CreateApiKeySchema.safeParse(req.body);
    if (!parsed.success) return error(res, parsed.error.message, 400);

    const raw = "ask_live_" + randomBytes(16).toString("hex");
    const keyPrefix = raw.slice(0, 10);
    const keyHash = createHash("sha256").update(raw).digest("hex");

    const [key] = await db.insert(apiKeys).values({
      tenantId,
      name: parsed.data.name,
      keyHash,
      keyPrefix,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
    }).returning();

    return success(res, { ...key, rawKey: raw }, 201);
  } catch (e) {
    return error(res, "Failed to create key", 500);
  }
}

export async function revokeKey(req: Request, res: Response) {
  try {
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;
    await db.update(apiKeys)
      .set({ isActive: false })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, tenantId)));
    return success(res, { revoked: true });
  } catch (e) {
    return error(res, "Failed to revoke key", 500);
  }
}
