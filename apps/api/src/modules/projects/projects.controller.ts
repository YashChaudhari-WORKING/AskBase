import type { Response } from "express";
import type { AuthRequest } from "../../common/middleware/auth.middleware";
import { db, projects, knowledgeBases, flows, apiKeys } from "@askbase/database";
import { ChatService } from "../chat/chat.service";
import { eq, and } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { randomBytes, createHash } from "crypto";
import { env } from "../../config/env";
import { success, error } from "../../common/utils/response";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const groq = env.GROQ_API_KEY ? new Groq({ apiKey: env.GROQ_API_KEY }) : null;

const THRESHOLD_PRESETS: Record<string, number> = {
  relaxed: 0.25,
  balanced: 0.45,
  strict: 0.70,
};

// ── List bots ────────────────────────────────────────────
export async function listProjects(req: AuthRequest, res: Response) {
  try {
    const bots = await db
      .select()
      .from(projects)
      .where(eq(projects.tenantId, req.user!.tenantId));

    const enriched = await Promise.all(bots.map(async bot => {
      // Attach linked knowledge base name
      let kb: { id: string; name: string } | null = null;
      if (bot.knowledgeBaseId) {
        const [found] = await db
          .select({ id: knowledgeBases.id, name: knowledgeBases.name })
          .from(knowledgeBases)
          .where(eq(knowledgeBases.id, bot.knowledgeBaseId!))
          .limit(1);
        kb = found ?? null;
      }

      // Attach linked flow name
      let flow: { id: string; name: string } | null = null;
      if (bot.flowId) {
        const [found] = await db
          .select({ id: flows.id, name: flows.name })
          .from(flows)
          .where(eq(flows.id, bot.flowId!))
          .limit(1);
        flow = found ?? null;
      }

      const [key] = await db
        .select({ id: apiKeys.id, keyPrefix: apiKeys.keyPrefix })
        .from(apiKeys)
        .where(and(eq(apiKeys.projectId, bot.id), eq(apiKeys.tenantId, req.user!.tenantId)))
        .limit(1);

      return { ...bot, knowledgeBase: kb, flow, apiKey: key ?? null };
    }));

    return success(res, enriched);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

// ── Get single bot ────────────────────────────────────────
export async function getProject(req: AuthRequest, res: Response) {
  try {
    const [bot] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, req.params.id), eq(projects.tenantId, req.user!.tenantId)))
      .limit(1);

    if (!bot) return error(res, "Bot not found", 404);

    let kb: { id: string; name: string } | null = null;
    if (bot.knowledgeBaseId) {
      const [found] = await db
        .select({ id: knowledgeBases.id, name: knowledgeBases.name })
        .from(knowledgeBases)
        .where(eq(knowledgeBases.id, bot.knowledgeBaseId!))
        .limit(1);
      kb = found ?? null;
    }

    let flow: { id: string; name: string } | null = null;
    if (bot.flowId) {
      const [found] = await db
        .select({ id: flows.id, name: flows.name })
        .from(flows)
        .where(eq(flows.id, bot.flowId!))
        .limit(1);
      flow = found ?? null;
    }

    const [key] = await db
      .select({ id: apiKeys.id, keyPrefix: apiKeys.keyPrefix })
      .from(apiKeys)
      .where(and(eq(apiKeys.projectId, bot.id), eq(apiKeys.tenantId, req.user!.tenantId)))
      .limit(1);

    return success(res, { ...bot, knowledgeBase: kb, flow, apiKey: key ?? null });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

// ── Create bot ───────────────────────────────────────────
export async function createProject(req: AuthRequest, res: Response) {
  try {
    const {
      name, description, knowledgeBaseId, flowId, flowTrigger,
      systemPrompt, tone, welcomeMessage, fallbackMessage,
      primaryColor, handoffPreset, confidenceThreshold,
      assistantType, responseTimeText, quickLinks,
    } = req.body;

    const threshold = handoffPreset && handoffPreset !== "custom"
      ? THRESHOLD_PRESETS[handoffPreset] ?? 0.35
      : (confidenceThreshold ?? 0.35);

    const [bot] = await db.insert(projects).values({
      tenantId: req.user!.tenantId,
      knowledgeBaseId: knowledgeBaseId ?? null,
      flowId: flowId ?? null,
      flowTrigger: flowTrigger ?? null,
      assistantType: assistantType ?? "ai_agent",
      responseTimeText: responseTimeText ?? null,
      quickLinks: quickLinks ?? [],
      name,
      description,
      systemPrompt,
      tone: tone ?? "friendly",
      welcomeMessage: welcomeMessage ?? "Hi! How can I help you today?",
      fallbackMessage: fallbackMessage ?? "Let me connect you with a human agent.",
      primaryColor: primaryColor ?? "#6366f1",
      confidenceThreshold: threshold,
    }).returning();

    // Auto-generate API key for the bot
    const raw = "ask_live_" + randomBytes(16).toString("hex");
    const keyPrefix = raw.slice(0, 10);
    const keyHash = createHash("sha256").update(raw).digest("hex");

    const [apiKey] = await db.insert(apiKeys).values({
      tenantId: req.user!.tenantId,
      projectId: bot.id,
      name: `${name} (auto)`,
      keyHash,
      keyPrefix,
    }).returning();

    return success(res, { ...bot, apiKey: { ...apiKey, rawKey: raw } }, "Bot created", 201);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

// Mutable fields — immutable columns (id, tenantId, createdAt) are never accepted
const MUTABLE_FIELDS = new Set([
  "name", "description", "systemPrompt", "tone", "assistantType",
  "welcomeMessage", "fallbackMessage", "primaryColor", "confidenceThreshold",
  "responseTimeText", "quickLinks", "quickActions", "fallbackFlowId",
  "notificationEmail", "notificationWebhook",
  "widgetPosition", "widgetCompact", "widgetThemeId",
  "openingMessages", "repeatMessages",
  "homeGreeting", "homeSubgreeting", "conversationStarters", "widgetQuickReplies",
  "showHelpCenter", "helpCenterTitle", "helpArticles", "helpCenterUrl",
  "botAvatarEmoji", "botAvatarUrl", "botSubtitle", "inputPlaceholder",
  "showPoweredBy", "footerText", "footerLinkUrl", "businessHoursText", "allowAttachments",
  "flowTrigger", "attachedFlows", "isActive",
  "knowledgeBaseId", "flowId",
]);

// ── Update bot ───────────────────────────────────────────
export async function updateProject(req: AuthRequest, res: Response) {
  try {
    const { handoffPreset, ...body } = req.body;

    // Strip any fields not in the allowlist (prevents overwriting id, tenantId, createdAt)
    const rest = Object.fromEntries(
      Object.entries(body).filter(([k]) => MUTABLE_FIELDS.has(k))
    );

    const threshold = handoffPreset && handoffPreset !== "custom"
      ? THRESHOLD_PRESETS[handoffPreset]
      : rest.confidenceThreshold;

    const [updated] = await db
      .update(projects)
      .set({ ...rest, ...(threshold !== undefined && { confidenceThreshold: threshold }), updatedAt: new Date() })
      .where(and(eq(projects.id, req.params.id), eq(projects.tenantId, req.user!.tenantId)))
      .returning();

    if (!updated) return error(res, "Bot not found", 404);
    return success(res, updated);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

// ── Deactivate bot (soft delete — never touches KB or docs) ──
export async function deleteProject(req: AuthRequest, res: Response) {
  try {
    const [updated] = await db
      .update(projects)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(projects.id, req.params.id), eq(projects.tenantId, req.user!.tenantId)))
      .returning({ id: projects.id });

    if (!updated) return error(res, "Bot not found", 404);
    return success(res, null, "Bot deactivated");
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

// ── Hard delete bot (owner only — still never touches KB) ──
export async function hardDeleteProject(req: AuthRequest, res: Response) {
  try {
    await db.delete(projects).where(
      and(eq(projects.id, req.params.id), eq(projects.tenantId, req.user!.tenantId))
    );
    return success(res, null, "Bot permanently deleted");
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

// ── Regenerate embed API key for a project ────────────────
export async function regenerateKey(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    // Verify project belongs to this tenant
    const [proj] = await db.select({ id: projects.id })
      .from(projects).where(and(eq(projects.id, id), eq(projects.tenantId, tenantId))).limit(1);
    if (!proj) return error(res, "Not found", 404);

    // Revoke all existing keys for this project
    await db.update(apiKeys).set({ isActive: false })
      .where(and(eq(apiKeys.projectId, id), eq(apiKeys.tenantId, tenantId)));

    // Create fresh key
    const raw = "ask_live_" + randomBytes(16).toString("hex");
    const keyPrefix = raw.slice(0, 10);
    const keyHash = createHash("sha256").update(raw).digest("hex");
    const [newKey] = await db.insert(apiKeys).values({
      tenantId,
      projectId: id,
      name: "Embed key (regenerated)",
      keyHash,
      keyPrefix,
    }).returning({ id: apiKeys.id, keyPrefix: apiKeys.keyPrefix });

    return success(res, { id: newKey.id, keyPrefix: newKey.keyPrefix, rawKey: raw });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

// ── Generate system prompt ────────────────────────────────
export async function generatePrompt(req: AuthRequest, res: Response) {
  const { description, tone = "friendly", botName = "Assistant" } = req.body;
  if (!description?.trim()) return error(res, "Description required", 400);

  const toneGuide: Record<string, string> = {
    friendly: "warm, approachable, conversational",
    formal: "professional, polished, no contractions",
    technical: "precise, uses exact terminology, structured",
    concise: "brief, direct, no fluff",
  };

  const promptText = `You are an expert at writing AI system prompts for customer support bots.

Write a production-ready system prompt for an AI bot with these specs:
- Bot name: ${botName}
- Purpose: ${description}
- Tone: ${toneGuide[tone] ?? toneGuide.friendly}

Requirements:
1. Start with the bot's identity and role
2. Define exactly what it can and cannot help with
3. Specify how to handle out-of-scope questions ("I'll connect you with a human agent")
4. Include tone and communication style instructions
5. Tell it to ONLY answer from provided context, never hallucinate
6. Keep answers focused and concise

Write ONLY the system prompt text, no preamble or explanation. Maximum 250 words.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
    });
    return success(res, { prompt: result.response.text().trim() });
  } catch (geminiErr: any) {
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: promptText }],
          temperature: 0.4, max_tokens: 500,
        });
        return success(res, { prompt: completion.choices[0].message.content?.trim() ?? "" });
      } catch (groqErr: any) {
        return error(res, `Groq fallback failed: ${groqErr.message}`, 500);
      }
    }
    return error(res, geminiErr.message, 500);
  }
}

// ── Generate full assistant config from description (v2) ───
// Supports refinement loop: pass previousConfig + refinement to adjust.
export async function generateConfig(req: AuthRequest, res: Response) {
  const { description, refinement, previousConfig } = req.body;
  if (!description?.trim()) return error(res, "Description required", 400);

  const refinementBlock = refinement?.trim() && previousConfig
    ? `\n\nThe user previously got this config:\n${JSON.stringify(previousConfig, null, 2)}\n\nThey want to refine it with this feedback: "${refinement}"\n\nUpdate the config to reflect their feedback. Keep fields they didn't mention. Adjust intents, fields, prompt, tone, etc. as needed.\n`
    : "";

  const promptText = `You are an expert product manager designing AI assistant configurations for a SaaS product.

A user described their assistant as: "${description}"
${refinementBlock}
Return a JSON object with EXACTLY these fields:
{
  "name": "short catchy assistant name (2-3 words max)",
  "description": "one sentence description of what it does",
  "systemPrompt": "production-ready system prompt (max 200 words). Define identity, scope, what NOT to answer, tone.",
  "tone": "one of: friendly | formal | technical | concise",
  "primaryMode": "one of: ai | flow | hybrid",
  "assistantType": "one of: ai_agent | flow | hybrid",
  "welcomeMessage": "the first message the widget shows (max 12 words, in the chosen tone)",
  "responseTimeText": "response time subheading e.g. 'Replies in under a minute'",
  "primaryColor": "hex color that fits the brand vibe e.g. #6366F1",
  "botSubtitle": "short widget header tagline, max 5 words e.g. 'Always here to help'",
  "inputPlaceholder": "chat input placeholder text, max 8 words e.g. 'Ask about our products…'",
  "botAvatarEmoji": "single relevant emoji that represents the business e.g. 🧪 for chemicals, 🏠 for real estate",
  "homeGreeting": "home screen greeting headline, max 7 words e.g. 'How can we help you today?'",
  "homeSubgreeting": "home screen subtext, max 12 words e.g. 'We usually reply in a few minutes.'",
  "businessHoursText": "short business hours string e.g. 'Mon–Fri, 9am–6pm' or null if 24/7 support",
  "conversationStarters": [
    { "label": "short button label shown to visitor", "message": "exact message sent when visitor clicks it" }
  ],
  "widgetQuickReplies": [
    { "label": "short quick reply label e.g. 'Yes', 'Tell me more', 'Book a call'" }
  ],
  "kbHints": ["3-5 specific content types the user should add to the knowledge base for this assistant to work well. Examples: 'Product FAQ document', 'Pricing and plans page', 'Return and refund policy', 'Technical specifications PDF'"],
  "suggestedIntents": [
    {
      "label": "short action name e.g. 'Book a demo'",
      "triggers": ["natural phrase a visitor might type, e.g. 'I want a demo'", "another likely phrase, e.g. 'book a meeting'", "alt phrase 'schedule a call'"],
      "fields": [
        { "key": "snake_case_key", "label": "Display Label", "type": "text|email|phone|date|number|longtext|select", "required": true, "options": [{"label":"Option label","value":"snake_case_value"}] }
      ],
      "successMessage": "shown after flow completes (max 20 words)"
    }
  ],
  "suggestedQuickLinks": [
    { "label": "short label", "url": "" }
  ],
  "reasoning": "1-2 sentences explaining WHY you chose this primaryMode and these intents",
  "confidence": "one of: high | low"
}

---

## STEP 1 — Classify primaryMode

Does the description mention answering questions, FAQs, support, knowledge base, docs, or "answer"?
  → NO  : primaryMode = "flow"    (pure guided capture — no Q&A)
  → YES : go to next question

Does it ALSO mention capturing leads, booking, collecting info, or a form?
  → NO  : primaryMode = "ai"      (pure Q&A)
  → YES : primaryMode = "hybrid"  (Q&A + structured flows)

assistantType mirrors primaryMode: "ai" → "ai_agent", "flow" → "flow", "hybrid" → "hybrid"

Decision examples:
- "collect leads with name/email/phone" → flow
- "answer product FAQs" → ai
- "answer technical questions and collect project inquiries" → hybrid
- "consulting firm — answer questions and book consultations" → hybrid

---

## STEP 2 — Generate suggestedIntents

**flow mode**: 1–2 intents for the main capture action(s) described.

**ai mode**: 0 intents. Add 1 only if the user mentioned "contact us", "talk to human", or "callback".

**hybrid mode**: Generate 2–4 intents. Think like a product manager — what are the most valuable structured actions a visitor of THIS specific business type would take? Go beyond what the user explicitly listed and infer from the industry.

Good hybrid intent sets by industry:
- B2B consulting     → ["Request a Consultation", "Submit a Project Brief", "Request a Sample/Quote"]
- Real estate        → ["Book a Site Visit", "Request Property Details", "Schedule a Call"]
- SaaS product       → ["Book a Demo", "Start Free Trial", "Contact Support"]
- Healthcare clinic  → ["Book an Appointment", "Ask About a Service", "Request a Callback"]
- EdTech             → ["Apply for a Course", "Download Brochure", "Talk to an Advisor"]
- E-commerce         → ["Track My Order", "Request a Return", "Ask About a Product"]

Each intent MUST have:
- label: clear 2–4 word action name
- triggers: 4–6 varied phrases (short keyword, question, direct request, statement)
- fields: name + email always required first, then 2–4 action-specific fields relevant to THIS business
- successMessage: warm specific confirmation, max 20 words
- All field keys must be snake_case

---

## FIELD TYPE RULES

- "text"     → free-form short answer (name, company, city, subject)
- "email"    → email address
- "phone"    → phone / mobile number
- "date"     → date picker
- "number"   → numeric input
- "longtext" → paragraph / multi-line (project description, message, requirements)
- "select"   → ONLY when options are a known bounded set. ALWAYS include "options" array.
  Example: {"key":"industry","label":"Industry","type":"select","options":[{"label":"Automotive","value":"automotive"},{"label":"Telecom","value":"telecom"}]}

---

## CONVERSATION STARTERS RULES

- Generate exactly 3 starters, specific to THIS business — never generic
- Cover different intents: one Q&A ("What services do you offer?"), one action ("I want to book a consultation"), one discovery ("Tell me about your expertise")
- Each "message" must be a full natural sentence a real visitor would type

---

## TRIGGER PHRASE RULES

- 4–6 per intent, varied in style: keyword, question, direct request, statement
- Realistic phrasing — what a real visitor types, not marketing copy
- Examples for "Request a Consultation": ["consultation", "I need expert advice", "how do I get started?", "can I speak to a specialist?", "book a meeting with your team"]

---

Confidence: "high" if the description is specific and the config maps cleanly. "low" if vague or ambiguous.

Return ONLY valid raw JSON. No markdown fences, no explanation, no comments.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 2500, responseMimeType: "application/json" },
    });
    const raw = result.response.text().trim();
    const config = clampPrimaryMode(JSON.parse(raw), description);
    return success(res, config);
  } catch (geminiErr: any) {
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a JSON API. Return only valid JSON, no markdown." },
            { role: "user", content: promptText },
          ],
          temperature: 0.5,
          max_tokens: 2500,
          response_format: { type: "json_object" },
        });
        const config = clampPrimaryMode(JSON.parse(completion.choices[0].message.content ?? "{}"), description);
        return success(res, config);
      } catch (groqErr: any) {
        return error(res, `Groq fallback failed: ${groqErr.message}`, 500);
      }
    }
    return error(res, geminiErr.message, 500);
  }
}

// ── Generate contextual setup guide hints for a newly created assistant ───
export async function generateSetupGuide(req: AuthRequest, res: Response) {
  const { systemPrompt, name, goal, assistantType } = req.body;
  if (!systemPrompt?.trim() || !name?.trim()) return error(res, "systemPrompt and name required", 400);

  const goalLabel =
    goal === "both" ? "AI chat + lead capture in one widget"
    : goal === "flow" ? "lead capture only (guided forms)"
    : "AI chat powered by a knowledge base";

  const promptText = `You are a helpful product setup guide. A user just created an AI assistant called "${name}".

System prompt for this assistant:
"${systemPrompt}"

Their goal: ${goalLabel}

Generate 3 specific, actionable setup hints tailored to THIS assistant's exact purpose and industry. Make each hint concrete and different from generic advice.

Return a JSON object with EXACTLY these keys:
{
  "kbHint": "One precise sentence (max 28 words) on what documents to upload — name the SPECIFIC document types that match this assistant's purpose. Never say 'relevant documents'. Start with Upload or Add.",
  "flowHint": "One precise sentence (max 28 words) on what lead/booking flow to create — match the assistant's industry. Name a specific flow type. Start with Add or Create.",
  "contentHint": "One precise sentence (max 22 words) suggesting what the welcome message should say — specific to this assistant's role."
}

Examples of GOOD kbHints:
- "Upload your return policy, shipping FAQs, and product catalog PDFs so the assistant can handle post-purchase questions."
- "Add your employee handbook, leave policy, and benefits guide so HR questions are answered instantly."
- "Upload your curriculum overview, admission process PDF, and fee structure so parents get accurate answers."

Examples of BAD kbHints (too generic — never do this):
- "Upload your relevant documents so the assistant can answer questions."
- "Add documentation to improve responses."

Be specific to the EXACT industry and use case. Return ONLY raw JSON, no markdown.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.85, maxOutputTokens: 400, responseMimeType: "application/json" },
    });
    return success(res, JSON.parse(result.response.text().trim()));
  } catch {
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a JSON API. Return only valid JSON, no markdown." },
            { role: "user", content: promptText },
          ],
          temperature: 0.85,
          max_tokens: 400,
          response_format: { type: "json_object" },
        });
        return success(res, JSON.parse(completion.choices[0].message.content ?? "{}"));
      } catch (groqErr: any) {
        return error(res, groqErr.message, 500);
      }
    }
    return error(res, "AI generation failed", 500);
  }
}

