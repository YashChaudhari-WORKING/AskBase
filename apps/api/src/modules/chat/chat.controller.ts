import type { Request, Response } from "express";
import type { AuthRequest } from "../../common/middleware/auth.middleware";
import { ChatService } from "./chat.service";
import { success, error } from "../../common/utils/response";

const chatService = new ChatService();

export async function sendMessage(req: Request, res: Response) {
  try {
    const tenantId = (req as any).tenantId ?? (req as AuthRequest).user?.tenantId;
    if (!tenantId) return error(res, "Unauthorized", 401);
    const result = await chatService.sendMessage(tenantId, req.body, (req as any).projectId);
    return success(res, result);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function getConversation(req: AuthRequest, res: Response) {
  try {
    const conv = await chatService.getConversation(req.user!.tenantId, req.params.id);
    return success(res, conv);
  } catch (err: any) {
    return error(res, err.message, 404);
  }
}

export async function listConversations(req: AuthRequest, res: Response) {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const convs = await chatService.listConversations(req.user!.tenantId, status);
    return success(res, convs ?? []);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function agentReply(req: AuthRequest, res: Response) {
  try {
    const { content } = req.body;
    if (!content?.trim()) return error(res, "Message content required", 400);
    const msg = await chatService.sendAgentReply(
      req.user!.tenantId,
      req.params.id,
      content,
      req.user!.id,
    );
    return success(res, msg);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function resolveConversation(req: AuthRequest, res: Response) {
  try {
    const result = await chatService.resolveConversation(
      req.user!.tenantId,
      req.params.id,
      req.body.resolution,
      req.body.saveAsLearned ?? true
    );
    return success(res, result, "Conversation resolved");
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}
