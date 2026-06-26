"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Edit2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FlowFieldEditor, RefinePopover, FlowReplayPreview } from "@/components/onboarding";
import type { IntentField } from "@/components/onboarding/OnboardingState";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

const STORAGE_KEY = "askbase_flow_bot_payload";
const INSTALL_KEY = "askbase_install_payload";
const INSTALL_TYPE_KEY = "askbase_install_type";
const ATTACH_BOT_ID_KEY = "askbase_attach_to_bot_id";
const ATTACH_BOT_NAME_KEY = "askbase_attach_to_bot_name";

interface FlowDef {
  label: string;
  fields: IntentField[];
  successMessage: string;
}

interface FlowBotConfig {
  name: string;
  welcomeMessage: string;
  responseTimeText: string;
  primaryColor: string;
  storeLeads?: boolean;
  flow: FlowDef;
  reasoning?: string;
}

const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "Text",
  email: "Email",
  phone: "Phone",
  date: "Date",
  number: "Number",
  longtext: "Long text",
  select: "Select",
};

export default function FlowBuildPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState<FlowBotConfig | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [editFlowOpen, setEditFlowOpen] = useState(false);
  const [building, setBuilding] = useState(false);
  const [attachToBotId, setAttachToBotId] = useState<string | null>(null);
  const [attachToBotName, setAttachToBotName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        router.replace("/dashboard/bots/new/flow");
        return;
      }
      const parsed = JSON.parse(raw);
      setDescription(parsed.description ?? "");
      setConfig(parsed.config);
      const botId = sessionStorage.getItem(ATTACH_BOT_ID_KEY);
      const botName = sessionStorage.getItem(ATTACH_BOT_NAME_KEY);
      if (botId) { setAttachToBotId(botId); setAttachToBotName(botName); }
    } catch {
      router.replace("/dashboard/bots/new/flow");
    }
  }, [router]);

  function persist(nextConfig: FlowBotConfig) {
    setConfig(nextConfig);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ description, config: nextConfig }));
  }

  function patchConfig(patch: Partial<FlowBotConfig>) {
    if (!config) return;
    persist({ ...config, ...patch });
  }

  function patchFlow(patch: Partial<FlowDef>) {
    if (!config) return;
    persist({ ...config, flow: { ...config.flow, ...patch } });
  }

  async function handleRegenerate(refinement: string) {
    if (!config) return;
    try {
      const res = await api.post("/projects/generate-flow-bot", {
        description,
        refinement,
        previousConfig: config,
      });
      const next = res.data?.data ?? res.data;
      persist(next);
    } catch {
      // popover handles its own state
    }
  }

  async function handleBuild() {
    if (!config) return;
    setBuilding(true);

    // "Attach to existing bot" mode — create just the flow, then attach + generate trigger
    if (attachToBotId) {
      try {
        // 1. Create the flow (nodes/edges built server-side)
        const createRes = await api.post("/projects/create-flow-only", {
          flow: config.flow,
          storeLeads: config.storeLeads !== false,
        });
        const { flowId, flowName } = createRes.data?.data ?? createRes.data;

        // 2. Generate a trigger for this flow
        let trigger = "";
        try {
          const trigRes = await api.post("/projects/generate-trigger", {
            flowName,
            botContext: description,
          });
          trigger = trigRes.data?.data?.trigger ?? trigRes.data?.trigger ?? "";
        } catch { /* non-fatal — user can set it manually */ }

        // 3. Fetch current attachedFlows for the bot, then append
        const botRes = await api.get(`/projects/${attachToBotId}`);
        const botData = botRes.data?.data ?? botRes.data;
        const existing: Array<{ flowId: string; flowName: string; trigger: string }> =
          botData.attachedFlows ?? [];
        const next = [...existing, { flowId, flowName, trigger }];

        // 4. PATCH the bot
        await api.patch(`/projects/${attachToBotId}`, { attachedFlows: next });

        // 5. Cleanup sessionStorage and go back to the bot's Flow tab
        try {
          sessionStorage.removeItem(ATTACH_BOT_ID_KEY);
          sessionStorage.removeItem(ATTACH_BOT_NAME_KEY);
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {}

        router.push(`/dashboard/bots/${attachToBotId}?tab=flows`);
      } catch (err: any) {
        console.error("[flow-build] attach failed:", err);
        setBuilding(false);
      }
      return;
    }

    // Normal path — full flow bot installer
    const payload = {
      config: {
        name: config.name,
        welcomeMessage: config.welcomeMessage,
        responseTimeText: config.responseTimeText,
        primaryColor: config.primaryColor,
        tone: "friendly",
      },
      flow: config.flow,
      storeLeads: config.storeLeads !== false,
    };
    try {
      sessionStorage.setItem(INSTALL_KEY, JSON.stringify(payload));
      sessionStorage.setItem(INSTALL_TYPE_KEY, "flow");
      sessionStorage.setItem("askbase_assistant_name", config.name);
      sessionStorage.setItem("askbase_assistant_type", "flow");
    } catch {}
    router.push("/dashboard/bots/new/installing");
  }

  if (!config) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* ── LEFT — Config ────────────────────────────────────────────────── */}
      <aside className="w-[440px] flex-shrink-0 h-screen overflow-y-auto border-r border-border/60 flex flex-col">
        <div className="flex-1 px-8 pt-8 pb-4 flex flex-col gap-7">
          {/* Back */}
          <button
            type="button"
            onClick={() => {
              if (attachToBotId) {
                try { sessionStorage.removeItem(ATTACH_BOT_ID_KEY); sessionStorage.removeItem(ATTACH_BOT_NAME_KEY); } catch {}
                router.push(`/dashboard/bots/${attachToBotId}`)
              } else {
                router.push("/dashboard/bots/new/flow")
              }
            }}
            className="self-start text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3 h-3" />
            {attachToBotId ? `Back to ${attachToBotName ?? "assistant"}` : "Back"}
          </button>

          {/* Title */}
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Customize</h1>
            <p className="text-xs text-muted-foreground">Tweak anything before going live.</p>
          </div>

          {/* Name */}
          <Field label="Name">
            <div className="flex items-center gap-2">
              {editingName ? (
                <Input
                  autoFocus
                  value={config.name}
                  onChange={(e) => patchConfig({ name: e.target.value })}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") setEditingName(false);
                  }}
                  className="h-9 rounded-md"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="group flex items-center gap-2 text-foreground text-sm font-medium cursor-text"
                >
                  <span className="truncate">{config.name || "Untitled"}</span>
                  <Edit2 className="w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                </button>
              )}
            </div>
          </Field>

          {/* Form preview */}
          <Field label="Form">
            <div className="rounded-lg border border-border/60 bg-card">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60">
                <span className="text-sm font-medium text-foreground truncate">
                  {config.flow.label}
                </span>
                <button
                  type="button"
                  onClick={() => setEditFlowOpen(!editFlowOpen)}
                  className={cn(
                    "text-[11px] font-medium transition-colors",
                    editFlowOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {editFlowOpen ? "Done" : "Edit"}
                </button>
              </div>

              {!editFlowOpen ? (
                <>
                  {/* Fields */}
                  <ul className="divide-y divide-border/40">
                    {config.flow.fields.map((f, i) => (
                      <li
                        key={f.key || i}
                        className="flex items-center gap-3 px-3 py-2 text-xs"
                      >
                        <span className="w-4 text-muted-foreground tabular-nums shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-medium text-foreground flex-1 truncate">
                          {f.label}
                        </span>
                        <span className="text-muted-foreground shrink-0">
                          {f.type === "select"
                            ? `Select · ${f.options?.length ?? 0}`
                            : FIELD_TYPE_LABEL[f.type] ?? f.type}
                        </span>
                        {f.required && (
                          <span className="w-3 text-center text-muted-foreground shrink-0" title="Required">
                            *
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* End message */}
                  <div className="px-3 py-2 border-t border-border/60 text-[11px] text-muted-foreground">
                    <span className="text-muted-foreground/60">Ends with </span>
                    <span className="text-foreground">&ldquo;{config.flow.successMessage}&rdquo;</span>
                  </div>
                </>
              ) : (
                <div className="p-3">
                  <FlowFieldEditor
                    label={config.flow.label}
                    triggers={[]}
                    fields={config.flow.fields}
                    successMessage={config.flow.successMessage}
                    showTriggers={false}
                    onSave={(updated) => {
                      patchFlow({
                        label: updated.label,
                        fields: updated.fields,
                        successMessage: updated.successMessage,
                      });
                      setEditFlowOpen(false);
                    }}
                    onCancel={() => setEditFlowOpen(false)}
                  />
                </div>
              )}
            </div>

            <RefinePopover
              open={refineOpen}
              onOpenChange={setRefineOpen}
              onRegenerate={handleRegenerate}
              trigger={
                <button
                  type="button"
                  className="self-start text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-2"
                >
                  Regenerate with feedback
                </button>
              }
            />
          </Field>

          {/* Welcome */}
          <Field label="Welcome message">
            <Textarea
              value={config.welcomeMessage}
              onChange={(e) => patchConfig({ welcomeMessage: e.target.value })}
              placeholder="Hi! Let's get you set up."
              className="min-h-[72px] rounded-md text-sm resize-none"
            />
          </Field>

          {/* Lead storage */}
          <Field label="Lead storage">
            <label className="flex items-start gap-3 rounded-md border border-border/60 bg-card p-3 cursor-pointer hover:bg-accent/40 transition-colors">
              <input
                type="checkbox"
                checked={config.storeLeads !== false}
                onChange={(e) => patchConfig({ storeLeads: e.target.checked })}
                className="mt-0.5 rounded border-border"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-foreground font-medium">
                  Save captured responses
                </span>
                <span className="text-[11px] text-muted-foreground leading-snug">
                  Adds a Save Lead step at the end of the flow so each submission is persisted. You can wire delivery (email, webhook, CRM) later.
                </span>
              </div>
            </label>
          </Field>
        </div>

        {/* Build CTA — sticky bottom, simple */}
        <div className="px-8 py-4 border-t border-border/60 bg-background sticky bottom-0">
          <Button
            size="default"
            className="w-full rounded-md h-10 text-sm font-medium gap-2"
            disabled={building || !config.name?.trim() || !config.flow.fields.length}
            onClick={handleBuild}
          >
            {building ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {attachToBotId
              ? (building ? "Attaching…" : `Save & attach to ${attachToBotName ?? "assistant"}`)
              : "Build"
            }
            {!building && <ArrowRight className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </aside>

      {/* ── RIGHT — Replay preview ──────────────────────────────────────── */}
      <main className="flex-1 h-screen overflow-y-auto bg-muted/15 flex items-start justify-center pt-12 pb-12">
        <div className="w-full max-w-[460px] px-8 flex flex-col gap-1">
          <p className="text-[11px] text-muted-foreground mb-2">Preview</p>
          <FlowReplayPreview
            welcomeMessage={config.welcomeMessage}
            responseTimeText={config.responseTimeText || "Takes under a minute"}
            fields={config.flow.fields}
            successMessage={config.flow.successMessage}
            className="w-full"
          />
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Field — minimal label + content
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