// Belt-and-suspenders safety net: regardless of what AI returned, clamp
// primaryMode based on keywords in the user's own description.
function clampPrimaryMode(config: any, description: string): any {
  if (!config || typeof config !== "object") return config;
  const desc = String(description).toLowerCase();

  // Q&A signals — answering questions, support, FAQs, knowledge retrieval
  const qaKeywords = /\b(answer|answering|answers|faq|faqs|q&a|q & a|support questions|knowledge|respond to|reply to|explain|tell .{0,10}about)\b/i;
  // Capture signals — collecting structured info
  const captureKeywords = /\b(collect|capture|lead|leads|book|booking|inquir(y|ies|e)|sign.?up|register|registration|enroll|form|submission|name.*email|capture)\b/i;

  const mentionsQA = qaKeywords.test(desc);
  const mentionsCapture = captureKeywords.test(desc);

  let adjusted = false;
  let reason = "";

  // AI returned hybrid but description has no Q&A signal → force flow
  if (config.primaryMode === "hybrid" && !mentionsQA && mentionsCapture) {
    config.primaryMode = "flow";
    config.assistantType = "flow";
    adjusted = true;
    reason = "Description only mentions capture — adjusted to Flow.";
  }
  // AI returned ai but description has capture signal and no Q&A → force flow
  else if (config.primaryMode === "ai" && mentionsCapture && !mentionsQA) {
    config.primaryMode = "flow";
    config.assistantType = "flow";
    adjusted = true;
    reason = "Description is about capture, not Q&A — adjusted to Flow.";
  }
  // AI returned flow but description mentions Q&A AND capture → hybrid
  else if (config.primaryMode === "flow" && mentionsQA && mentionsCapture) {
    config.primaryMode = "hybrid";
    config.assistantType = "hybrid";
    adjusted = true;
    reason = "Description mentions both Q&A and capture — adjusted to Hybrid.";
  }

  if (adjusted) {
    console.log("[generate-config] clamped primaryMode:", reason);
    config.reasoning = `${reason} ${config.reasoning ?? ""}`.trim();
  }

  return config;
}

