import type { Response } from "express";
import type { AuthRequest } from "../../common/middleware/auth.middleware";
import { db, conversations, messages, handoffs, learnedResponses } from "@askbase/database";
import { eq, count, sql } from "drizzle-orm";
import { success } from "../../common/utils/response";

export async function getOverview(req: AuthRequest, res: Response) {
  const tenantId = req.user!.tenantId;

  const [totalConversations] = await db
    .select({ count: count() })
    .from(conversations)
    .where(eq(conversations.tenantId, tenantId));

  const [resolvedConversations] = await db
    .select({ count: count() })
    .from(conversations)
    .where(eq(conversations.tenantId, tenantId));

  const [totalHandoffs] = await db
    .select({ count: count() })
    .from(handoffs)
    .innerJoin(conversations, eq(handoffs.conversationId, conversations.id))
    .where(eq(conversations.tenantId, tenantId));

  const [learnedCount] = await db
    .select({ count: count() })
    .from(learnedResponses)
    .where(eq(learnedResponses.tenantId, tenantId));

  return success(res, {
    totalConversations: totalConversations.count,
    resolvedConversations: resolvedConversations.count,
    totalHandoffs: totalHandoffs.count,
    aiResolutionRate: totalConversations.count > 0
      ? ((totalConversations.count - totalHandoffs.count) / totalConversations.count * 100).toFixed(1)
      : "0",
    learnedResponses: learnedCount.count,
  });
}
