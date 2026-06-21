import type { Request, Response } from "express";
import { db, conversations, messages, handoffs, learnedResponses } from "@askbase/database";
import { eq, and } from "drizzle-orm";
import { embedQuery } from "../../common/utils/voyage";
import { io } from "../../server";
import { success, error } from "../../common/utils/response";

export async function getQueue(req: Request, res: Response) {
  try {
    const tenantId = (req as any).user.tenantId;
    const queue = await db
      .select()
      .from(handoffs)
      .innerJoin(conversations, eq(handoffs.conversationId, conversations.id))
      .where(and(eq(handoffs.status, "pending"), eq(conversations.tenantId, tenantId)));
    return success(res, queue);
  } catch (e) {
    return error(res, "Failed to get queue", 500);
  }
}

export async function acceptHandoff(req: Request, res: Response) {
  try {
    const agentId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const { conversationId } = req.params;

    const [conv] = await db.select().from(conversations)
      .where(and(eq(conversations.id, conversationId), eq(conversations.tenantId, tenantId))).limit(1);
    if (!conv) return error(res, "Conversation not found", 404);

    await db.update(handoffs)
      .set({ status: "accepted", assignedAgentId: agentId })
      .where(eq(handoffs.conversationId, conversationId));

    await db.update(conversations)
      .set({ assignedAgentId: agentId, updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    io.to(`conversation:${conversationId}`).emit("conversation:agent_joined", { agentId });
    return success(res, { accepted: true });
  } catch (e) {
    return error(res, "Failed to accept handoff", 500);
  }
}

export async function sendAgentMessage(req: Request, res: Response) {
  try {
    const agentId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) return error(res, "Content required", 400);

    const [conv] = await db.select().from(conversations)
      .where(and(eq(conversations.id, conversationId), eq(conversations.tenantId, tenantId))).limit(1);
    if (!conv) return error(res, "Conversation not found", 404);

    const [msg] = await db.insert(messages).values({
      conversationId,
      senderType: "agent",
      senderId: agentId,
      content,
    }).returning();

    io.to(`conversation:${conversationId}`).emit("message:new", msg);
    return success(res, msg, 201);
  } catch (e) {
    return error(res, "Failed to send message", 500);
  }
}

export async function resolveByAgent(req: Request, res: Response) {
  try {
    const agentId = (req as any).user.id;
    const tenantId = (req as any).user.tenantId;
    const { conversationId } = req.params;
    const { resolution, saveAsLearned } = req.body;

    const [conv] = await db.select().from(conversations)
      .where(and(eq(conversations.id, conversationId), eq(conversations.tenantId, tenantId))).limit(1);
    if (!conv) return error(res, "Conversation not found", 404);

    await db.update(conversations)
      .set({ status: "resolved", resolvedAt: new Date(), updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    await db.update(handoffs)
      .set({ status: "resolved" })
      .where(eq(handoffs.conversationId, conversationId));

    if (saveAsLearned && resolution) {
      const question = req.body.question ?? resolution;
      const embedding = await embedQuery(question);
      await db.insert(learnedResponses).values({
        tenantId,
        conversationId,
        reviewedById: agentId,
        question,
        answer: resolution,
        embedding,
        isApproved: true,
      });
    }

    io.to(`conversation:${conversationId}`).emit("conversation:resolved", { conversationId });
    return success(res, { resolved: true });
  } catch (e) {
    return error(res, "Failed to resolve conversation", 500);
  }
}
