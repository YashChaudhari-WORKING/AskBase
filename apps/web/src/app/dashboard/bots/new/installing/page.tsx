"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallStep, useOnboarding } from "@/components/onboarding";
import api from "@/lib/api";

type StepStatus = "pending" | "running" | "done";

interface Step {
  id: string;
  label: string;
  detail?: string;
  status: StepStatus;
  durationMs: number;
}

const MIN_TOTAL_MS = 3000;

export default function InstallingPage() {
  const router = useRouter();
  const ctx = useOnboarding();

  const [steps, setSteps] = useState<Step[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const apiResultRef = useRef<{
    projectId: string;
    rawKey: string;
    flowId?: string;
  } | null>(null);
  const apiDoneRef = useRef(false);
  const apiErrorRef = useRef(false);
  // Tracks the optional auto-flow step for the "both" goal
  const autoFlowDoneRef = useRef(false);
  // Tracks optional KB attachment step
  const kbAttachDoneRef = useRef(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let payload: {
      config: {
        name: string;
        systemPrompt?: string;
        primaryMode?: string;
        primaryColor?: string;
        botSubtitle?: string;
        inputPlaceholder?: string;
        botAvatarEmoji?: string;
        homeGreeting?: string;
        homeSubgreeting?: string;
        businessHoursText?: string;
        conversationStarters?: Array<{ label: string; message: string }>;
        widgetQuickReplies?: Array<{ label: string }>;
      };
      intents?: { label: string; fields?: Array<{ key?: string; label?: string }> }[];
      flow?: { label: string; fields?: Array<{ key?: string; label?: string }> };
      widgetStyle?: string;
    } | null = null;

    let goal: string | null = null;
    let installType: string | null = null;
    let selectedKbId: string | null = null;

    try {
      const raw = sessionStorage.getItem("askbase_install_payload");
      if (raw) payload = JSON.parse(raw);
      goal = sessionStorage.getItem("askbase_goal");
      installType = sessionStorage.getItem("askbase_install_type");
      selectedKbId = sessionStorage.getItem("askbase_selected_kb_id");
    } catch {
      payload = null;
    }

    if (!payload) {
      router.replace("/dashboard/bots/new");
      return;
    }

    const hasAutoFlow = goal === "both";
    const hasKb = !!selectedKbId;

    const flowDefs: Array<{ label: string; fields?: Array<{ key?: string; label?: string }> }> =
      payload.flow ? [payload.flow] : (payload.intents ?? []);

    const intentSteps: Step[] = flowDefs.map((i) => ({
      id: `intent-${i.label}`,
      label: `Building '${i.label}'`,
      detail:
        i.fields && i.fields.length > 0
          ? `Fields: ${i.fields.map((f) => f.label ?? f.key ?? "field").join(", ")}`
          : undefined,
      status: "pending",
      durationMs: 0,
    }));

    const intentBlockMs = 1500;
    const perIntentMs =
      intentSteps.length > 0
        ? Math.max(400, Math.floor(intentBlockMs / intentSteps.length))
        : 0;
    intentSteps.forEach((s) => (s.durationMs = perIntentMs));

    const effectiveIntentSteps: Step[] =
      intentSteps.length > 0
        ? intentSteps
        : [
            {
              id: "intent-ai",
              label: "Configuring AI knowledge",
              detail: "No structured flows — AI-only mode",
              status: "pending",
              durationMs: intentBlockMs,
            },
          ];

    const systemPromptExcerpt = payload.config.systemPrompt
      ? payload.config.systemPrompt.slice(0, 80) +
        (payload.config.systemPrompt.length > 80 ? "…" : "")
      : `Assistant "${payload.config.name}" persona ready`;

    // Core steps
    const initial: Step[] = [
      {
        id: "create",
        label: "Creating assistant",
        detail: systemPromptExcerpt,
        status: "pending",
        durationMs: 1500,
      },
      ...effectiveIntentSteps,
      {
        id: "key",
        label: "Generating embed key",
        status: "pending",
        durationMs: 1500,
      },
      {
        id: "wire",
        label: "Wiring widget",
        status: "pending",
        durationMs: 1500,
      },
    ];

    // Extra step for "both" goal — waits on autoFlowDoneRef
    if (hasAutoFlow) {
      initial.push({
        id: "auto-flow",
        label: "Setting up lead capture flow",
        detail: "Adding a default form to collect visitor info",
        status: "pending",
        durationMs: 1500,
      });
    } else {
      autoFlowDoneRef.current = true; // not needed — mark done immediately
    }

    // Extra step when a KB was selected — waits on kbAttachDoneRef
    if (hasKb) {
      initial.push({
        id: "kb-attach",
        label: "Connecting knowledge base",
        detail: "Your documents are ready for the assistant to use",
        status: "pending",
        durationMs: 1000,
      });
    } else {
      kbAttachDoneRef.current = true;
    }

    setSteps(initial);

    // ── Main API call ───────────────────────────────────────────────────────
    const apiTimeout = setTimeout(() => {
      if (!apiDoneRef.current) {
        apiErrorRef.current = true;
        apiDoneRef.current = true;
        autoFlowDoneRef.current = true;
        setError("Server took too long to respond. Try again — your data wasn't saved.");
      }
    }, 20000);

    const endpoint =
      installType === "flow"
        ? "/projects/initialize-flow"
        : "/projects/initialize";

    api
      .post(endpoint, payload)
      .then(async (res) => {
        const data = res.data?.data ?? res.data;
        const rawKey = data.rawKey ?? data.apiKey?.rawKey ?? "";
        const projectId = data.projectId ?? data.id ?? "";
        const flowId = data.flowId ?? data.flowIds?.[0] ?? "";

        if (!rawKey || !projectId) {
          apiErrorRef.current = true;
          apiDoneRef.current = true;
          autoFlowDoneRef.current = true;
          return;
        }

        apiResultRef.current = { projectId, rawKey, flowId };
        apiDoneRef.current = true;

        // Fire-and-forget: save generated widget content fields
        {
          const c = payload!.config;
          const contentPatch: Record<string, unknown> = {};
          if (c.botSubtitle)        contentPatch.botSubtitle        = c.botSubtitle;
          if (c.inputPlaceholder)   contentPatch.inputPlaceholder   = c.inputPlaceholder;
          if (c.botAvatarEmoji)     contentPatch.botAvatarEmoji     = c.botAvatarEmoji;
          if (c.homeGreeting)       contentPatch.homeGreeting       = c.homeGreeting;
          if (c.homeSubgreeting)    contentPatch.homeSubgreeting    = c.homeSubgreeting;
          if (c.businessHoursText)  contentPatch.businessHoursText  = c.businessHoursText;
          if (c.conversationStarters?.length) contentPatch.conversationStarters = c.conversationStarters;
          if (c.widgetQuickReplies?.length)   contentPatch.widgetQuickReplies   = c.widgetQuickReplies;
          if (Object.keys(contentPatch).length) {
            api.patch(`/projects/${projectId}`, contentPatch).catch(() => { /* non-fatal */ });
          }
        }

        // Fire-and-forget: generate + create + attach widget theme
        api.post("/widget-themes/generate", {
          businessName: payload!.config.name,
          description: payload!.config.systemPrompt ?? "",
          style: payload!.widgetStyle ?? "modern",
        }).then(async (themeRes) => {
          const themeData = themeRes.data?.data ?? themeRes.data;
          const createRes = await api.post("/widget-themes", {
            name: themeData.themeName ?? `${payload!.config.name} Theme`,
            botName: themeData.botName ?? payload!.config.name,
            botSubtitle: themeData.botSubtitle,
            botAvatarEmoji: themeData.botAvatarEmoji,
            primaryColor: themeData.primaryColor ?? payload!.config.primaryColor,
            headerBgColor: themeData.headerBgColor,
            headerTextColor: themeData.headerTextColor,
            chatBgColor: themeData.chatBgColor,
            botBubbleBg: themeData.botBubbleBg,
            botBubbleText: themeData.botBubbleText,
            userBubbleBg: themeData.userBubbleBg,
            userBubbleText: themeData.userBubbleText,
            launcherBgColor: themeData.launcherBgColor,
            sendButtonColor: themeData.sendButtonColor,
            borderRadius: themeData.borderRadius ?? "xl",
            launcherIconEmoji: themeData.launcherIconEmoji,
            inputPlaceholder: themeData.inputPlaceholder,
            homeGreeting: themeData.homeGreeting,
            homeSubgreeting: themeData.homeSubgreeting,
          });
          const newThemeId = createRes.data?.data?.id ?? createRes.data?.id;
          if (newThemeId) {
            await api.patch(`/projects/${projectId}`, { widgetThemeId: newThemeId });
          }
        }).catch(() => { /* non-fatal */ });

        // Fire-and-forget: generate AI setup hints while the rest of install runs
        api.post("/projects/generate-setup-guide", {
          systemPrompt: payload!.config.systemPrompt ?? "",
          name: payload!.config.name,
          goal: goal ?? "ai",
          assistantType: payload!.config.primaryMode ?? "ai_agent",
        }).then((guideRes) => {
          const hints = guideRes.data?.data ?? guideRes.data;
          if (hints?.kbHint) {
            try {
              sessionStorage.setItem(`askbase_setup_hints_${projectId}`, JSON.stringify(hints));
            } catch {}
          }
        }).catch(() => { /* non-fatal */ });

        // ── Auto-flow creation for "both" goal ──────────────────────────────
        if (hasAutoFlow) {
          try {
            const flowRes = await api.post("/flows", {
              label: "Lead capture",
              fields: [
                { key: "name",    label: "Your name",     type: "text",     required: true  },
                { key: "email",   label: "Email address", type: "email",    required: true  },
                { key: "message", label: "How can we help?", type: "longtext", required: false },
              ],
              successMessage: "Thanks — we'll be in touch shortly.",
              trigger: "contact us",
            });
            const flowData = flowRes.data?.data ?? flowRes.data;
            const newFlowId = flowData.id;
            const newFlowName = flowData.label ?? "Lead capture";
            const trigger = flowData.trigger ?? "contact us";

            await api.patch(`/projects/${projectId}`, {
              attachedFlows: [{ flowId: newFlowId, flowName: newFlowName, trigger }],
            });
          } catch (flowErr) {
            console.warn("[installer] auto-flow creation failed:", flowErr);
          } finally {
            autoFlowDoneRef.current = true;
          }
        }

        // ── KB attachment (when user started from an existing KB) ────────────
        if (hasKb && selectedKbId) {
          try {
            await api.patch(`/projects/${projectId}`, { knowledgeBaseId: selectedKbId });
          } catch (kbErr) {
            console.warn("[installer] KB attach failed:", kbErr);
          } finally {
            kbAttachDoneRef.current = true;
            try { sessionStorage.removeItem("askbase_selected_kb_id"); } catch {}
          }
        }
      })
      .catch((err) => {
        const detail = err?.response?.data || err?.message || err;
        apiErrorRef.current = true;
        apiDoneRef.current = true;
        autoFlowDoneRef.current = true;
        setError(
          typeof detail === "string"
            ? detail
            : (detail?.error || detail?.message || "We couldn't finish setting things up.")
        );
      })
      .finally(() => {
        clearTimeout(apiTimeout);
      });

    // ── Visual cadence ──────────────────────────────────────────────────────
    const startedAt = Date.now();

    (async () => {
      for (let i = 0; i < initial.length; i++) {
        setSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: "running" } : s))
        );

        const extraSteps = (hasAutoFlow ? 1 : 0) + (hasKb ? 1 : 0);
        const isMainLast = i === initial.length - extraSteps - 1;
        const isAutoFlowStep = hasAutoFlow && initial[i].id === "auto-flow";
        const isKbStep = hasKb && initial[i].id === "kb-attach";

        if (isMainLast) {
          const visualEnd = Date.now() + initial[i].durationMs;
          while (Date.now() < visualEnd) {
            await new Promise((r) => setTimeout(r, 80));
            setProgress(Math.min(extraSteps > 0 ? 75 : 99, Math.round(((Date.now() - startedAt) / MIN_TOTAL_MS) * 100)));
          }
          while (!apiDoneRef.current) {
            await new Promise((r) => setTimeout(r, 100));
          }
        } else if (isAutoFlowStep) {
          const visualEnd = Date.now() + initial[i].durationMs;
          while (Date.now() < visualEnd) {
            await new Promise((r) => setTimeout(r, 80));
            setProgress(Math.min(hasKb ? 88 : 99, Math.round(((Date.now() - startedAt) / MIN_TOTAL_MS) * 100)));
          }
          while (!autoFlowDoneRef.current) {
            await new Promise((r) => setTimeout(r, 100));
          }
        } else if (isKbStep) {
          const visualEnd = Date.now() + initial[i].durationMs;
          while (Date.now() < visualEnd) {
            await new Promise((r) => setTimeout(r, 80));
            setProgress(Math.min(99, Math.round(((Date.now() - startedAt) / MIN_TOTAL_MS) * 100)));
          }
          while (!kbAttachDoneRef.current) {
            await new Promise((r) => setTimeout(r, 100));
          }
        } else {
          const stepEnd = Date.now() + initial[i].durationMs;
          while (Date.now() < stepEnd) {
            await new Promise((r) => setTimeout(r, 80));
            setProgress(Math.min(hasAutoFlow ? 70 : 99, Math.round(((Date.now() - startedAt) / MIN_TOTAL_MS) * 100)));
          }
        }

        setSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: "done" } : s))
        );
      }

      // Ensure minimum total time
      const elapsedTotal = Date.now() - startedAt;
      if (elapsedTotal < MIN_TOTAL_MS) {
        await new Promise((r) => setTimeout(r, MIN_TOTAL_MS - elapsedTotal));
      }

      setProgress(100);

      if (apiErrorRef.current || !apiResultRef.current?.rawKey) {
        setError("We couldn't finish setting things up. Try again in a moment.");
        return;
      }

      try {
        sessionStorage.setItem("askbase_install_result", JSON.stringify(apiResultRef.current));
        sessionStorage.setItem("askbase_embed_key", apiResultRef.current.rawKey);
        sessionStorage.setItem("askbase_assistant_type", payload!.config.primaryMode ?? "ai");
        sessionStorage.setItem("askbase_assistant_name", payload!.config.name);
      } catch {}

      router.push("/dashboard/bots/new/deploy");
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-6 bg-background">
        <div className="w-full max-w-sm flex flex-col items-center text-center gap-4">
          <div className="w-9 h-9 rounded-md bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Something went wrong</h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{error}</p>
          </div>
          <Button
            size="default"
            variant="outline"
            className="rounded-md gap-1.5 h-9 px-4 text-xs mt-1"
            onClick={() => router.push("/dashboard/bots/new")}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Setting up</h2>
          <p className="text-xs text-muted-foreground">A few seconds…</p>
        </div>

        <div className="flex flex-col gap-2">
          {steps.map((step) => (
            <InstallStep
              key={step.id}
              label={step.label}
              detail={step.detail}
              status={step.status}
              durationMs={step.durationMs}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border/60 overflow-hidden rounded-full">
            <div
              className="h-full bg-foreground transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
            {progress}%
          </p>
        </div>
      </div>
    </div>
  );
}
