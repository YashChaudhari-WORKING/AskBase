"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useSocket } from "@/providers/socket-provider";
import api from "@/lib/api";
import { GripHorizontal, ChevronDown, X, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveConv {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  subject: string | null;
  lastMessage: { preview: string; senderType: string } | null;
  activeAt: number;
}

function initials(c: LiveConv) {
  const n = c.customerName ?? c.customerEmail?.split("@")[0] ?? "?";
  return n.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

function displayName(c: LiveConv) {
  if (c.customerName) return c.customerName;
  if (c.customerEmail) return c.customerEmail.split("@")[0];
  return "Visitor";
}

function shortTime(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 10) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

export function LiveConversationsWidget() {
  const router = useRouter();
  const socket = useSocket();
  const [liveConvs, setLiveConvs] = useState<LiveConv[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onActive = async (data: { conversationId: string; subject?: string }) => {
      try {
        const res = await api.get(`/chat/${data.conversationId}`);
        const conv = res.data?.data;
        if (!conv) return;
        setLiveConvs(prev => {
          if (prev.find(c => c.id === data.conversationId)) return prev;
          const msgs = (conv.messages ?? []).filter((m: any) => !m.content.startsWith("__"));
          const last = msgs.slice(-1)[0];
          return [{
            id: data.conversationId,
            customerName: conv.customerName ?? null,
            customerEmail: conv.customerEmail ?? null,
            subject: conv.subject ?? data.subject ?? null,
            lastMessage: last ? { preview: last.content.slice(0, 60), senderType: last.senderType } : null,
            activeAt: Date.now(),
          }, ...prev];
        });
      } catch { }
    };

    const onInactive = (data: { conversationId: string }) => {
      setLiveConvs(prev => prev.filter(c => c.id !== data.conversationId));
    };

    socket.on("conversation:active", onActive);
    socket.on("conversation:inactive", onInactive);
    return () => {
      socket.off("conversation:active", onActive);
      socket.off("conversation:inactive", onInactive);
    };
  }, [socket]);

  const count = liveConvs.length;

  // Re-surface when a new customer goes live (even after dismissal)
  useEffect(() => {
    if (count > 0) setDismissed(false);
  }, [count]);

  // Hide when no one is online or user dismissed
  if (count === 0 || dismissed) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      // Positioned just below the notification bell (bell is at top-3 right-4 inside main with p-2 outer padding)
      className="fixed z-50"
      style={{
        top: "58px",
        right: "24px",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <motion.div
        animate={{ width: collapsed ? 180 : 256 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 px-3 py-2 cursor-grab active:cursor-grabbing">
          <GripHorizontal className="w-3 h-3 text-muted-foreground/30 shrink-0" />

          {/* Live indicator */}
          <span className="relative flex h-[7px] w-[7px] shrink-0 ml-0.5">
            {count > 0 && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70" />
            )}
            <span className={cn(
              "relative inline-flex rounded-full h-[7px] w-[7px]",
              count > 0 ? "bg-emerald-500" : "bg-muted-foreground/30"
            )} />
          </span>

          <span className="text-[12px] font-semibold text-foreground">Live</span>

          <span className="text-[11px] text-muted-foreground">
            {count === 0 ? "No one online" : `${count} online`}
          </span>

          {count > 0 && (
            <span className="ml-auto shrink-0 text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full px-1.5 py-0.5 leading-none">
              {count}
            </span>
          )}

          <div className="flex items-center gap-0.5 ml-auto shrink-0">
            <button
              onClick={() => setCollapsed(v => !v)}
              className="p-1 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <motion.div
                animate={{ rotate: collapsed ? -90 : 0 }}
                transition={{ duration: 0.18 }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="h-px bg-border" />

              {count === 0 ? (
                <div className="flex flex-col items-center justify-center py-7 gap-2 text-muted-foreground">
                  <Wifi className="w-5 h-5 opacity-20" />
                  <p className="text-[11px]">Waiting for customers…</p>
                </div>
              ) : (
                <div className="max-h-[260px] overflow-y-auto">
                  <AnimatePresence>
                    {liveConvs.map((conv, i) => (
                      <motion.button
                        key={conv.id}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, scale: 0.97 }}
                        transition={{ duration: 0.14, delay: i * 0.02 }}
                        onClick={() => router.push(`/dashboard/conversations/${conv.id}`)}
                        className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors flex items-start gap-2.5"
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center border border-border">
                            <span className="text-[10px] font-bold text-primary leading-none">
                              {initials(conv)}
                            </span>
                          </div>
                          <span className="absolute -bottom-px -right-px flex h-[9px] w-[9px]">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                            <span className="relative inline-flex rounded-full h-[9px] w-[9px] bg-emerald-500 ring-2 ring-card" />
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-1">
                            <span className="text-[12px] font-semibold text-foreground truncate leading-none">
                              {displayName(conv)}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {shortTime(conv.activeAt)}
                            </span>
                          </div>
                          {(conv.subject || conv.lastMessage) && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {conv.lastMessage?.preview ?? conv.subject}
                            </p>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              <div className="h-px bg-border" />
              <button
                onClick={() => router.push("/dashboard/conversations")}
                className="w-full py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                All conversations →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
