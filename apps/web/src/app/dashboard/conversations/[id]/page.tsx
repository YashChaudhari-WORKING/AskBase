"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  UserRoundCheck,
  XCircle,
  MessageSquare,
  Bot,
  User,
  Headphones,
  Zap,
  Globe,
  Mail,
  MessageCircle,
  Instagram,
  Calendar,
  Hash,
  Clock,
  Send,
  CornerDownLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  conversationId: string;
  senderType: "customer" | "ai" | "agent";
  content: string;
  confidenceScore: number | null;
  metadata?: { flowId?: string; action?: string } | null;
  createdAt: string;
}

interface FlowLeadData {
  data: Record<string, any>;
  conversation: { role: string; content: string }[];
}

interface ConversationDetail {
  id: string;
  status: "open" | "assigned" | "resolved" | "closed";
  channel: "widget" | "whatsapp" | "email" | "instagram";
  subject: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  customerId: string;
  customerName?: string | null;
  customerEmail?: string | null;
  messages: Message[];
  flowMap?: Record<string, string>;
  flowLeadMap?: Record<string, FlowLeadData>;
}

const STATUS_CONFIG = {
  open:     { label: "Active",   variant: "success" as const,   icon: MessageSquare },
  assigned: { label: "Handoff",  variant: "warning" as const,   icon: UserRoundCheck },
  resolved: { label: "Resolved", variant: "secondary" as const, icon: CheckCircle2 },
  closed:   { label: "Closed",   variant: "outline" as const,   icon: XCircle },
};

const CHANNEL_CONFIG = {
  widget:    { label: "Widget",    icon: MessageCircle },
  whatsapp:  { label: "WhatsApp",  icon: Globe },
  email:     { label: "Email",     icon: Mail },
  instagram: { label: "Instagram", icon: Instagram },
};

function isSystemEvent(content: string) {
  return content.startsWith("__") && content.endsWith("__");
}

function systemEventLabel(msg: Message, flowMap?: Record<string, string>) {
  const inner = msg.content.replace(/^__|__$/g, "");
  if (inner === "flow_trigger") {
    const flowName = msg.metadata?.flowId ? flowMap?.[msg.metadata.flowId] : null;
    return flowName ? `Flow triggered: ${flowName}` : "Flow triggered";
  }
  if (inner === "handoff_triggered") return "Handed off to agent";
  return inner.replace(/_/g, " ");
}

function initials(name?: string | null, email?: string | null) {
  if (name) return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  if (email) return email[0].toUpperCase();
  return "?";
}

function deriveSubject(conv: ConversationDetail): string {
  if (conv.subject) return conv.subject;
  const first = conv.messages.find(m => m.senderType === "customer" && !isSystemEvent(m.content));
  return first ? first.content.slice(0, 60) : "Conversation";
}