// ─────────────────────────────────────────────────────────────────────
// FLOW BOT path — a bot whose entire purpose is to run ONE capture flow.
// No Q&A, no system prompt nuance, no intent routing. Simple.
// ─────────────────────────────────────────────────────────────────────

export async function generateFlowBot(req: AuthRequest, res: Response) {
  const { description, refinement, previousConfig, clarificationAnswers } = req.body;
  if (!description?.trim()) return error(res, "Description required", 400);

  const refinementBlock = refinement?.trim() && previousConfig
    ? `\n\nThe user previously got this config:\n${JSON.stringify(previousConfig, null, 2)}\n\nThey want to refine it with this feedback: "${refinement}"\n\nUpdate the config to reflect their feedback. Keep fields they didn't mention.\n`
    : "";

  const clarificationBlock = clarificationAnswers && typeof clarificationAnswers === "object"
    ? `\n\nThe user provided answers to clarifying questions:\n${JSON.stringify(clarificationAnswers, null, 2)}\n\nUse these to build the config — DO NOT ask for clarification again.\n`
    : "";

  const promptText = `You are designing a Flow Bot — a chatbot that runs ONE structured capture flow when a visitor opens it. No Q&A, no AI conversation, just guided form capture.

User's description: "${description}"
${refinementBlock}${clarificationBlock}

CRITICAL — CLARIFICATION CHECK (do this FIRST):
If the description is too vague (e.g. "help my customers", "make a bot", "lead capture" without context, "form"), you MUST ask clarifying questions instead of generating a config. Return ONLY this:
{
  "needsClarification": true,
  "questions": [
    "What kind of information do you want to collect from visitors? (e.g. name, email, specific details)",
    "What is this bot for? (e.g. lead capture for a SaaS, restaurant booking, customer feedback)",
    "Any specific options or categories visitors should pick from?"
  ]
}
Ask 2-3 questions max. Be specific to what's missing. ONLY skip clarification if the description has clear domain + at least 3 specific fields mentioned.

Otherwise (clear description), return a complete config with this EXACT shape:
{
  "name": "short bot name (2-4 words, e.g. 'Lead Capture')",
  "welcomeMessage": "first message shown when widget opens (max 12 words, friendly)",
  "responseTimeText": "subheading e.g. 'Takes under a minute'",
  "primaryColor": "hex color e.g. #6366F1",
  "storeLeads": true,
  "flow": {
    "label": "what this flow does (e.g. 'Admission Inquiry')",
    "fields": [
      {
        "key": "snake_case",
        "label": "Display Label",
        "type": "text|email|phone|date|number|longtext|select",
        "required": true,
        "placeholder": "Example input shown in the field",
        "helpText": "Optional hint shown below",
        "options": [{"label":"...","value":"..."}],
        "minLength": 2,
        "maxLength": 100,
        "min": 0,
        "max": 1000000,
        "step": 1,
        "minDate": "future|past|today|",
        "maxDate": "",
        "pattern": "regex string",
        "multiple": false,
        "sampleGoodAnswer": "see SAMPLE DATA RULES below — must match the field PURPOSE in this specific bot",
        "sampleBadAnswer": "value that breaks the strongest validation rule (empty string if no rule applies)",
        "sampleErrorMessage": "exact 1-sentence message shown when sampleBadAnswer fails (empty string if sampleBadAnswer is empty)"
      }
    ],
    "successMessage": "shown after capture completes (max 20 words)"
  },
  "reasoning": "1 sentence on what was extracted from the description"
}

SAMPLE DATA RULES — read the bot description AND the field label together for every field:

sampleGoodAnswer:
- select → copy one option label verbatim (e.g. "Bug", "Feature Request")
- email → "user@example.com"
- phone (Indian context / +91 / Mumbai / Delhi / Bangalore) → "+91 98765 43210" | phone (default) → "+1 555 0123"
- number → mid-range value within min/max; if no max, use a typical realistic number for this context
- date (future constraint) → "2026-09-15" | date (past/DOB) → "1995-06-20"
- text → realistic short value matching the label: name → "Aarav Sharma", company → "Acme Corp", city → "Mumbai", PAN → "ABCDE1234F", Aadhaar → "1234 5678 9012"
- longtext → match the field PURPOSE (CRITICAL — read carefully):
    WRONG (never use for a problem/description/bug field): "It's been great, thank you!" / "Excellent service!" / "Looking forward to hearing from you."
    RIGHT — pick based on label:
    * label contains "description" / "issue" / "problem" / "bug" / "complaint" / "ticket" → "The login page shows a blank screen after I enter my password on Chrome."
    * label contains "message" / "inquiry" / "query" → "I'd like to know more about your enterprise pricing."
    * label contains "feedback" / "review" / "experience" / "opinion" → "Great product, very responsive support team!"
    * label contains "notes" / "request" / "additional" → "Please contact me after 5 PM."
    * label contains "purpose" / "statement" / "motivation" / "essay" → "I am passionate about technology and eager to contribute to your team."
    * label contains "reason" / "why" → "I've been using your product for 2 years and need a plan upgrade."

sampleBadAnswer:
- email → "not-an-email"
- phone (Indian) → "12345" | phone (default) → "abc"
- number with min → value 1 below min | with max → value 1 above max | no bounds → "abc"
- text with minLength > 1 → "a" | text with pattern → "????"
- date future → "2020-01-01" | date past → "2099-12-31"
- PAN → "12345ABCDE" | Aadhaar → "1234 5678" | GSTIN → "INVALID"
- longtext → "" | select → ""
- If no rule to violate → ""

sampleErrorMessage: 1 friendly sentence describing the rule violated. If sampleBadAnswer is "" → sampleErrorMessage must also be "".

Field type rules (CRITICAL):
- "select" — bounded options. ALWAYS include options array.
- "email" / "phone" — typed input, validated.
- "date" — calendar input.
- "number" — numeric input.
- "text" — free-form short text.
- "longtext" — paragraphs.

LABEL + HELP TEXT — these are DIFFERENT, do not duplicate:
- "label" — SHORT field name (2-4 words MAX). E.g. "Full Name", "Mobile", "Email", "Class Interest". NEVER full sentences.
- "helpText" — OPTIONAL, only add when it genuinely helps. E.g. "10-digit mobile, optional +91 prefix" for phone, "5 letters + 4 digits + 1 letter" for PAN. NEVER paraphrase the label. Leave empty string "" if no real help is needed.

CRITICAL — labels are LABELS, not questions. The system auto-generates the question from the label ("What's your <label>?"). So:
- ✓ label: "Full Name"  → bot says "What's your full name?"
- ✗ label: "Your full name as it appears on official documents"  → too long, breaks the question

welcomeMessage — friendly, 6-10 words, SPECIFIC to the bot's purpose. Examples:
- ✓ "Hi! Let's get you started with admissions."
- ✓ "Hey, ready to book a demo?"
- ✗ "Sure — let's get you set up." (too generic — DO NOT USE THIS phrase)

VALIDATION GENERATION RULES — generate REAL validation values, not "auto":

For EVERY field, infer concrete validation based on field meaning:

text fields:
  - Person name: minLength 2, maxLength 100, pattern: "^[A-Za-z .'-]+$", placeholder: "Aarav Sharma"
  - Company name: minLength 2, maxLength 100, placeholder: "Acme Corp"
  - Address: minLength 5, maxLength 200, placeholder: "123 Main St, City"
  - Generic short text: minLength 1, maxLength 200
  - Passport / ID: pattern: "^[A-Z0-9]{6,20}$", placeholder: "A1234567"

  INDIAN-SPECIFIC TEXT IDS (use when context is Indian or field name matches):
  - PAN card: pattern "^[A-Z]{5}[0-9]{4}[A-Z]{1}$", minLength 10, maxLength 10, placeholder "ABCDE1234F", helpText "5 letters + 4 digits + 1 letter"
  - Aadhaar: pattern "^[2-9][0-9]{3}[ -]?[0-9]{4}[ -]?[0-9]{4}$", minLength 12, maxLength 14, placeholder "1234 5678 9012"
  - GSTIN: pattern "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", minLength 15, maxLength 15, placeholder "27ABCDE1234F1Z5"
  - PIN code (Indian postal): pattern "^[1-9][0-9]{5}$", minLength 6, maxLength 6, placeholder "400001"
  - IFSC: pattern "^[A-Z]{4}0[A-Z0-9]{6}$", minLength 11, maxLength 11, placeholder "HDFC0001234"
  - Vehicle (RTO) registration: pattern "^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$", placeholder "MH12AB1234"
  - Indian state: prefer "select" with options [Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh, Goa, Gujarat, Haryana, Himachal Pradesh, Jharkhand, Karnataka, Kerala, Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram, Nagaland, Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana, Tripura, Uttar Pradesh, Uttarakhand, West Bengal, Delhi]
  - Indian city (when bot is for India only): prefer "select" with the metros + tier-2 cities mentioned in the description, or "text" with placeholder "Mumbai"

email:
  - pattern: "^[\\\\w.+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$"
  - maxLength: 254
  - placeholder: "you@company.com"

phone:
  - Default international: pattern: "^[+]?[0-9 ()\\\\-]{7,20}$", minLength 7, maxLength 20, placeholder "+1 555 0123"
  - If description mentions India / Indian / WhatsApp India / +91 / Mumbai / Delhi / Bangalore / Pune / Chennai / Hyderabad / Ahmedabad / Kolkata:
      pattern "^(\\\\+91[\\\\- ]?)?[6-9]\\\\d{9}$"
      minLength 10, maxLength 14
      placeholder "+91 98765 43210"
      helpText "10-digit mobile, optional +91 prefix"

date:
  - For booking/appointment/viewing/event date: minDate "future"
  - For DOB / past event: minDate "past"
  - Default: empty

number:
  - Budget / price / amount: min 0, no max
  - Budget in INR / rupees / lakhs / crores: min 0, no max, helpText "Amount in INR"
  - Age: min 0, max 120
  - Bedrooms: min 0, max 50
  - Years of experience: min 0, max 70
  - Party size / guests: min 1, max 100
  - Rating (1-5): min 1, max 5, step 1
  - GPA (4.0 scale): min 0, max 4, step 0.01
  - Percentage / marks: min 0, max 100, step 0.01
  - CGPA (10 scale, Indian): min 0, max 10, step 0.01

longtext:
  - Pain points / feedback / comments: maxLength 1000
  - Statement of purpose: maxLength 2000
  - Notes / requests: maxLength 500

select:
  - multiple: true ONLY if user explicitly says "pick all that apply" or "multiple"
  - Otherwise multiple: false

placeholder + helpText: GENERATE thoughtful ones. They guide the user.

IMPORTANT: include validation properties even when defaults — empty pattern is "".
ONLY include fields user EXPLICITLY mentioned.

Return ONLY raw JSON. No markdown, no explanation.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 6500, responseMimeType: "application/json" },
    });
    return success(res, sanitizeFlowBotConfig(JSON.parse(result.response.text().trim())));
  } catch (geminiErr: any) {
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a JSON API. Return only valid JSON, no markdown." },
            { role: "user", content: promptText },
          ],
          temperature: 0.4,
          max_tokens: 7500,
          response_format: { type: "json_object" },
        });
        return success(res, sanitizeFlowBotConfig(JSON.parse(completion.choices[0].message.content ?? "{}")));
      } catch (groqErr: any) {
        return error(res, `Groq fallback failed: ${groqErr.message}`, 500);
      }
    }
    return error(res, geminiErr.message, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sanitize / fill any gaps left by truncated AI output. Keeps preview useful
// even when Groq cuts off near the token limit.
// ─────────────────────────────────────────────────────────────────────────────

function sanitizeFlowBotConfig(raw: any): any {
  if (!raw || typeof raw !== "object") return raw;
  if (raw.needsClarification) return raw; // pass-through

  const flow = raw.flow;
  if (!flow || !Array.isArray(flow.fields)) return raw;

  flow.fields = flow.fields.map((f: any) => fillFieldGaps(f));
  return raw;
}

// Phrases that signal the AI gave a generic positive-testimonial answer for a
// field that should NOT have one (bug description, message, notes, etc.)
const WRONG_LONGTEXT_PATTERNS = [
  /it'?s been great/i,
  /thank you/i,
  /great service/i,
  /excellent service/i,
  /wonderful/i,
  /amazing experience/i,
  /love (your|the) (service|product|app)/i,
  /highly recommend/i,
  /looking forward to hearing/i,
  /glad to be here/i,
];

function isWrongLongtextSample(value: string, label: string): boolean {
  const lbl = label.toLowerCase();
  // Only override if the field is NOT a feedback/review field
  const isFeedbackField = /feedback|review|experience|testimonial|comment|opinion|rating/.test(lbl);
  if (isFeedbackField) return false;
  return WRONG_LONGTEXT_PATTERNS.some((p) => p.test(value));
}

function fillFieldGaps(f: any): any {
  if (!f || typeof f !== "object") return f;

  const label = String(f.label ?? f.key ?? "");

  // good sample — fill if missing OR if AI gave a wrong testimonial for a non-feedback longtext
  const existing = f.sampleGoodAnswer;
  const isMissing = !existing || typeof existing !== "string" || !existing.trim();
  const isWrong = f.type === "longtext" && typeof existing === "string" && isWrongLongtextSample(existing, label);
  if (isMissing || isWrong) {
    f.sampleGoodAnswer = serverFakeGood(f);
  }

  // bad + error (skip for longtext/select)
  const needsDemo = !(f.type === "longtext" || f.type === "select");
  if (needsDemo) {
    if (!f.sampleBadAnswer || !String(f.sampleBadAnswer).trim()) {
      const demo = serverFakeBad(f);
      if (demo) {
        f.sampleBadAnswer = demo.bad;
        f.sampleErrorMessage = demo.error;
      }
    }
    if (!f.sampleErrorMessage || !String(f.sampleErrorMessage).trim()) {
      f.sampleErrorMessage = serverFakeBad(f)?.error ?? "Please check the format.";
    }
  } else {
    f.sampleBadAnswer = f.sampleBadAnswer ?? "";
    f.sampleErrorMessage = f.sampleErrorMessage ?? "";
  }

  return f;
}

function serverFakeGood(f: any): string {
  const label = String(f.label ?? f.key ?? "").toLowerCase();
  const pattern: string = f.pattern ?? "";

  if (/\bpan\b/.test(label) || /^\^\[A-Z\]\{5\}/.test(pattern)) return "ABCDE1234F";
  if (/aadhaar|aadhar/.test(label)) return "1234 5678 9012";
  if (/gst|gstin/.test(label)) return "27ABCDE1234F1Z5";
  if (/ifsc/.test(label)) return "HDFC0001234";
  if (/pin\s?code|postal|zip/.test(label)) return "400001";

  if (f.type === "email") return "name@example.com";
  if (f.type === "phone") {
    const isIndian = pattern.includes("[6-9]") || pattern.includes("+91");
    return isIndian ? "+91 98765 43210" : "+1 555 0123";
  }
  if (f.type === "date") return f.minDate === "future" ? "2026-09-15" : "1995-06-20";
  if (f.type === "number") {
    const mid = (Number(f.min ?? 0) + Number(f.max ?? 100)) / 2;
    return String(Math.round(mid));
  }
  if (f.type === "select" && Array.isArray(f.options) && f.options.length > 0) {
    return String(f.options[0].label ?? f.options[0].value ?? "");
  }
  if (f.type === "longtext") {
    if (/description|issue|problem|bug|error|complaint|ticket/.test(label)) return "The submit button isn't responding when clicked on mobile Chrome.";
    if (/message|inquiry|enquiry|query/.test(label)) return "I'd like to learn more about your pricing plans.";
    if (/feedback|review|experience|comment|opinion/.test(label)) return "Great service, very quick and responsive!";
    if (/address/.test(label)) return "123 MG Road, Bengaluru, Karnataka 560001";
    if (/note|request|additional|special/.test(label)) return "Please contact me after 5 PM.";
    if (/purpose|statement|essay/.test(label)) return "I am passionate about technology and eager to contribute to your team.";
    if (/reason|why|motivation/.test(label)) return "I've been using your product for 2 years and need a plan upgrade.";
    return "I'd like to get more information about your services.";
  }

  if (/name/.test(label)) return "Aarav Sharma";
  if (/company|business/.test(label)) return "Acme Corp";
  if (/city/.test(label)) return "Mumbai";
  return "Sample answer";
}

function serverFakeBad(f: any): { bad: string; error: string } | null {
  const label = String(f.label ?? f.key ?? "this field").toLowerCase();
  const pattern: string = f.pattern ?? "";

  if (f.type === "email") {
    return { bad: "invalid_email", error: "Please enter a valid email address." };
  }
  if (f.type === "phone") {
    const isIndian = pattern.includes("[6-9]") || pattern.includes("+91");
    return isIndian
      ? { bad: "12345", error: "Please enter a 10-digit Indian mobile starting with 6, 7, 8 or 9." }
      : { bad: "abc", error: "Please enter a valid phone number (7–20 digits)." };
  }
  if (f.type === "number") {
    if (f.min !== undefined) return { bad: String(Number(f.min) - 1), error: `${label} must be at least ${f.min}.` };
    if (f.max !== undefined) return { bad: String(Number(f.max) + 1), error: `${label} must be at most ${f.max}.` };
    return { bad: "abc", error: `${label} must be a number.` };
  }
  if (f.type === "date" && f.minDate === "future") {
    return { bad: "2020-01-01", error: "Please pick a future date." };
  }
  if (f.type === "date" && f.maxDate === "past") {
    return { bad: "2099-12-31", error: "Please pick a past date." };
  }
  if (f.type === "text") {
    // Known Indian ID patterns
    if (/\bpan\b/.test(label) || /^\^\[A-Z\]\{5\}/.test(pattern)) return { bad: "12345ABCDE", error: "PAN must be 5 letters, 4 digits, then 1 letter (e.g. ABCDE1234F)." };
    if (/aadhaar|aadhar/.test(label)) return { bad: "1234 5678", error: "Please enter a valid 12-digit Aadhaar number." };
    if (/gstin|gst/.test(label)) return { bad: "INVALID", error: "GSTIN must be a valid 15-character format." };
    if (/ifsc/.test(label)) return { bad: "HDFC12", error: "IFSC must be 11 characters (4 letters, 0, then 6 alphanumeric)." };
    if (/pin\s?code|postal|zip/.test(label)) return { bad: "12", error: "Please enter a valid 6-digit PIN code." };
    if (f.minLength && f.minLength > 1) return { bad: "a", error: `${label} must be at least ${f.minLength} characters.` };
    if (pattern) return { bad: "????", error: `${label} doesn't match the expected format.` };
  }
  return null;
}

