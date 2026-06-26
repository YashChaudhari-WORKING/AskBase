"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import {
  Send, Loader2, Bot, User, Zap, AlertCircle,
  CheckCircle, ChevronDown, ChevronUp, BookOpen,
  RefreshCw, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { usePageHeader } from "@/components/dashboard/page-header";
import { PageHeaderBar } from "@/components/dashboard/page-header-bar";

interface Source {
  documentTitle: string;
  chunkContent: string;
  score: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  confidence?: number;
  shouldHandoff?: boolean;
  error?: boolean;
}

function ConfidenceDot({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" : pct >= 40 ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10" : "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {pct}% confidence
    </span>
  );
}

function SourcesPanel({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5" />
        {sources.length} source{sources.length !== 1 ? "s" : ""}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {sources.map((s, i) => (
            <div key={i} className="bg-muted/40 rounded-lg px-3 py-2 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{s.documentTitle}</span>
                <span className="text-[11px] text-muted-foreground">{Math.round(s.score * 100)}% match</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{s.chunkContent}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlaygroundPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyReady, setKeyReady] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get or create a playground API key
  useEffect(() => {
    const stored = localStorage.getItem("playground_api_key");
    if (stored) {
      setApiKey(stored);
      setKeyReady(true);
      return;
    }

    api.post("/keys", { name: "Playground (auto)" })
      .then(res => {
        const raw = res.data.data?.rawKey;
        if (raw) {
          localStorage.setItem("playground_api_key", raw);
          setApiKey(raw);
          setKeyReady(true);
        }
      })
      .catch(() => setKeyError("Could not create API key. Make sure you're logged in and /api/keys is registered."));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const content = input.trim();
    if (!content || !apiKey || loading) return;
    setInput("");

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.post(
        "/chat/message",
        { content, conversationId, customerName: "Playground User" },
        { headers: { "x-api-key": apiKey } }
      );
      const data = res.data.data;
      if (data.conversationId) setConversationId(data.conversationId);

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message?.content ?? "No response",
        sources: data.message?.sources ?? [],
        confidence: data.message?.confidenceScore,
        shouldHandoff: data.handoffTriggered,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: err.response?.data?.message ?? "Something went wrong.",
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([]);
    setConversationId(undefined);
  }

  function resetKey() {
    localStorage.removeItem("playground_api_key");
    setApiKey(null);
    setKeyReady(false);
    setKeyError("");
    // re-trigger useEffect
    api.post("/keys", { name: "Playground (auto)" })
      .then(res => {
        const raw = res.data.data?.rawKey;
        if (raw) {
          localStorage.setItem("playground_api_key", raw);
          setApiKey(raw);
          setKeyReady(true);
        }
      })
      .catch(() => setKeyError("Could not create API key."));
  }

  const suggestions = [
    "What projects are in this portfolio?",
    "What technologies does this person use?",
    "Tell me about the work experience",
    "What are the key skills?",
  ];

  usePageHeader(
    <PageHeaderBar
      icon={Sparkles}
      tone="primary"
      title="RAG Playground"
      actions={
        <>
          {keyReady && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" /> API key ready
            </span>
          )}
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5 h-8 text-xs">
              <RefreshCw className="w-3 h-3" /> New chat
            </Button>
          )}
        </>
      }
    />,
    [keyReady, messages.length],
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto p-6 pt-4">
      {/* Key error */}
      {keyError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {keyError}
          <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs" onClick={resetKey}>Retry</Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold mb-1">Ask anything about your knowledge base</p>
            <p className="text-sm text-muted-foreground mb-6">Your AI will answer using the indexed documents</p>

            {keyReady && (
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); }}
                    className="text-left text-xs bg-card border border-border rounded-xl px-3 py-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}

            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : msg.error
                  ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-tl-sm"
                  : "bg-card border border-border rounded-tl-sm"
              }`}>
                {msg.content}
              </div>

              {msg.role === "assistant" && !msg.error && (
                <div className="px-1 flex flex-wrap gap-2 items-center">
                  {msg.confidence !== undefined && <ConfidenceDot score={msg.confidence} />}
                  {msg.shouldHandoff && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
                      Low confidence — handoff suggested
                    </span>
                  )}
                </div>
              )}

              {msg.sources && msg.sources.length > 0 && (
                <div className="px-1 w-full">
                  <SourcesPanel sources={msg.sources} />
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 mt-4">
        <div className="flex gap-2 items-end bg-card border border-border rounded-2xl px-4 py-3 focus-within:border-primary/50 transition-colors shadow-sm">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={keyReady ? "Ask a question about your knowledge base… (Enter to send)" : "Setting up API key…"}
            disabled={!keyReady || loading}
            rows={1}
            className="flex-1 border-0 shadow-none focus-visible:ring-0 resize-none p-0 min-h-0 text-sm"
          />
          <Button
            onClick={send}
            disabled={!input.trim() || !keyReady || loading}
            size="icon"
            className="h-8 w-8 flex-shrink-0 rounded-xl"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-center text-[11px] text-muted-foreground mt-2">
          Gemini 2.0 Flash · Voyage AI reranking · {conversationId ? "conversation active" : "new conversation"}
        </p>
      </div>
    </div>
  );
}