export default function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [conv, setConv] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.get(`/chat/${id}`)
      .then(res => setConv(res.data?.data ?? null))
      .catch(() => setConv(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [conv?.messages.length]);

  const sendReply = useCallback(async () => {
    if (!reply.trim() || sending) return;
    const content = reply.trim();
    setReply("");
    setSending(true);

    // Optimistic insert
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: id,
      senderType: "agent",
      content,
      confidenceScore: null,
      createdAt: new Date().toISOString(),
    };
    setConv(prev => prev ? { ...prev, messages: [...prev.messages, tempMsg] } : prev);

    try {
      const res = await api.post(`/chat/${id}/reply`, { content });
      const saved: Message = res.data?.data;
      // Replace temp with real
      setConv(prev => prev ? {
        ...prev,
        messages: prev.messages.map(m => m.id === tempMsg.id ? saved : m),
      } : prev);
    } catch {
      // Remove temp on failure
      setConv(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(m => m.id !== tempMsg.id),
      } : prev);
      setReply(content);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [reply, sending, id]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendReply();
    }
  }

  async function resolve() {
    setResolving(true);
    try {
      await api.post(`/chat/${id}/resolve`, { resolution: "Resolved by agent", saveAsLearned: false });
      setConv(prev => prev ? { ...prev, status: "resolved" } : prev);
    } finally {
      setResolving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)]">
        <div className="w-[30%] border-r border-border p-6 space-y-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <Separator />
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-3 w-full" />)}
        </div>
        <div className="flex-1 p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "" : "justify-end"}`}>
              <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? "w-64" : "w-56"}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!conv) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] flex-col gap-3 text-muted-foreground">
        <MessageSquare className="w-10 h-10 opacity-30" />
        <p className="text-sm">Conversation not found</p>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[conv.status] ?? STATUS_CONFIG.open;
  const channelCfg = CHANNEL_CONFIG[conv.channel] ?? CHANNEL_CONFIG.widget;
  const StatusIcon = statusCfg.icon;
  const ChannelIcon = channelCfg.icon;
  const subject = deriveSubject(conv);
  const canReply = conv.status === "open" || conv.status === "assigned";

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background overflow-hidden">

      {/* ── Left panel 30% ── */}
      <aside className="w-[30%] min-w-[260px] max-w-[340px] border-r border-border flex flex-col bg-card">
        <div className="px-5 pt-5 pb-4 flex-1 overflow-y-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All conversations
          </button>

          {/* Customer */}
          <div className="flex items-start gap-3 mb-5">
            <Avatar className="h-11 w-11 border border-border shrink-0">
              <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
                {initials(conv.customerName, conv.customerEmail)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {conv.customerName ?? conv.customerEmail ?? "Unknown customer"}
              </p>
              {conv.customerEmail && conv.customerName && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.customerEmail}</p>
              )}
              <div className="mt-2">
                <Badge variant={statusCfg.variant} className="gap-1 text-[11px] h-5">
                  <StatusIcon className="w-3 h-3" />
                  {statusCfg.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="mb-4 px-3 py-2.5 bg-muted/50 rounded-lg border border-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Topic</p>
            <p className="text-xs text-foreground leading-relaxed">{subject}</p>
          </div>

          {/* Flow leads — one card per lead */}
          {conv.flowLeadMap && Object.entries(conv.flowLeadMap).map(([msgId, lead]) => {
            const entries = Object.entries(lead.data).filter(([, v]) => v !== null && v !== "");
            if (entries.length === 0) return null;
            return (
              <div key={msgId} className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-3">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> Lead
                  </p>
                  <span className="text-[10px] font-mono text-muted-foreground/50">#{msgId.slice(0, 8)}</span>
                </div>
                <div className="space-y-1.5">
                  {entries.map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                      <span className="text-xs text-foreground font-medium break-words">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <Separator className="mb-4" />

          {/* Metadata */}
          <div className="space-y-2.5 text-xs text-muted-foreground">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-3">Details</p>
            <div className="flex items-center gap-2.5">
              <Hash className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono text-foreground/60">{conv.id.slice(0, 16)}…</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ChannelIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{channelCfg.label}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{format(new Date(conv.createdAt), "MMM d, yyyy · HH:mm")}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Active {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>{conv.messages.length} messages</span>
            </div>
          </div>
        </div>

        <Separator />
        <div className="px-5 py-4 space-y-2">
          {canReply && (
            <Button size="sm" className="w-full h-8 text-xs" onClick={resolve} disabled={resolving} variant="outline">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              {resolving ? "Resolving…" : "Mark as resolved"}
            </Button>
          )}
          {conv.status === "resolved" && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resolved {conv.resolvedAt ? formatDistanceToNow(new Date(conv.resolvedAt), { addSuffix: true }) : ""}
            </div>
          )}
        </div>
      </aside>

      {/* ── Right panel 70% ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-3 border-b border-border bg-card/60 backdrop-blur-sm shrink-0 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{subject}</p>
            <p className="text-[11px] text-muted-foreground font-mono">#{conv.id.slice(0, 8)}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <span className="flex items-center gap-1"><Bot className="w-3.5 h-3.5 text-primary" /> AI</span>
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Customer</span>
            {conv.messages.some(m => m.senderType === "agent") && (
              <span className="flex items-center gap-1"><Headphones className="w-3.5 h-3.5 text-blue-500" /> Agent</span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1">
          {conv.messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No messages yet.
            </div>
          )}

          {conv.messages.map((msg, idx) => {
            if (isSystemEvent(msg.content)) {
              return (
                <div key={msg.id} className="flex items-center justify-center py-3">
                  <div className="flex items-center gap-1.5 bg-muted/50 border border-border/60 text-muted-foreground text-[11px] font-medium rounded-full px-3.5 py-1.5">
                    <Zap className="w-3 h-3 text-amber-500" />
                    {systemEventLabel(msg, conv.flowMap)}
                    <span className="opacity-40 ml-1">{format(new Date(msg.createdAt), "HH:mm")}</span>
                  </div>
                </div>
              );
            }

            const isCustomer = msg.senderType === "customer";
            const isAI = msg.senderType === "ai";
            const isAgent = msg.senderType === "agent";

            const prevMsg = conv.messages[idx - 1];
            const isSameSender =
              prevMsg &&
              prevMsg.senderType === msg.senderType &&
              !isSystemEvent(prevMsg.content) &&
              new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 90_000;

            const nextMsg = conv.messages[idx + 1];
            const isLast =
              !nextMsg ||
              nextMsg.senderType !== msg.senderType ||
              isSystemEvent(nextMsg.content) ||
              new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() >= 90_000;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${isCustomer ? "justify-start" : "justify-end"} ${isSameSender ? "mt-0.5" : "mt-5"}`}
              >
                {/* Customer avatar */}
                {isCustomer && (
                  <div className={`w-7 shrink-0 ${isLast ? "opacity-100" : "opacity-0"}`}>
                    <Avatar className="h-7 w-7 border border-border">
                      <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                        {initials(conv.customerName, conv.customerEmail)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                {/* Bubble */}
                <div className={`flex flex-col gap-1 max-w-[66%] ${isCustomer ? "items-start" : "items-end"}`}>
                  {/* Sender label on first in group */}
                  {!isSameSender && !isCustomer && (
                    <span className={`text-[10px] font-semibold px-1 ${isAI ? "text-primary/70" : "text-blue-500/80"}`}>
                      {isAI ? "AI Assistant" : "Agent"}
                    </span>
                  )}

                  <div className={`
                    px-4 py-2.5 text-sm leading-relaxed select-text
                    ${isCustomer
                      ? "bg-card border border-border text-foreground rounded-2xl rounded-bl-[4px]"
                      : isAI
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-[4px]"
                        : "bg-blue-600 text-white rounded-2xl rounded-br-[4px]"
                    }
                    ${msg.id.startsWith("temp-") ? "opacity-60" : "opacity-100"}
                  `}>
                    {msg.content}
                  </div>

                  {isLast && (
                    <div className={`flex items-center gap-1.5 px-1 ${isCustomer ? "" : "flex-row-reverse"}`}>
                      <span className="text-[10px] text-muted-foreground/50">
                        {format(new Date(msg.createdAt), "HH:mm")}
                      </span>
                      {isAI && msg.confidenceScore != null && (
                        <span className="text-[10px] text-muted-foreground/40">
                          {Math.round(msg.confidenceScore * 100)}% confidence
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* AI / agent avatar */}
                {!isCustomer && (
                  <div className={`w-7 shrink-0 ${isLast ? "opacity-100" : "opacity-0"}`}>
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center border border-border
                      ${isAI ? "bg-primary/10" : "bg-blue-500/10"}`}>
                      {isAI
                        ? <Bot className="w-3.5 h-3.5 text-primary" />
                        : <Headphones className="w-3.5 h-3.5 text-blue-500" />
                      }
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div ref={bottomRef} className="h-2" />
        </div>

        {/* Reply input */}
        {canReply ? (
          <div className="border-t border-border bg-card/60 px-4 py-3">
            <div className="relative flex items-end gap-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Reply to customer… (Ctrl+Enter to send)"
                  rows={1}
                  className="resize-none min-h-[40px] max-h-[120px] pr-4 text-sm py-2.5 overflow-y-auto"
                  style={{ height: "auto" }}
                  onInput={e => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = Math.min(t.scrollHeight, 120) + "px";
                  }}
                />
              </div>
              <Button
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={sendReply}
                disabled={!reply.trim() || sending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-1.5 flex items-center gap-1">
              <CornerDownLeft className="w-2.5 h-2.5" /> Ctrl+Enter to send
            </p>
          </div>
        ) : (
          <div className="border-t border-border bg-muted/30 px-4 py-3 flex items-center justify-center">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              This conversation is {conv.status} — no further replies
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