export async function initializeFlowBot(req: AuthRequest, res: Response) {
  const t0 = Date.now();
  const { config, flow, storeLeads = true } = req.body;

  if (!config?.name?.trim()) return error(res, "config.name required", 400);
  if (!flow?.label?.trim()) return error(res, "flow.label required", 400);
  if (!Array.isArray(flow.fields) || flow.fields.length === 0) {
    return error(res, "flow.fields must be a non-empty array", 400);
  }

  const tenantId = req.user!.tenantId;

  // Normalize
  const VALID_TONES = ["friendly", "formal", "technical", "concise", "compact", "custom"] as const;
  const tone = VALID_TONES.includes(config.tone) ? config.tone : "friendly";
  let primaryColor = String(config.primaryColor ?? "#6366f1").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) primaryColor = "#6366f1";

  const successMessage = String(flow.successMessage ?? "Thanks! We'll be in touch soon.");
  const flowLabel = String(flow.label).slice(0, 100);
  const welcomeMessage = String(config.welcomeMessage ?? "Hi! Let's get you set up.");

  console.log("[init-flow] start", { tenantId, name: config.name, fieldCount: flow.fields.length });

  try {
    const result = await db.transaction(async (tx) => {
      // Generate a sensible default systemPrompt so the setup-checklist is happy.
      const defaultPrompt = `You are ${config.name}, a guided capture bot. Run the "${flowLabel}" flow to collect: ${flow.fields.map((f: any) => f.label || f.key).join(", ")}. Do not answer general questions — stay on the flow.`;

      // 1. Insert project
      console.log("[init-flow] tx: inserting project");
      const [project] = await tx.insert(projects).values({
        tenantId,
        name: String(config.name).slice(0, 100),
        description: config.description ? String(config.description) : `Flow bot: ${flowLabel}`,
        systemPrompt: defaultPrompt,
        tone,
        assistantType: "flow",
        welcomeMessage,
        fallbackMessage: "I can only help with the form. Please continue with the current question.",
        primaryColor,
        responseTimeText: config.responseTimeText ? String(config.responseTimeText) : "Takes under a minute",
        quickLinks: [],
        confidenceThreshold: 0.35,
        flowTrigger: null,
        flowId: null,
      }).returning();

      // 2. Insert flow
      console.log("[init-flow] tx: building flow graph (storeLeads=" + storeLeads + ")");
      const { nodes, edges } = buildFlowGraph({
        welcome: `Sure — let's get you set up.`,
        fields: flow.fields,
        successMessage,
        storeLeads: storeLeads !== false,
      });
      console.log("[init-flow] tx: graph nodes=" + nodes.length + " edges=" + edges.length);

      const [createdFlow] = await tx.insert(flows).values({
        tenantId,
        name: flowLabel,
        description: `Capture flow for ${config.name}`,
        mode: "standalone",
        nodes,
        edges,
        isActive: true,
      }).returning();

      // 3. Link flow to project
      await tx.update(projects)
        .set({ flowId: createdFlow.id, updatedAt: new Date() })
        .where(eq(projects.id, project.id));

      // 4. API key
      const raw = "ask_live_" + randomBytes(16).toString("hex");
      const keyPrefix = raw.slice(0, 10);
      const keyHash = createHash("sha256").update(raw).digest("hex");

      const [apiKey] = await tx.insert(apiKeys).values({
        tenantId,
        projectId: project.id,
        name: `${config.name} (auto)`,
        keyHash,
        keyPrefix,
      }).returning();

      console.log("[init-flow] tx: complete");
      return { project, flow: createdFlow, apiKey, rawKey: raw };
    });

    console.log("[init-flow] success", { projectId: result.project.id, flowId: result.flow.id, durationMs: Date.now() - t0 });

    return success(res, {
      projectId: result.project.id,
      flowId: result.flow.id,
      rawKey: result.rawKey,
      keyPrefix: result.apiKey.keyPrefix,
      durationMs: Date.now() - t0,
    }, "Flow bot initialized", 201);
  } catch (err: any) {
    console.error("[init-flow] FAILED:", err?.message, err?.stack);
    return error(res, `Initialize failed: ${err.message}`, 500);
  }
}

