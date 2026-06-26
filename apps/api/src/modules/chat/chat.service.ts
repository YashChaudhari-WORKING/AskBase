import { db, conversations, messages, customers, handoffs, botConfigs, learnedResponses, projects, documents, flows, flowLeads } from "@askbase/database";
import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RagService } from "../rag/rag.service";
import { classifyIntent } from "./intent.service";
import { embedQuery } from "../../common/utils/voyage";
import { io, isAgentOnline } from "../../server";
import { env } from "../../config/env";
import type { SendMessageInput } from "@askbase/shared";

const ragService = new RagService();
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// History compaction settings
const COMPACT_TRIGGER = 8;   // compact when uncompacted msgs exceed this
const KEEP_RECENT    = 4;    // always keep last N messages raw after compaction

type ContextMessage = { role: "user" | "assistant"; content: string };

async function buildContextMessages(
  conversationId: string,
  currentMsgId: string
): Promise<ContextMessage[]> {
  // Fetch all messages in order (excluding the just-inserted current one)
  const allMsgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  // Exclude the current message itself (it's the question we're answering)
  const history = allMsgs.filter(m => m.id !== currentMsgId);
  if (history.length === 0) return [];

  // Fetch conversation metadata (stores summary watermark)
  const [conv] = await db
    .select({ metadata: conversations.metadata })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  const meta = (conv?.metadata as Record<string, any>) ?? {};
  const existingSummary: string | undefined = meta.contextSummary;
  const summarizedUpToCount: number = meta.summarizedUpToCount ?? 0;

  const uncompactedCount = history.length - summarizedUpToCount;

  // Under threshold → pass raw messages (or existing summary + recent)
  if (uncompactedCount <= COMPACT_TRIGGER) {
    if (!existingSummary) {
      return history.map(m => ({
        role: (m.senderType === "customer" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      }));
    }
    // Has a summary from earlier → summary + uncompacted raw tail
    const rawTail = history.slice(summarizedUpToCount);
    return [
      { role: "user", content: `[Earlier conversation summary: ${existingSummary}]` },
      ...rawTail.map(m => ({
        role: (m.senderType === "customer" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      })),
    ];
  }

  // Over threshold → compact: summarize everything except last KEEP_RECENT
  const toSummarize = history.slice(0, history.length - KEEP_RECENT);
  const recentRaw   = history.slice(history.length - KEEP_RECENT);

  const transcript = toSummarize
    .map(m => `${m.senderType === "customer" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const summaryPrompt = existingSummary
    ? `You have an existing conversation summary:\n"${existingSummary}"\n\nNew messages to merge into the summary:\n${transcript}\n\nWrite a single updated 2-3 sentence summary covering the entire conversation so far. Include: what the user needed, key facts about them, what was resolved.`
    : `Summarize this customer support conversation in 2-3 sentences. Include: what the user needed, key facts, what was resolved.\n\n${transcript}`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: summaryPrompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
  });
  const newSummary = result.response.text().trim();

  // Persist compaction watermark + summary
  await db
    .update(conversations)
    .set({
      metadata: {
        ...meta,
        contextSummary: newSummary,
        summarizedUpToCount: history.length - KEEP_RECENT,
        lastCompactedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, conversationId));

  return [
    { role: "user", content: `[Conversation summary: ${newSummary}]` },
    ...recentRaw.map(m => ({
      role: (m.senderType === "customer" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    })),
  ];
}

export class ChatService {
  async sendMessage(tenantId: string, input: SendMessageInput, projectId?: string | null) {
    let customerId = input.customerId;
    if (!customerId) {
      const [customer] = await db.insert(customers).values({
        tenantId,
        email: input.customerEmail,
        name: input.customerName,
      }).returning();
      customerId = customer.id;
    }

    let conversationId = input.conversationId;
    const isNewConversation = !conversationId;
    if (!conversationId) {
      const [conv] = await db.insert(conversations).values({
        tenantId,
        customerId,
        status: "open",
      }).returning();
      conversationId = conv.id;
    }

    const [customerMsg] = await db.insert(messages).values({
      conversationId,
      senderType: "customer",
      content: input.content,
    }).returning();
    io.to(`conversation:${conversationId}`).emit("message:new", customerMsg);

    // Auto-name the conversation from the first customer message
    if (isNewConversation) {
      const subject = input.content.slice(0, 80).replace(/\n/g, " ").trim();
      await db.update(conversations).set({ subject }).where(eq(conversations.id, conversationId));
      io.to(`tenant:${tenantId}`).emit("conversation:new", { conversationId, channel: "widget", subject });
    }

    // Build smart context — compacts automatically when history grows large
    const contextMessages = await buildContextMessages(conversationId, customerMsg.id);

    // Resolve config: project-specific config takes priority over global bot config
    let systemPrompt: string | null = null;
    let confidenceThreshold = 0.35;
    let documentScope: string[] | null = null; // null = all documents
    let projectFlowTrigger: string | null = null;
    let projectFlowId: string | null = null;
    let projectAttachedFlows: Array<{ flowId: string; flowName: string; trigger: string }> = [];
    let assistantType: string = "ai_agent";
    let fallbackFlowId: string | null = null;

    if (projectId) {
      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.tenantId, tenantId)))
        .limit(1);

      if (project) {
        systemPrompt = project.systemPrompt;
        confidenceThreshold = project.confidenceThreshold;
        projectFlowTrigger = project.flowTrigger ?? null;
        projectFlowId = project.flowId ?? null;
        projectAttachedFlows = Array.isArray(project.attachedFlows) ? project.attachedFlows as any[] : [];
        assistantType = project.assistantType ?? "ai_agent";
        fallbackFlowId = project.fallbackFlowId ?? null;

        // Scope retrieval to documents in the project's linked knowledge base
        if (project.knowledgeBaseId) {
          const docs = await db
            .select({ id: documents.id })
            .from(documents)
            .where(and(
              eq(documents.knowledgeBaseId, project.knowledgeBaseId),
              eq(documents.tenantId, tenantId)
            ));
          documentScope = docs.map(d => d.id);
        }
      }
    } else {
      const [config] = await db
        .select()
        .from(botConfigs)
        .where(eq(botConfigs.tenantId, tenantId))
        .limit(1);
      systemPrompt = config?.systemPrompt ?? null;
      confidenceThreshold = config?.confidenceThreshold ?? 0.35;
    }

    // ── Flow-only bot routing chain ──────────────────────────────────────────
    if (assistantType === "flow") {
      // 1. Agent online → hand off immediately
      if (isAgentOnline(tenantId)) {
        const [handoff] = await db.insert(handoffs).values({
          conversationId,
          reason: "Agent available — routing to live support",
          status: "pending",
        }).returning();
        await db.update(conversations)
          .set({ status: "assigned", updatedAt: new Date() })
          .where(eq(conversations.id, conversationId));
        const reply = "An agent is available right now! Connecting you…";
        const [aiMsg] = await db.insert(messages).values({
          conversationId, senderType: "ai", content: reply, confidenceScore: 1, isHandoffTrigger: true,
        }).returning();
        io.to(`tenant:${tenantId}`).emit("handoff:new", { handoffId: handoff.id, conversationId });
        io.to(`conversation:${conversationId}`).emit("message:new", aiMsg);
        return { message: aiMsg, conversationId, handoffTriggered: true };
      }

      // 2. Agent offline → try to match a configured flow by trigger
      const userText = input.content.toLowerCase();
      const matchedFlow = projectAttachedFlows.find((f) => {
        const triggers = (f.trigger ?? "").split("|").map((t: string) => t.trim().toLowerCase()).filter(Boolean);
        return triggers.some((t: string) => userText.includes(t));
      }) ?? (projectFlowId ? { flowId: projectFlowId, flowName: "default", trigger: "" } : null);

      if (matchedFlow) {
        const [aiMsg] = await db.insert(messages).values({
          conversationId, senderType: "ai", content: "__flow_trigger__", confidenceScore: 1,
          metadata: { action: "invoke_flow", flowId: matchedFlow.flowId },
        }).returning();
        io.to(`conversation:${conversationId}`).emit("message:new", aiMsg);
        return { message: aiMsg, conversationId, handoffTriggered: false, action: "invoke_flow", flowId: matchedFlow.flowId };
      }

      // 3. No flow matched → use configured fallback flow if set
      if (fallbackFlowId) {
        const [aiMsg] = await db.insert(messages).values({
          conversationId, senderType: "ai", content: "__flow_trigger__", confidenceScore: 1,
          metadata: { action: "invoke_flow", flowId: fallbackFlowId },
        }).returning();
        io.to(`conversation:${conversationId}`).emit("message:new", aiMsg);
        return { message: aiMsg, conversationId, handoffTriggered: false, action: "invoke_flow", flowId: fallbackFlowId };
      }

      // 4. System fallback — collect visitor details
      const fallbackReply = "I'd love to help! Our team is currently offline. Could you share your name, email, and what you need — we'll get back to you shortly.";
      const [aiMsg] = await db.insert(messages).values({
        conversationId, senderType: "ai", content: fallbackReply, confidenceScore: 1,
      }).returning();
      io.to(`conversation:${conversationId}`).emit("message:new", aiMsg);
      return { message: aiMsg, conversationId, handoffTriggered: false };
    }

    // ── Intent classification ──────────────────────────────────────────
    const intent = await classifyIntent(input.content, systemPrompt, contextMessages, projectFlowTrigger, projectFlowId, projectAttachedFlows);

    // Handle non-RAG intents directly without touching the knowledge base
    if (intent.intent === "greeting" || intent.intent === "out_of_scope" || intent.intent === "clarification") {
      const reply = intent.directReply ?? "I'm here to help! Could you provide more details about what you need?";
      const [aiMsg] = await db.insert(messages).values({
        conversationId,
        senderType: "ai",
        content: reply,
        confidenceScore: intent.confidence,
      }).returning();
      io.to(`conversation:${conversationId}`).emit("message:new", aiMsg);
      return { message: aiMsg, conversationId, handoffTriggered: false };
    }

    // Flow trigger — invoke the linked flow instead of RAG
    if (intent.intent === "flow_trigger") {
      const flowId = intent.flowId;
      const [aiMsg] = await db.insert(messages).values({
        conversationId,
        senderType: "ai",
        content: "__flow_trigger__",
        confidenceScore: intent.confidence,
        metadata: { action: "invoke_flow", flowId: flowId ?? null },
      }).returning();
      io.to(`conversation:${conversationId}`).emit("message:new", aiMsg);
      return { message: aiMsg, conversationId, handoffTriggered: false, action: "invoke_flow", flowId: flowId ?? null };
    }

    // User explicitly wants a human — skip RAG, escalate immediately
    if (intent.intent === "handoff_request") {
      const [handoff] = await db.insert(handoffs).values({
        conversationId,
        reason: "Customer requested human agent",
        status: "pending",
      }).returning();
      await db.update(conversations)
        .set({ status: "assigned", updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
      const reply = intent.directReply ?? "Connecting you with a human agent now. Please hold on.";
      const [aiMsg] = await db.insert(messages).values({
        conversationId,
        senderType: "ai",
        content: reply,
        confidenceScore: 1,
        isHandoffTrigger: true,
      }).returning();
      io.to(`conversation:${conversationId}`).emit("message:new", aiMsg);
      io.to(`conversation:${conversationId}`).emit("conversation:handoff", {
        handoffId: handoff.id,
        reason: "Customer requested human agent",
      });
      // Broadcast to all agents in this tenant
      const [cust] = await db.select({ name: customers.name }).from(customers).where(eq(customers.id, customerId)).limit(1);
      io.to(`tenant:${tenantId}`).emit("handoff:triggered", {
        conversationId,
        customerName: cust?.name ?? null,
        preview: reply.slice(0, 100),
      });
      return { message: aiMsg, conversationId, handoffTriggered: true, handoffId: handoff.id };
    }

    // ── RAG pipeline (rag_query intent) ───────────────────────────────
    const ragResult = await ragService.query(
      tenantId,
      input.content,
      systemPrompt,
      confidenceThreshold,
      contextMessages,
      documentScope,
      intent.rewrittenQuery  // pass optimized query for embedding
    );

    if (ragResult.shouldHandoff || !ragResult.answer) {
      // ── Soft handoff: clarify once before escalating ──────────────────
      const [convMeta] = await db
        .select({ metadata: conversations.metadata })
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);

      const meta = (convMeta?.metadata as Record<string, any>) ?? {};
      const softHandoffFired = !!meta.softHandoffFired;

      if (!softHandoffFired) {
        // First low-confidence hit — ask a clarifying question instead of handing off
        await db.update(conversations)
          .set({ metadata: { ...meta, softHandoffFired: true }, updatedAt: new Date() })
          .where(eq(conversations.id, conversationId));

        // Generate a smart clarifying question using the system prompt context
        let clarifyMsg = "I want to make sure I give you the right information. Could you share a bit more detail about what you're looking for?";
        try {
          const clarifyModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const clarifyResult = await clarifyModel.generateContent({
            contents: [{ role: "user", parts: [{ text:
              `You are a customer support assistant. A visitor sent: "${input.content}"\n\nYou couldn't find a good answer in your knowledge base. Write ONE short, specific clarifying question (max 20 words) to help you understand exactly what they need. Do not mention the knowledge base. Just ask the question naturally.`
            }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 60 },
          });
          clarifyMsg = clarifyResult.response.text().trim().replace(/^"|"$/g, "");
        } catch { /* use default */ }

        const [aiMsg] = await db.insert(messages).values({
          conversationId,
          senderType: "ai",
          content: clarifyMsg,
          confidenceScore: ragResult.confidence,
        }).returning();
        io.to(`conversation:${conversationId}`).emit("message:new", aiMsg);
        return { message: aiMsg, conversationId, handoffTriggered: false };
      }

      // Second consecutive low-confidence — now actually handoff
      const [handoff] = await db.insert(handoffs).values({
        conversationId,
        reason: "Low confidence after clarification attempt",
        status: "pending",
      }).returning();

      await db.update(conversations)
        .set({ status: "assigned", metadata: { ...meta, softHandoffFired: false }, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));

      const fallback = "I don't have enough information to answer that accurately. Let me connect you with a specialist who can help.";
      const [aiMsg] = await db.insert(messages).values({
        conversationId,
        senderType: "ai",
        content: fallback,
        confidenceScore: ragResult.confidence,
        isHandoffTrigger: true,
        sources: ragResult.sources,
      }).returning();

      io.to(`conversation:${conversationId}`).emit("message:new", aiMsg);
      io.to(`conversation:${conversationId}`).emit("conversation:handoff", {
        handoffId: handoff.id,
        reason: "Low confidence after clarification attempt",
      });

      return { message: aiMsg, conversationId, handoffTriggered: true, handoffId: handoff.id };
    }

    // Successful answer — clear soft-handoff flag so next low-confidence starts fresh
    const [convForClear] = await db
      .select({ metadata: conversations.metadata })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    const clearMeta = (convForClear?.metadata as Record<string, any>) ?? {};
    if (clearMeta.softHandoffFired) {
      await db.update(conversations)
        .set({ metadata: { ...clearMeta, softHandoffFired: false }, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    }

    const [aiMsg] = await db.insert(messages).values({
      conversationId,
      senderType: "ai",
      content: ragResult.answer,
      confidenceScore: ragResult.confidence,
      sources: ragResult.sources,
    }).returning();

    io.to(`conversation:${conversationId}`).emit("message:new", aiMsg);

    return { message: aiMsg, conversationId, handoffTriggered: false };
  }

  async sendAgentReply(tenantId: string, conversationId: string, content: string, agentId: string) {
    const [conv] = await db.select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.id, conversationId), eq(conversations.tenantId, tenantId)))
      .limit(1);

    if (!conv) throw new Error("Conversation not found");

    const [msg] = await db.insert(messages).values({
      conversationId,
      senderType: "agent",
      senderId: agentId,
      content: content.trim(),
    }).returning();

    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    io.to(`conversation:${conversationId}`).emit("message:new", msg);
    return msg;
  }

  async getConversation(tenantId: string, conversationId: string) {
    const [conv] = await db
      .select({
        id: conversations.id,
        tenantId: conversations.tenantId,
        customerId: conversations.customerId,
        assignedAgentId: conversations.assignedAgentId,
        status: conversations.status,
        channel: conversations.channel,
        subject: conversations.subject,
        metadata: conversations.metadata,
        resolvedAt: conversations.resolvedAt,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        customerName: customers.name,
        customerEmail: customers.email,
      })
      .from(conversations)
      .leftJoin(customers, eq(conversations.customerId, customers.id))
      .where(and(eq(conversations.id, conversationId), eq(conversations.tenantId, tenantId)))
      .limit(1);

    if (!conv) throw new Error("Conversation not found");

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    // Build flowId → { name, leadData } map from any flow_trigger messages
    const triggerMsgs = msgs.filter(m => m.content === "__flow_trigger__" && (m.metadata as any)?.flowId);
    const flowIds = [...new Set(triggerMsgs.map(m => (m.metadata as any).flowId as string))];

    const flowMap: Record<string, string> = {};
    // flowId → closest lead data (keyed by trigger message id)
    const flowLeadMap: Record<string, { data: Record<string, any>; conversation: any[] }> = {};

    if (flowIds.length > 0) {
      const [flowRows, leadRows] = await Promise.all([
        db.select({ id: flows.id, name: flows.name })
          .from(flows)
          .where(inArray(flows.id, flowIds)),
        db.select({ id: flowLeads.id, flowId: flowLeads.flowId, data: flowLeads.data, conversation: flowLeads.conversation, createdAt: flowLeads.createdAt })
          .from(flowLeads)
          .where(and(eq(flowLeads.tenantId, tenantId), inArray(flowLeads.flowId, flowIds)))
          .orderBy(desc(flowLeads.createdAt)),
      ]);

      for (const f of flowRows) flowMap[f.id] = f.name;

      // Match each trigger message to the closest lead by time
      for (const trigger of triggerMsgs) {
        const fid = (trigger.metadata as any).flowId as string;
        const triggerTime = new Date(trigger.createdAt).getTime();
        const candidate = leadRows
          .filter(l => l.flowId === fid)
          .sort((a, b) => Math.abs(new Date(a.createdAt).getTime() - triggerTime) - Math.abs(new Date(b.createdAt).getTime() - triggerTime))[0];
        if (candidate) {
          flowLeadMap[trigger.id] = {
            data: (candidate.data as Record<string, any>) ?? {},
            conversation: (candidate.conversation as any[]) ?? [],
          };
        }
      }
    }

    return { ...conv, messages: msgs, flowMap, flowLeadMap };
  }

  async listConversations(tenantId: string, status?: string) {
    const rows = await db
      .select({
        id: conversations.id,
        status: conversations.status,
        channel: conversations.channel,
        subject: conversations.subject,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        resolvedAt: conversations.resolvedAt,
        customerName: customers.name,
        customerEmail: customers.email,
      })
      .from(conversations)
      .leftJoin(customers, eq(conversations.customerId, customers.id))
      .where(
        status
          ? and(eq(conversations.tenantId, tenantId), eq(conversations.status, status as any))
          : eq(conversations.tenantId, tenantId)
      )
      .orderBy(desc(conversations.updatedAt));

    const ids = rows.map(r => r.id);
    if (ids.length === 0) return rows;

    // Single query for all messages, ordered newest-first; group in JS (one pass)
    const allMsgs = await db
      .select({ conversationId: messages.conversationId, content: messages.content, senderType: messages.senderType })
      .from(messages)
      .where(inArray(messages.conversationId, ids))
      .orderBy(desc(messages.createdAt));

    const previewMap: Record<string, { preview: string; senderType: string }> = {};
    for (const m of allMsgs) {
      if (m.conversationId && !previewMap[m.conversationId]) {
        previewMap[m.conversationId] = { preview: m.content.slice(0, 120), senderType: m.senderType };
      }
    }

    return rows.map(r => ({ ...r, lastMessage: previewMap[r.id] ?? null }));
  }

  async resolveConversation(tenantId: string, conversationId: string, resolution: string, saveAsLearned: boolean) {
    const conv = await this.getConversation(tenantId, conversationId);

    await db.update(conversations)
      .set({ status: "resolved", resolvedAt: new Date(), updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    if (saveAsLearned) {
      const customerMessages = conv.messages.filter(m => m.senderType === "customer");
      if (customerMessages.length > 0) {
        const question = customerMessages[customerMessages.length - 1].content;
        const questionEmbedding = await embedQuery(question);
        await db.insert(learnedResponses).values({
          tenantId,
          conversationId,
          question,
          answer: resolution,
          embedding: questionEmbedding,
          isApproved: true,
        });
      }
    }

    io.to(`conversation:${conversationId}`).emit("conversation:resolved", { conversationId });

    return { resolved: true };
  }
}
