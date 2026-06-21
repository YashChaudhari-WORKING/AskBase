"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, MessageCircle, GitBranch } from "lucide-react";

function pick(router: ReturnType<typeof useRouter>, goal: string, route: string) {
  try { sessionStorage.setItem("askbase_goal", goal); } catch {}
  router.push(route);
}

export default function NewBotPage() {
  const router = useRouter();

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-2xl flex flex-col gap-8">

        <button
          type="button"
          onClick={() => router.push("/dashboard/bots")}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </button>

        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Create an assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            How should your assistant work?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* AI */}
          <button
            type="button"
            onClick={() => pick(router, "both", "/dashboard/bots/new/ai")}
            className="group relative flex flex-col gap-6 rounded-2xl border border-border bg-card hover:border-blue-500/40 hover:bg-blue-500/5 px-5 py-6 text-left transition-all duration-150 hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <MessageCircle className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-base font-semibold text-foreground">AI Assistant</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Answers visitor questions from your docs. A lead capture flow is auto-created.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider">Includes</p>
              <p className="text-sm text-blue-400">Q&A from knowledge base</p>
              <p className="text-sm text-blue-400">Lead capture flow</p>
              <p className="text-sm text-blue-400">AI-generated config</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all absolute bottom-5 right-5" />
          </button>

          {/* Flow */}
          <button
            type="button"
            onClick={() => pick(router, "flow", "/dashboard/bots/new/ai")}
            className="group relative flex flex-col gap-6 rounded-2xl border border-border bg-card hover:border-violet-500/40 hover:bg-violet-500/5 px-5 py-6 text-left transition-all duration-150 hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <GitBranch className="w-4.5 h-4.5 text-violet-400" />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-base font-semibold text-foreground">Flow Bot</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Guides visitors through structured steps to collect info or complete an action.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider">Includes</p>
              <p className="text-sm text-violet-400">Lead forms & booking</p>
              <p className="text-sm text-violet-400">Conditional branching</p>
              <p className="text-sm text-violet-400">Webhooks & integrations</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-violet-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all absolute bottom-5 right-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
