"use client";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { io } from "socket.io-client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Send, UserCheck, CheckCircle, Bot, User, Headphones } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { usePageHeader } from "@/components/dashboard/page-header";
import { PageHeaderBar } from "@/components/dashboard/page-header-bar";

interface QueueItem {
  handoffs: { id: string; conversationId: string; reason: string; status: string; createdAt: string };
  conversations: { id: string; status: string; customerId: string };
}

interface Message {
  id: string;
  senderType: "customer" | "ai" | "agent";
  content: string;
  createdAt: string;
  confidenceScore?: number;
}

const senderIcon = { customer: User, ai: Bot, agent: Headphones };
const senderBubble: Record<string, string> = {
  customer: "bg-muted",
  ai: "bg-primary/10",
  agent: "bg-green-50 dark:bg-green-500/10 text-green-900 dark:text-green-400",
};

export default function ConsolePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  async function loadQueue() {
    try {
      const res = await api.get("/console/queue");
      setQueue(res.data.data ?? []);
    } catch {
      setQueue([]);
    }
  }

  useEffect(() => { loadQueue(); }, []);

  async function openConversation(convId: string) {
    setActiveConvId(convId);
    setAccepted(false);
    setMessages([]);
    try {
      const res = await api.get(`/chat/${convId}`);
      setMessages(res.data.data?.messages ?? []);
    } catch { /* empty */ }

    if (socketRef.current) socketRef.current.disconnect();
    const socket = io(
      (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace("/api", ""),
      { auth: { token: localStorage.getItem("access_token") } }
    );
    socket.emit("join:conversation", convId);
    socket.on("message:new", (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });
    socketRef.current = socket;
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function acceptHandoff() {
    if (!activeConvId) return;
    await api.post(`/console/${activeConvId}/accept`);
    setAccepted(true);
  }

  async function sendMessage() {
    if (!draft.trim() || !activeConvId) return;
    setSending(true);
    try {
      await api.post(`/console/${activeConvId}/message`, { content: draft });
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  async function resolve() {
    if (!activeConvId) return;
    const resolution = prompt("Enter resolution note (optional — save as learned response):");
    const saveAsLearned = !!resolution && confirm("Save this as a learned response?");
    await api.post(`/console/${activeConvId}/resolve`, { resolution, saveAsLearned });
    if (socketRef.current) socketRef.current.disconnect();
    setActiveConvId(null);
    setMessages([]);
    await loadQueue();
  }

  usePageHeader(
    <PageHeaderBar
      icon={Headphones}
      tone="rose"
      title="Live Console"
      stats={[{ icon: Headphones, value: queue.length, label: "in queue", tone: queue.length > 0 ? "rose" : "muted" }]}
    />,
    [queue.length],
  );

  return (
    <div className="p-6 pt-4 h-full flex flex-col">
      <div className="flex-1 grid grid-cols-[280px_1fr] gap-4 min-h-0">
        {/* Queue panel */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              Handoff Queue
              <Badge variant="secondary">{queue.length}</Badge>
            </CardTitle>
          </CardHeader>
          <Separator />
          <div className="flex-1 overflow-y-auto">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
                <CheckCircle className="w-8 h-8 mb-2 text-green-400" />
                All clear
              </div>
            ) : queue.map(item => (
              <button key={item.handoffs.id}
                onClick={() => openConversation(item.handoffs.conversationId)}
                className={[
                  "w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b last:border-0",
                  activeConvId === item.handoffs.conversationId ? "bg-primary/5 border-l-2 border-l-primary" : "",
                ].join(" ")}>
                <div className="font-medium text-sm">{item.handoffs.conversationId.slice(0, 8)}...</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{item.handoffs.reason}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(item.handoffs.createdAt), { addSuffix: true })}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Conversation panel */}
        <Card className="flex flex-col overflow-hidden">
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Headphones className="w-12 h-12 mb-3 opacity-30" />
              <p>Select a conversation from the queue</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="text-sm font-medium">Conv: {activeConvId.slice(0, 8)}...</div>
                <div className="flex gap-2">
                  {!accepted && (
                    <Button size="sm" variant="outline" onClick={acceptHandoff}>
                      <UserCheck className="w-3 h-3 mr-1" />Accept
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={resolve}
                    className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/30 hover:bg-green-50 dark:hover:bg-green-500/10">
                    <CheckCircle className="w-3 h-3 mr-1" />Resolve
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => {
                  const Icon = senderIcon[msg.senderType];
                  const isCustomer = msg.senderType === "customer";
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isCustomer ? "" : "flex-row-reverse"}`}>
                      <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                        <AvatarFallback className="bg-muted">
                          <Icon className="w-3 h-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${senderBubble[msg.senderType]}`}>
                        <p>{msg.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {accepted && (
                <div className="border-t p-3 flex gap-2">
                  <Textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder="Type your message..."
                    className="resize-none text-sm"
                    rows={2}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button size="icon" onClick={sendMessage} disabled={sending || !draft.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
