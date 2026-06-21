import type { Request, Response } from "express";
import type { AuthRequest } from "../../common/middleware/auth.middleware";
import { FlowsService } from "./flows.service";
import { success, error } from "../../common/utils/response";
import { db, flows } from "@askbase/database";
import { eq } from "drizzle-orm";

const svc = new FlowsService();

export async function listFlows(req: AuthRequest, res: Response) {
  try {
    return success(res, await svc.list(req.user!.tenantId));
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function getFlow(req: AuthRequest, res: Response) {
  try {
    const flow = await svc.get(req.user!.tenantId, req.params.id);
    if (!flow) return error(res, "Flow not found", 404);
    return success(res, flow);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function createFlow(req: AuthRequest, res: Response) {
  try {
    const { name, description, mode } = req.body;
    if (!name?.trim()) return error(res, "Name required", 400);
    const flow = await svc.create(req.user!.tenantId, { name, description, mode });
    return success(res, flow, "Flow created", 201);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function updateFlow(req: AuthRequest, res: Response) {
  try {
    const flow = await svc.update(req.user!.tenantId, req.params.id, req.body);
    if (!flow) return error(res, "Flow not found", 404);
    return success(res, flow);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function deleteFlow(req: AuthRequest, res: Response) {
  try {
    await svc.delete(req.user!.tenantId, req.params.id);
    return success(res, null, "Flow deleted");
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function getFlowLeads(req: AuthRequest, res: Response) {
  try {
    const leads = await svc.getLeads(req.user!.tenantId, req.params.id);
    return success(res, leads);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function submitFlowLead(req: Request, res: Response) {
  try {
    const { flowId } = req.params;
    const { data, conversation = [], isPartial = false, sourceUrl, utmSource, utmMedium, utmCampaign } = req.body;
    if (!data || typeof data !== "object") return error(res, "data required", 400);
    const lead = await svc.submitLead(flowId, { data, conversation, isPartial, sourceUrl, utmSource, utmMedium, utmCampaign });
    if (!lead) return error(res, "Flow not found", 404);
    return success(res, lead, "Lead saved", 201);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function updateFlowLead(req: AuthRequest, res: Response) {
  try {
    const { status, tags, notes } = req.body;
    const lead = await svc.updateLead(req.user!.tenantId, req.params.leadId, { status, tags, notes });
    if (!lead) return error(res, "Lead not found", 404);
    return success(res, lead);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function getFlowPublic(req: Request, res: Response) {
  try {
    const { flowId } = req.params;
    const [flow] = await db
      .select({ nodes: flows.nodes, edges: flows.edges, name: flows.name })
      .from(flows)
      .where(eq(flows.id, flowId))
      .limit(1);
    if (!flow) return error(res, "Flow not found", 404);
    return success(res, { nodes: flow.nodes, edges: flow.edges });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function generateFlow(req: AuthRequest, res: Response) {
  try {
    const { prompt } = req.body;
    if (!prompt?.trim()) return error(res, "Prompt required", 400);
    const result = await svc.generateFlow(prompt.trim());
    return success(res, result);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}
