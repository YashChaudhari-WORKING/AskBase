"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/components/onboarding";

export default function DeployPage() {
  const router = useRouter();
  const ctx = useOnboarding();

  const [rawKey, setRawKey] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [flowId, setFlowId] = useState<string | null>(null);
  const [assistantName, setAssistantName] =
    useState<string>("Your assistant");
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // ── Load install result on mount ───────────────────────────────────────────
  useEffect(() => {
    let key: string | null = null;
    let pid: string | null = null;
    let fid: string | null = null;

    try {
      const raw = sessionStorage.getItem("askbase_install_result");
      if (raw) {
        const parsed = JSON.parse(raw) as {
          projectId: string;
          rawKey: string;
          flowId?: string;
        };
        key = parsed.rawKey;
        pid = parsed.projectId;
        fid = parsed.flowId ?? null;
      }

      // Fallbacks for resilience
      if (!key) key = sessionStorage.getItem("askbase_embed_key");

      const storedName = sessionStorage.getItem("askbase_assistant_name");
      if (storedName) setAssistantName(storedName);
      else if (ctx.config?.name) setAssistantName(ctx.config.name);
    } catch {
      // ignore
    }

    if (!key) {
      router.replace("/dashboard/bots/new");
      return;
    }

    setRawKey(key);
    setProjectId(pid);
    setFlowId(fid);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const embedCode = rawKey
    ? `<script\n  src="https://cdn.askbase.io/widget.js"\n  data-key="${rawKey}"\n  async>\n</script>`
    : "";

  async function handleCopy() {
    if (!embedCode) return;
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function goToBuilder() {
    const target = projectId
      ? `/dashboard/bots/${projectId}`
      : "/dashboard/bots";

    // Clear all onboarding session state
    try {
      sessionStorage.removeItem("askbase_install_payload");
      sessionStorage.removeItem("askbase_install_config_snapshot");
      sessionStorage.removeItem("askbase_install_result");
      sessionStorage.removeItem("askbase_embed_key");
      sessionStorage.removeItem("askbase_assistant_type");
      sessionStorage.removeItem("askbase_assistant_name");
      sessionStorage.removeItem("askbase_new_config");
      sessionStorage.removeItem("askbase_install_type");
      sessionStorage.removeItem("askbase_flow_bot_payload");
    } catch {
      // ignore
    }

    ctx.reset?.();
    router.push(target);
  }

  if (!loaded) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-md flex flex-col gap-8">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-foreground" strokeWidth={2.5} />
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              {assistantName} is ready
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste this snippet on your site to go live.
          </p>
        </div>

        {/* Embed code */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">Embed code</p>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="relative bg-card border border-border/60 rounded-md overflow-hidden">
            <pre className="whitespace-pre-wrap break-all p-3 font-mono text-[11px] text-foreground leading-relaxed">
              {embedCode}
            </pre>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Paste before <code className="font-mono text-foreground">&lt;/body&gt;</code>
          </p>
        </div>

        {/* Warning — quiet inline */}
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          Save this key — it won&apos;t be shown again.
        </p>

        {/* Continue */}
        <Button
          size="default"
          variant="outline"
          className="rounded-md gap-1.5 h-9 text-sm w-fit self-start"
          onClick={goToBuilder}
        >
          Open assistant
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