// ── Create just a flow (no new bot) from a flow definition ──────────
// Used when attaching a newly-built flow to an existing AI agent.
export async function createFlowOnly(req: AuthRequest, res: Response) {
  const { flow, storeLeads = true } = req.body;
  if (!flow?.label?.trim()) return error(res, "flow.label required", 400);
  if (!Array.isArray(flow.fields) || flow.fields.length === 0) {
    return error(res, "flow.fields must be a non-empty array", 400);
  }
  const tenantId = req.user!.tenantId;
  try {
    const { nodes, edges } = buildFlowGraph({
      welcome: `Sure — let's get you set up.`,
      fields: flow.fields,
      successMessage: String(flow.successMessage ?? "Thanks! We'll be in touch soon."),
      storeLeads: storeLeads !== false,
    });
    const [createdFlow] = await db.insert(flows).values({
      tenantId,
      name: String(flow.label).slice(0, 100),
      description: flow.description ? String(flow.description) : undefined,
      mode: "standalone",
      nodes,
      edges,
      isActive: true,
    }).returning();
    return success(res, { flowId: createdFlow.id, flowName: createdFlow.name }, "Flow created", 201);
  } catch (err: any) {
    return error(res, `Flow creation failed: ${err.message}`, 500);
  }
}

// ── Generate a single intent/flow from a short description ─────────
// Used by the "Add intent" dialog on the build screen.
export async function generateIntent(req: AuthRequest, res: Response) {
  const { description, botContext } = req.body;
  if (!description?.trim()) return error(res, "Description required", 400);

  const promptText = `You are designing one capture flow for an AI assistant.

${botContext ? `Bot context: "${botContext}"\n\n` : ""}The product owner wants to add this capability: "${description}"

Return ONLY a JSON object:
{
  "label": "short action name (2-4 words, e.g. 'Book a tour')",
  "triggers": ["3-5 phrases a visitor would type — varied: keywords, questions, direct asks"],
  "fields": [
    { "key": "snake_case", "label": "Display Label", "type": "text|email|phone|date|number|longtext|select", "required": true, "options": [{"label":"...","value":"..."}] }
  ],
  "successMessage": "shown after capture (max 20 words)"
}

Rules:
- fields: MINIMAL. Only what's truly needed.
- Use "select" when options are bounded. Always include options array for select.
- Use "email"/"phone"/"date"/"number" for those specific types.
- Use "longtext" for paragraph responses.
- triggers: 3-5 realistic phrases visitors might type.

Return raw JSON only — no markdown, no explanation.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1000, responseMimeType: "application/json" },
    });
    const intent = JSON.parse(result.response.text().trim());
    return success(res, intent);
  } catch (geminiErr: any) {
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a JSON API. Return only valid JSON, no markdown." },
            { role: "user", content: promptText },
          ],
          temperature: 0.4,
          max_tokens: 1000,
          response_format: { type: "json_object" },
        });
        const intent = JSON.parse(completion.choices[0].message.content ?? "{}");
        return success(res, intent);
      } catch (groqErr: any) {
        return error(res, `Groq fallback failed: ${groqErr.message}`, 500);
      }
    }
    return error(res, geminiErr.message, 500);
  }
}

// ── Generate trigger condition for a flow ─────────────────
export async function generateTrigger(req: AuthRequest, res: Response) {
  const { flowName, flowDescription, botContext } = req.body;
  if (!flowName?.trim()) return error(res, "flowName required", 400);

  const promptText = `You are configuring an AI assistant that uses flows to capture structured data from visitors.

Bot context: "${botContext ?? "General customer support assistant"}"

The flow is called: "${flowName}"
${flowDescription ? `Flow description: "${flowDescription}"` : ""}

Generate a trigger condition — a short description of user intents that should activate this flow.
Write it as pipe-separated phrases (e.g. "user wants to book a demo | schedule a call | talk to sales").

Rules:
- 3 to 5 distinct trigger phrases, separated by " | "
- Be specific to the flow name and context
- Use natural language a real visitor would type
- Return ONLY the trigger string, nothing else`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 200 },
    });
    const trigger = result.response.text().trim().replace(/^["']|["']$/g, "");
    return success(res, { trigger });
  } catch (geminiErr: any) {
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "Return only the trigger string. No explanation, no JSON, no markdown." },
            { role: "user", content: promptText },
          ],
          temperature: 0.5,
          max_tokens: 200,
        });
        const trigger = (completion.choices[0].message.content ?? "").trim().replace(/^["']|["']$/g, "");
        return success(res, { trigger });
      } catch (groqErr: any) {
        return error(res, `Groq fallback failed: ${groqErr.message}`, 500);
      }
    }
    return error(res, geminiErr.message, 500);
  }
}

// ── Ephemeral preview chat (no DB writes) ─────────────────
// Lets the user test their bot in the builder before deploying.
export async function previewChat(req: AuthRequest, res: Response) {
  const { message, history = [], draftConfig } = req.body;
  if (!message?.trim()) return error(res, "Message required", 400);
  if (!draftConfig) return error(res, "draftConfig required", 400);

  if (!groq) return error(res, "Preview chat requires Groq", 503);

  const intents: Array<{ label: string; trigger?: string; triggers?: string[]; fields: any[] }> =
    Array.isArray(draftConfig.suggestedIntents) ? draftConfig.suggestedIntents : [];

  // Normalize triggers — accept both array and singular
  const normalizedIntents = intents.map((i) => ({
    ...i,
    triggers: Array.isArray(i.triggers) && i.triggers.length > 0
      ? i.triggers
      : (i.trigger ? [i.trigger] : []),
  }));

  const intentDescriptions = normalizedIntents
    .map((i, idx) => `${idx + 1}. "${i.label}" — triggered by: ${i.triggers.map((t) => `"${t}"`).join(", ") || "no triggers set"}`)
    .join("\n");

  const classifierPrompt = `You are an intent classifier for an AI assistant being tested.

Assistant purpose: ${draftConfig.systemPrompt?.slice(0, 300) ?? draftConfig.description ?? "general assistant"}

${intents.length > 0 ? `Configured flow triggers:\n${intentDescriptions}\n\nIf the user's message matches one of these triggers, return its index (1-based). Otherwise return 0 for general answer.` : "There are no flow triggers. Always return 0."}

User message: "${message}"

Respond with JSON only:
{ "matchedIntentIndex": <0 or 1-based index>, "reasoning": "<1 sentence>" }`;

  let matchedIntentIndex = 0;
  try {
    const cls = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: classifierPrompt }],
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(cls.choices[0].message.content ?? "{}");
    const idx = Number(parsed.matchedIntentIndex);
    if (Number.isInteger(idx) && idx >= 1 && idx <= intents.length) matchedIntentIndex = idx;
  } catch {
    matchedIntentIndex = 0;
  }

  if (matchedIntentIndex > 0) {
    const intent = normalizedIntents[matchedIntentIndex - 1];
    const firstField = intent.fields?.[0] as { label?: string; key?: string; type?: string; options?: Array<{ label: string; value: string }> } | undefined;
    const rawLabel = (firstField?.label ?? firstField?.key ?? "name").toString().toLowerCase().trim();
    // Strip leading "your " so we don't say "What's your your name?"
    const fieldName = rawLabel.replace(/^your\s+/i, "");

    let reply: string;
    if (!firstField) {
      reply = `Great — let's get started.`;
    } else if (firstField.type === "select" && Array.isArray(firstField.options) && firstField.options.length > 0) {
      const opts = firstField.options.map((o) => o.label).join(", ");
      reply = `Great — let's get you set up. Which ${fieldName}? (${opts})`;
    } else {
      reply = `Great — let's get you set up. What's your ${fieldName}?`;
    }

    return success(res, {
      reply,
      intent: "flow_trigger",
      matchedFlow: { label: intent.label, fields: intent.fields ?? [] },
    });
  }

  // General answer using draft system prompt + history
  const toneGuide: Record<string, string> = {
    friendly: "Be warm, approachable, and conversational.",
    formal: "Be professional, polished, no contractions.",
    technical: "Be precise, use exact terminology, structured.",
    concise: "Be brief, direct, no fluff.",
  };

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    {
      role: "system",
      content: `${draftConfig.systemPrompt || `You are ${draftConfig.name || "an assistant"}.`}\n\nTone: ${toneGuide[draftConfig.tone] ?? toneGuide.friendly}\n\nThis is a preview — keep replies short (1-3 sentences) so the user can quickly test the experience.`,
    },
    ...history.slice(-6).map((m: any) => ({
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      content: String(m.content ?? ""),
    })),
    { role: "user", content: message },
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.6,
      max_tokens: 250,
    });
    const reply = completion.choices[0].message.content?.trim() ?? "Sorry, I couldn't generate a reply.";
    return success(res, { reply, intent: "answer" });
  } catch (err: any) {
    return error(res, `Preview chat failed: ${err.message}`, 500);
  }
}

