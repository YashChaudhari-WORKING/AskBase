import type { Request, Response } from "express";
import { AgentsService } from "./agents.service";
import { InviteAgentSchema } from "@askbase/shared";
import { success, error } from "../../common/utils/response";

const service = new AgentsService();

export async function listAgents(req: Request, res: Response) {
  try {
    const tenantId = (req as any).user.tenantId;
    return success(res, await service.list(tenantId));
  } catch (e) {
    return error(res, "Failed to list agents", 500);
  }
}

export async function inviteAgent(req: Request, res: Response) {
  try {
    const tenantId = (req as any).user.tenantId;
    const parsed = InviteAgentSchema.safeParse(req.body);
    if (!parsed.success) return error(res, parsed.error.message, 400);
    const agent = await service.invite(tenantId, parsed.data);
    return success(res, agent, 201);
  } catch (e: any) {
    return error(res, e.message ?? "Failed to invite agent", 400);
  }
}

export async function updateAgentRole(req: Request, res: Response) {
  try {
    const tenantId = (req as any).user.tenantId;
    const { id } = req.params;
    const { role } = req.body;
    if (!["admin", "agent"].includes(role)) return error(res, "Invalid role", 400);
    return success(res, await service.updateRole(tenantId, id, role));
  } catch (e: any) {
    return error(res, e.message ?? "Failed to update role", 400);
  }
}

export async function deactivateAgent(req: Request, res: Response) {
  try {
    return success(res, await service.setActive((req as any).user.tenantId, req.params.id, false));
  } catch (e: any) {
    return error(res, e.message ?? "Failed to deactivate agent", 400);
  }
}

export async function activateAgent(req: Request, res: Response) {
  try {
    return success(res, await service.setActive((req as any).user.tenantId, req.params.id, true));
  } catch (e: any) {
    return error(res, e.message ?? "Failed to activate agent", 400);
  }
}

export async function removeAgent(req: Request, res: Response) {
  try {
    return success(res, await service.remove((req as any).user.tenantId, req.params.id));
  } catch (e: any) {
    return error(res, e.message ?? "Failed to remove agent", 400);
  }
}
