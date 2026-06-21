"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";

const STORAGE_KEY = "askbase_flow_bot_payload";

const EXAMPLES = [
  {
    label: "School admissions",
    description:
      "Private school. Collect parent name, email, phone, and which class — SR KG, JR KG, or Playgroup.",
  },
  {
    label: "Demo booking",
    description:
      "SaaS company. Book a product demo — collect name, work email, company name, and preferred date.",
  },
  {
    label: "Customer feedback",
    description:
      "Collect feedback — a 1-5 rating, what they liked most, and what we can improve.",
  },
  {
    label: "Restaurant reservation",
    description:
      "Restaurant. Book a table — collect name, phone, party size, and preferred date and time.",
  },
  {
    label: "Real estate inquiry",
    description:
      "Real estate. Capture buyer inquiries — name, email, phone, budget range, and which property they want to see.",
  },
];

function useRotatingExample(intervalMs = 4000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % EXAMPLES.length), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return EXAMPLES[index];
}

export default function FlowDescribePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rotating = useRotatingExample();

  async function callGenerate(opts: { description: string; clarificationAnswers?: Record<string, string> }) {
    const res = await api.post("/projects/generate-flow-bot", {
      description: opts.description,
      ...(opts.clarificationAnswers ? { clarificationAnswers: opts.clarificationAnswers } : {}),
    });
    return res.data?.data ?? res.data;
  }

  async function handleBuild(description?: string) {
    const trimmed = (description ?? text).trim();
    if (!trimmed || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const data = await callGenerate({ description: trimmed });

      if (data?.needsClarification && Array.isArray(data.questions) && data.questions.length > 0) {
        // AI asks back — render the questions
        setQuestions(data.questions);
        setAnswers({});
        setGenerating(false);
        return;
      }

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ description: trimmed, config: data }));
      router.push("/dashboard/bots/new/flow/build");
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to generate. Try rephrasing.");
      setGenerating(false);
    }
  }

  async function submitAnswers() {
    if (!questions) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    setGenerating(true);
    setError(null);
    try {
      // Pack answers as { question: answer }
      const clarificationAnswers: Record<string, string> = {};
      questions.forEach((q, i) => {
        const a = answers[i]?.trim();
        if (a) clarificationAnswers[q] = a;
      });

      const data = await callGenerate({
        description: trimmed,
        clarificationAnswers,
      });

      if (data?.needsClarification && Array.isArray(data.questions)) {
        // Still ambiguous — replace questions, keep going
        setQuestions(data.questions);
        setAnswers({});
        setGenerating(false);
        return;
      }

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ description: trimmed, config: data }));
      router.push("/dashboard/bots/new/flow/build");
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to generate.");
      setGenerating(false);
    }
  }

  function applyExample(description: string) {
    setText(description);
    setQuestions(null);
    setAnswers({});
    textareaRef.current?.focus();
  }

  const allAnswered = questions
    ? questions.every((_, i) => (answers[i] ?? "").trim().length > 0)
    : false;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-12 bg-background">
      {/* Back */}
      <div className="w-full max-w-xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard/bots/new")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 mb-12"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </button>
      </div>

      <div className="w-full max-w-xl flex flex-col gap-8">
        {/* Heading */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            What should it collect?
          </h1>
          <p className="text-sm text-muted-foreground">One sentence is enough.</p>
        </div>

        {/* Textarea */}
        <div className="flex flex-col gap-3">
          <Textarea
            ref={textareaRef}
            autoFocus
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (questions) {
                // user is editing prompt — drop pending clarification
                setQuestions(null);
                setAnswers({});
              }
            }}
            placeholder={text ? "" : rotating.description}
            className="min-h-[140px] text-sm rounded-md border-border/60 bg-card resize-none p-4 focus-visible:ring-1"
            disabled={generating}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (questions) submitAnswers();
                else handleBuild();
              }
            }}
          />

          {!questions && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted-foreground">
                <kbd className="rounded bg-muted border border-border/60 px-1 py-0.5 text-[10px] font-mono">⌘</kbd>{" "}
                <kbd className="rounded bg-muted border border-border/60 px-1 py-0.5 text-[10px] font-mono">↵</kbd>
                {" "}to continue
              </span>
              <Button
                size="default"
                disabled={!text.trim() || generating}
                onClick={() => handleBuild()}
                className="rounded-md gap-1.5 h-9 px-4 text-sm font-medium"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        {/* Clarification panel — AI asks back when prompt is ambiguous */}
        {questions && questions.length > 0 && (
          <div className="rounded-md border border-border/60 bg-card p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <h2 className="text-sm font-semibold text-foreground">
                  A few quick questions
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Answer these so the form is built right — then we&apos;ll generate it.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {questions.map((q, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <label className="text-xs text-foreground leading-snug">{q}</label>
                  <Textarea
                    value={answers[i] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                    }
                    placeholder="Your answer…"
                    className="min-h-[64px] rounded-md text-sm resize-none"
                    disabled={generating}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setQuestions(null);
                  setAnswers({});
                }}
                disabled={generating}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip — let AI guess
              </button>
              <Button
                size="default"
                disabled={!allAnswered || generating}
                onClick={submitAnswers}
                className="rounded-md gap-1.5 h-9 px-4 text-sm font-medium"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Building
                  </>
                ) : (
                  <>
                    Build with these answers
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Examples */}
        {!questions && (
          <div className="flex flex-col gap-2 pt-2">
            <p className="text-[11px] text-muted-foreground">Examples</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => applyExample(ex.description)}
                  disabled={generating}
                  className="rounded-md border border-border/60 bg-card hover:bg-accent hover:border-border px-2.5 py-1 text-[11px] text-foreground transition-colors disabled:opacity-50"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