// ── Initialize: single transaction creating project + flows + key ──
export async function initializeProject(req: AuthRequest, res: Response) {
  const t0 = Date.now();
  const { config, intents = [] } = req.body;

  if (!config?.name?.trim()) return error(res, "config.name required", 400);
  if (!config?.systemPrompt?.trim()) return error(res, "config.systemPrompt required", 400);

  const tenantId = req.user!.tenantId;
  const primaryMode = (config.primaryMode === "ai" ? "ai_agent" : config.primaryMode) || config.assistantType || "ai_agent";

  // Normalize tone — AI can return values outside the enum
  const VALID_TONES = ["friendly", "formal", "technical", "concise", "compact", "custom"] as const;
  const tone = VALID_TONES.includes(config.tone) ? config.tone : "friendly";

  // Normalize primaryColor — must be exactly 7 chars hex (#RRGGBB)
  let primaryColor = String(config.primaryColor ?? "#6366f1").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) primaryColor = "#6366f1";

  console.log("[initialize] start", { tenantId, primaryMode, intentCount: Array.isArray(intents) ? intents.length : 0 });

  try {
    const result = await db.transaction(async (tx) => {
      console.log("[initialize] tx: inserting project");
      // 1. Create project (flowId set later)
      const [project] = await tx.insert(projects).values({
        tenantId,
        name: String(config.name).slice(0, 100),
        description: config.description ? String(config.description) : null,
        systemPrompt: String(config.systemPrompt),
        tone,
        assistantType: primaryMode,
        welcomeMessage: String(config.welcomeMessage ?? "Hi! How can I help?"),
        fallbackMessage: String(config.fallbackMessage ?? "Let me connect you with a human agent."),
        primaryColor,
        responseTimeText: config.responseTimeText ? String(config.responseTimeText) : null,
        quickLinks: Array.isArray(config.quickLinks) ? config.quickLinks : [],
        confidenceThreshold: typeof config.confidenceThreshold === "number" ? config.confidenceThreshold : 0.35,
        flowTrigger: null,
        flowId: null,
      }).returning();

      console.log("[initialize] tx: project inserted", project.id);

      // 2. Build flows from enabled intents
      const enabledIntents = Array.isArray(intents) ? intents.filter((i: any) => i?.enabled !== false) : [];
      console.log("[initialize] tx: enabled intents", enabledIntents.length);
      let primaryFlowId: string | null = null;
      let primaryTrigger: string | null = null;
      const createdFlows: any[] = [];

      for (const intent of enabledIntents) {
        const label: string = String(intent.label ?? "Capture").slice(0, 100);
        // Accept triggers[] array; fall back to legacy single `trigger` field
        const triggersArr: string[] = Array.isArray(intent.triggers) && intent.triggers.length > 0
          ? intent.triggers.map(String)
          : (intent.trigger ? [String(intent.trigger)] : []);
        const trigger: string = triggersArr.length > 0 ? triggersArr.join(" | ") : label;
        const fields: Array<{ key: string; label: string; type: string; required?: boolean; options?: Array<{ label: string; value: string }> }> = Array.isArray(intent.fields) ? intent.fields : [];
        const successMessage: string = String(intent.successMessage ?? "Thanks! We'll be in touch soon.");

        console.log("[initialize] tx: building flow", label, "with", fields.length, "fields");
        const { nodes, edges } = buildFlowGraph({ welcome: `Sure — let's get you set up.`, fields, successMessage });
        console.log("[initialize] tx: flow graph nodes=" + nodes.length + " edges=" + edges.length);

        const [flow] = await tx.insert(flows).values({
          tenantId,
          name: label,
          description: trigger,
          mode: "standalone",
          nodes,
          edges,
          isActive: true,
        }).returning();

        createdFlows.push(flow);

        if (!primaryFlowId) {
          primaryFlowId = flow.id;
          primaryTrigger = trigger;
        }
      }

      // 3. Update project with primary flow + full attachedFlows list
      if (primaryFlowId) {
        const attachedFlows = createdFlows.map((f: any) => ({
          flowId: f.id,
          flowName: f.name,
          trigger: f.description ?? "",   // description holds the trigger string
        }));
        await tx.update(projects)
          .set({ flowId: primaryFlowId, flowTrigger: primaryTrigger, attachedFlows, updatedAt: new Date() })
          .where(eq(projects.id, project.id));
      }

      // 4. Create API key
      console.log("[initialize] tx: generating API key");
      const raw = "ask_live_" + randomBytes(16).toString("hex");
      const keyPrefix = raw.slice(0, 10);
      const keyHash = createHash("sha256").update(raw).digest("hex");

      const [apiKey] = await tx.insert(apiKeys).values({
        tenantId,
        projectId: project.id,
        name: `${config.name} (auto)`,
        keyHash,
        keyPrefix,
      }).returning();

      console.log("[initialize] tx: complete");
      return { project, flows: createdFlows, apiKey, rawKey: raw };
    });

    console.log("[initialize] success", { projectId: result.project.id, flows: result.flows.length, durationMs: Date.now() - t0 });

    return success(res, {
      projectId: result.project.id,
      rawKey: result.rawKey,
      keyPrefix: result.apiKey.keyPrefix,
      flowsCreated: result.flows.length,
      flowIds: result.flows.map((f: any) => f.id),
      durationMs: Date.now() - t0,
    }, "Assistant initialized", 201);
  } catch (err: any) {
    console.error("[initialize] FAILED:", err?.message, err?.stack);
    return error(res, `Initialize failed: ${err.message}`, 500);
  }
}

