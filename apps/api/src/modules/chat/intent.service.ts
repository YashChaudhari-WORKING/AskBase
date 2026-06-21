import Groq from "groq-sdk";
import { env } from "../../config/env";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export type Intent =
  | "rag_query"       // needs knowledge base lookup
  | "greeting"        // hi, hello, thanks, bye
  | "handoff_request" // user explicitly wants a human
  | "out_of_scope"    // unrelated to bot purpose
  | "clarification"   // too vague to search meaningfully
  | "flow_trigger";   // user's message matches the configured flow trigger

export interface IntentResult {
  intent: Intent;
  confidence: number;
  rewrittenQuery?: string; // declarative form optimized for vector search
  directReply?: string;    // ready-made reply for non-rag intents
  flowId?: string;         // set when intent === "flow_trigger"
}

export interface AttachedFlow {
  flowId: string;
  flowName: string;
  trigger: string;
}

export async function classifyIntent(
  message: string,
  systemPrompt: string | null,
  recentHistory: Array<{ role: string; content: string }>,
  flowTrigger?: string | null,
  flowId?: string | null,
  attachedFlows?: AttachedFlow[]
): Promise<IntentResult> {
  const historyText = recentHistory
    .slice(-10)
    .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const purposeContext = systemPrompt
    ? `Bot purpose: ${systemPrompt.slice(0, 300)}`
    : "Bot purpose: General customer support assistant.";

  // Build flow context from attachedFlows (multi-flow) or legacy single flowTrigger
  const flows: Array<{ id: string; name: string; trigger: string }> = [];
  if (attachedFlows && attachedFlows.length > 0) {
    attachedFlows.forEach(f => flows.push({ id: f.flowId, name: f.flowName, trigger: f.trigger }));
  } else if (flowTrigger && flowId) {
    flows.push({ id: flowId, name: "Flow", trigger: flowTrigger });
  }

  const flowSection = flows.length > 0
    ? `\nAvailable flows — if the user's message matches any trigger, return flow_trigger and the matching flowId:\n${flows.map((f, i) => `${i + 1}. flowId="${f.id}" name="${f.name}" trigger="${f.trigger}"`).join("\n")}\n`
    : "";

  const flowIdField = flows.length > 0
    ? `  "flowId": "<flowId of the matched flow, or null if not flow_trigger>",`
    : "";

  const prompt = `You are an intent classifier for a customer support chatbot.

${purposeContext}
${flowSection}
Recent conversation:
${historyText || "(start of conversation)"}

User message: "${message}"

Respond with a JSON object only — no markdown, no explanation:
{
  "intent": "rag_query" | "greeting" | "handoff_request" | "out_of_scope" | "clarification" | "flow_trigger",
  "confidence": <0.0–1.0>,
${flowIdField}
  "rewrittenQuery": "<if rag_query: rewrite as a specific factual statement matching document language. null otherwise>",
  "directReply": "<if greeting/out_of_scope/handoff_request/clarification: concise reply. null for rag_query or flow_trigger>"
}

Intent rules — default to rag_query when unsure:
- rag_query: ANY question or topic answerable from documents. Includes vague requests like "tell me more", "what do you offer", "pricing", "how it works". If it has a noun or topic word, it is rag_query.
- flow_trigger: user's message matches one of the available flow triggers listed above. When matched, set flowId to the matching flow's id.
- greeting: ONLY pure greetings or small talk — "hi", "hello", "thanks", "bye". Zero information need.
- handoff_request: user EXPLICITLY asks for a human — "talk to a person", "connect me to agent", "speak to human". Do NOT use this if they are just asking a question or requesting a service.
- out_of_scope: ONLY if completely unrelated to any conceivable business topic (sports, politics, recipes).
- clarification: ONLY standalone pronouns with NO topic — "what about it?", "that one". If message has ANY noun, use rag_query.

CRITICAL: Never return handoff_request unless the user explicitly says they want a human. Asking about services, pricing, or booking is NOT a handoff request — it is flow_trigger or rag_query.
CRITICAL: When in doubt between rag_query and clarification, always pick rag_query.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 250,
      response_format: { type: "json_object" },
    });

    const raw = JSON.parse(completion.choices[0].message.content ?? "{}");
    // flowId: prefer what the classifier returned (multi-flow), fallback to legacy single flowId
    const resolvedFlowId = raw.intent === "flow_trigger"
      ? (raw.flowId || flowId || undefined)
      : undefined;
    return {
      intent: (raw.intent as Intent) ?? "rag_query",
      confidence: typeof raw.confidence === "number" ? raw.confidence : 0.7,
      rewrittenQuery: raw.rewrittenQuery || undefined,
      directReply: raw.directReply || undefined,
      flowId: resolvedFlowId,
    };
  } catch {
    return { intent: "rag_query", confidence: 0.5 };
  }
}
