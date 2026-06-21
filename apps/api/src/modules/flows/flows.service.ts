import { db, flows, flowLeads } from "@askbase/database";
import { eq, and, desc } from "drizzle-orm";
import Groq from "groq-sdk";
import { env } from "../../config/env";
import https from "https";

async function sendLeadEmail(to: string, flowName: string, data: Record<string, any>) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return;
  // Dynamic import to avoid bundling nodemailer if not installed
  const nodemailer = await import("nodemailer").catch(() => null);
  if (!nodemailer) return;

  const rows = Object.entries(data)
    .filter(([k]) => !k.startsWith("_"))
    .map(([k, v]) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;white-space:nowrap">${k}</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:500">${v ?? ""}</td></tr>`)
    .join("");

  const transport = nodemailer.default.createTransport({
    host: env.SMTP_HOST, port: Number(env.SMTP_PORT ?? 587), secure: false,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  await transport.sendMail({
    from: `"AskBase" <${env.SMTP_USER}>`,
    to,
    subject: `New lead from "${flowName}"`,
    html: `<div style="font-family:sans-serif;max-width:480px">
      <p style="font-size:14px;color:#111827">You have a new lead from <strong>${flowName}</strong>:</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">${rows}</table>
      <p style="font-size:12px;color:#9ca3af;margin-top:16px">Sent by AskBase</p>
    </div>`,
  });
}

const VALID_TYPES = new Set(["start", "message", "collect", "choice", "lead_save", "webhook", "google_sheet", "end"]);

const DEFAULT_DATA: Record<string, any> = {
  start:     { trigger: "widget_open", delaySeconds: 0 },
  message:   { message: "" },
  collect:   { question: "", fieldName: "", fieldType: "text", required: true, placeholder: "" },
  choice:    { question: "", fieldName: "", options: [{ id: "opt_1", label: "Option 1", value: "option_1" }], multiple: false },
  lead_save: { notifyEmail: "" },
  webhook:      { url: "", method: "POST", secret: "" },
  google_sheet: { webAppUrl: "" },
  end:       { message: "Thanks! We'll be in touch soon.", action: "close", redirectUrl: "" },
};

const NODES_PER_COL = 5;
const COL_X = 300;
const ROW_Y = 160;
const ORIGIN_X = 50;
const ORIGIN_Y = 0;

function gridPosition(index: number) {
  const col = Math.floor(index / NODES_PER_COL);
  const row = index % NODES_PER_COL;
  return { x: ORIGIN_X + col * COL_X, y: ORIGIN_Y + row * ROW_Y };
}

function orderNodes(nodes: any[], edges: any[]): any[] {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const list = adj.get(e.source) ?? [];
    list.push(e.target);
    adj.set(e.source, list);
  }
  const start = nodes.find(n => n.type === "start") ?? nodes[0];
  const visited = new Set<string>();
  const out: any[] = [];
  const stack = [start.id];
  while (stack.length) {
    const id = stack.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const n = byId.get(id);
    if (n) out.push(n);
    for (const next of adj.get(id) ?? []) if (!visited.has(next)) stack.push(next);
  }
  for (const n of nodes) if (!visited.has(n.id)) out.push(n);
  return out;
}

function validateAndFix(raw: any): { nodes: any[]; edges: any[] } {
  // Sanitize nodes (positions get overwritten below)
  const nodes: any[] = (raw.nodes ?? [])
    .filter((n: any) => n?.id && VALID_TYPES.has(n.type))
    .map((n: any) => ({
      id: String(n.id),
      type: n.type,
      position: { x: 0, y: 0 },
      data: { ...DEFAULT_DATA[n.type], ...(n.data ?? {}) },
    }));

  // Ensure there is exactly one start node first
  const hasStart = nodes.some(n => n.type === "start");
  if (!hasStart) {
    nodes.unshift({ id: "start-1", type: "start", position: { x: 0, y: 0 }, data: DEFAULT_DATA.start });
  }

  const nodeIds = new Set(nodes.map(n => n.id));

  // Sanitize edges — both ends must exist, no self-loops
  const edgeSeen = new Set<string>();
  const edges: any[] = (raw.edges ?? [])
    .filter((e: any) => {
      const src = String(e.source ?? "");
      const tgt = String(e.target ?? "");
      const key = `${src}->${tgt}`;
      if (!src || !tgt || src === tgt) return false;
      if (!nodeIds.has(src) || !nodeIds.has(tgt)) return false;
      if (edgeSeen.has(key)) return false;
      edgeSeen.add(key);
      return true;
    })
    .map((e: any) => ({
      id: e.id ?? `e-${e.source}-${e.target}`,
      source: String(e.source),
      target: String(e.target),
    }));

  const ordered = orderNodes(nodes, edges).map((n, i) => ({ ...n, position: gridPosition(i) }));

  return { nodes: ordered, edges };
}

export class FlowsService {
  async list(tenantId: string) {
    return db.select().from(flows)
      .where(eq(flows.tenantId, tenantId))
      .orderBy(desc(flows.updatedAt));
  }

  async get(tenantId: string, id: string) {
    const [flow] = await db.select().from(flows)
      .where(and(eq(flows.id, id), eq(flows.tenantId, tenantId)))
      .limit(1);
    return flow ?? null;
  }

  async create(tenantId: string, data: { name: string; description?: string; mode?: "standalone" | "ai_tool" }) {
    const [flow] = await db.insert(flows).values({
      tenantId,
      name: data.name,
      description: data.description ?? null,
      mode: data.mode ?? "standalone",
      nodes: [],
      edges: [],
    }).returning();
    return flow;
  }

  async update(tenantId: string, id: string, data: Partial<{
    name: string;
    description: string;
    nodes: any[];
    edges: any[];
    mode: "standalone" | "ai_tool";
    toolDescription: string;
    isActive: boolean;
  }>) {
    const [updated] = await db.update(flows)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(flows.id, id), eq(flows.tenantId, tenantId)))
      .returning();
    return updated ?? null;
  }

  async delete(tenantId: string, id: string) {
    await db.delete(flows).where(and(eq(flows.id, id), eq(flows.tenantId, tenantId)));
  }

  async getLeads(tenantId: string, flowId: string) {
    return db.select().from(flowLeads)
      .where(and(eq(flowLeads.flowId, flowId), eq(flowLeads.tenantId, tenantId)))
      .orderBy(desc(flowLeads.createdAt));
  }

  async submitLead(flowId: string, payload: {
    data: Record<string, any>;
    conversation: any[];
    isPartial: boolean;
    sourceUrl?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }) {
    const [flow] = await db.select().from(flows).where(eq(flows.id, flowId)).limit(1);
    if (!flow) return null;

    const [lead] = await db.insert(flowLeads).values({
      tenantId: flow.tenantId,
      flowId,
      data: payload.data,
      conversation: payload.conversation,
      isPartial: payload.isPartial,
      sourceUrl: payload.sourceUrl ?? null,
      utmSource: payload.utmSource ?? null,
      utmMedium: payload.utmMedium ?? null,
      utmCampaign: payload.utmCampaign ?? null,
    }).returning();

    // Fire email notification if lead_save node has notifyEmail set
    const notifyEmail = (flow.nodes as any[]).find(n => n.type === "lead_save")?.data?.notifyEmail;
    if (notifyEmail && !payload.isPartial) {
      sendLeadEmail(notifyEmail, flow.name, payload.data).catch(() => {});
    }

    return lead;
  }

  async updateLead(tenantId: string, leadId: string, patch: {
    status?: "new" | "contacted" | "qualified" | "won" | "lost";
    tags?: string[];
    notes?: string;
  }) {
    const [lead] = await db.update(flowLeads)
      .set(patch)
      .where(and(eq(flowLeads.id, leadId), eq(flowLeads.tenantId, tenantId)))
      .returning();
    return lead ?? null;
  }

  async saveLead(flowId: string, tenantId: string, data: Record<string, any>) {
    const [lead] = await db.insert(flowLeads).values({ tenantId, flowId, data }).returning();
    return lead;
  }

  async generateFlow(prompt: string): Promise<{ nodes: any[]; edges: any[] }> {
    const groq = new Groq({ apiKey: env.GROQ_API_KEY });

    const systemInstruction = `You are a chatbot flow designer. Output ONLY a valid JSON object with "nodes" and "edges" arrays. No markdown fences, no explanation, no extra text — just the raw JSON.

NODE TYPES and their exact data shapes:
- "start":     { "trigger": "widget_open", "delaySeconds": 0 }
- "message":   { "message": "string" }
- "collect":   { "question": "string", "fieldName": "snake_case", "fieldType": "text|email|phone|number|url", "required": true, "placeholder": "string" }
- "choice":    { "question": "string", "fieldName": "snake_case", "options": [{"id":"opt_1","label":"Label","value":"value"}], "multiple": false }
- "lead_save": { "notifyEmail": "" }
- "webhook":      { "url": "https://", "method": "POST", "secret": "" }
- "google_sheet": { "webAppUrl": "https://script.google.com/macros/s/.../exec" }
- "end":       { "message": "string", "action": "close", "redirectUrl": "" }

ID RULES (do NOT include position fields — the server lays nodes out automatically):
- Node IDs: "start-1", "message-1", "collect-1", "collect-2", "choice-1", "lead_save-1", "webhook-1", "google_sheet-1", "end-1"
- Edge IDs: "e-{source}-{target}"

FLOW RULES:
1. MUST start with exactly one node of type "start" with id "start-1"
2. MUST end with one node of type "end"
3. Every node must be connected — no orphan nodes
4. Typical order: start → message (greeting) → collect fields → lead_save → webhook (if needed) → end
5. "fieldName" must be snake_case: name, email, phone, company, message
6. Keep the flow linear unless user specifically asks for branching`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Create a chatbot flow for: ${prompt}` },
      ],
    });

    const raw = JSON.parse(completion.choices[0].message.content ?? "{}");
    return validateAndFix(raw);
  }
}