// Build a simple linear flow graph for a single intent
function buildFlowGraph(opts: {
  welcome: string;
  fields: Array<{
    key: string;
    label: string;
    type: string;
    required?: boolean;
    options?: Array<{ label: string; value: string }>;
    placeholder?: string;
    helpText?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    step?: number;
    minDate?: string;
    maxDate?: string;
    pattern?: string;
    multiple?: boolean;
  }>;
  successMessage: string;
  /** When true, append a lead_save node before the end so captured data is persisted. */
  storeLeads?: boolean;
}) {
  const nodes: any[] = [];
  const edges: any[] = [];
  let y = 0;
  const step = 250;
  const x = 350;

  // start
  nodes.push({ id: "start-1", type: "start", position: { x, y }, data: { trigger: "widget_open", delaySeconds: 0 } });
  let prevId = "start-1";
  y += step;

  // welcome message
  nodes.push({ id: "message-1", type: "message", position: { x, y }, data: { message: opts.welcome } });
  edges.push({ id: `e-${prevId}-message-1`, source: prevId, target: "message-1" });
  prevId = "message-1";
  y += step;

  let collectIdx = 0;
  let choiceIdx = 0;

  // collect each field — map select → choice, others → collect
  opts.fields.forEach((f, i) => {
    const fieldNameSnake = snakeCase(f.key || f.label || `field_${i + 1}`);
    const labelLower = (f.label || f.key || "info").toLowerCase().replace(/^your\s+/i, "");

    if (f.type === "select" && Array.isArray(f.options) && f.options.length > 0) {
      choiceIdx += 1;
      const id = `choice-${choiceIdx}`;
      nodes.push({
        id,
        type: "choice",
        position: { x, y },
        data: {
          question: `Which ${labelLower}?`,
          helpText: f.helpText,
          fieldName: fieldNameSnake,
          required: f.required ?? true,
          options: f.options.map((opt, oi) => ({
            id: `opt_${oi + 1}`,
            label: String(opt.label ?? "Option"),
            value: snakeCase(opt.value ?? opt.label ?? `option_${oi + 1}`),
          })),
          multiple: f.multiple ?? false,
        },
      });
      edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id });
      prevId = id;
    } else {
      collectIdx += 1;
      const id = `collect-${collectIdx}`;
      const fieldType = mapFieldType(f.type);
      const data: Record<string, any> = {
        // Always a real question. helpText is a SEPARATE hint shown below.
        question: `What's your ${labelLower}?`,
        fieldName: fieldNameSnake,
        fieldType,
        required: f.required ?? true,
        placeholder: f.placeholder ?? "",
      };
      // Carry validation rules onto the node so the flow runtime can enforce them.
      if (f.minLength !== undefined) data.minLength = f.minLength;
      if (f.maxLength !== undefined) data.maxLength = f.maxLength;
      if (f.min !== undefined) data.min = f.min;
      if (f.max !== undefined) data.max = f.max;
      if (f.step !== undefined) data.step = f.step;
      if (f.minDate !== undefined) data.minDate = f.minDate;
      if (f.maxDate !== undefined) data.maxDate = f.maxDate;
      if (f.pattern !== undefined) data.pattern = f.pattern;
      if (f.helpText !== undefined && f.helpText.trim().length > 0) data.helpText = f.helpText;

      nodes.push({
        id,
        type: "collect",
        position: { x, y },
        data,
      });
      edges.push({ id: `e-${prevId}-${id}`, source: prevId, target: id });
      prevId = id;
    }
    y += step;
  });

  // lead_save (only when configured to persist responses)
  if (opts.storeLeads !== false) {
    nodes.push({ id: "lead_save-1", type: "lead_save", position: { x, y }, data: { notifyEmail: "" } });
    edges.push({ id: `e-${prevId}-lead_save-1`, source: prevId, target: "lead_save-1" });
    prevId = "lead_save-1";
    y += step;
  }

  // end
  nodes.push({ id: "end-1", type: "end", position: { x, y }, data: { message: opts.successMessage, action: "close", redirectUrl: "" } });
  edges.push({ id: `e-${prevId}-end-1`, source: prevId, target: "end-1" });

  return { nodes, edges };
}

function mapFieldType(t: string): string {
  switch ((t ?? "").toLowerCase()) {
    case "email": return "email";
    case "phone": return "phone";
    case "number": return "number";
    case "url": return "url";
    case "date":
    case "longtext":
    case "text":
    default: return "text";
  }
}

function snakeCase(s: string): string {
  return String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "field";
}

// ── Authenticated live preview (uses real pipeline, no API key needed) ───────
const chatService = new ChatService();

export async function livePreview(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { content, conversationId } = req.body;
    if (!content?.trim()) return error(res, "Message required", 400);

    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.tenantId, req.user!.tenantId)))
      .limit(1);

    if (!project) return error(res, "Not found", 404);

    const result = await chatService.sendMessage(
      req.user!.tenantId,
      { content, conversationId } as any,
      id,
    );
    return success(res, result);
  } catch (err: any) {
    return error(res, err.message ?? "Preview failed", 500);
  }
}
