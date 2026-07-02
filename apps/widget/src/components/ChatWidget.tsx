import { useEffect, useRef, useState } from "react";
import { animate } from "@motionone/dom";
import type { WidgetConfig, ChatMsg, FlowNode, FlowEdge } from "../types";
import { renderMarkdown, MARKDOWN_CSS } from "../lib/markdown";
import { FlowCollectForm } from "./FlowCollectForm";

// Rich, sanitized markdown for bot messages (marked + DOMPurify + highlight.js)
function BotMarkdown({ text, fontSize = "14px" }: { text: string; fontSize?: string }) {
  return <div className="ab-md" style={{ fontSize }} dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />;
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const Icons = {
  X: ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Send: ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></svg>,
  Chevron: ({ s = 16, dir = "down" }: { s?: number; dir?: "up" | "down" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === "up" ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9" /></svg>,
  Chat: ({ s = 20 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
  Home: ({ s = 20 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  Book: ({ s = 20 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>,
  ChevronRight: ({ s = 16 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>,
  Mic: ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>,
};

// ── Notification sound ────────────────────────────────────────────────────────
function playSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

// ── Color helpers ─────────────────────────────────────────────────────────────
function isLight(hex: string) {
  const c = (hex || "#ffffff").replace("#", "");
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}
function shade(hex: string, amt: number) {
  const c = (hex || "#000000").replace("#", "");
  let r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  r = Math.max(0, Math.min(255, r + amt)); g = Math.max(0, Math.min(255, g + amt)); b = Math.max(0, Math.min(255, b + amt));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

interface TC {
  headerBg: string; headerText: string; chatBg: string;
  botBg: string; botText: string; userBg: string; userText: string;
  accent: string; launcherBg: string; launcherIconUrl: string | null;
  radius: number; fontSize: string; showTimestamps: boolean;
}

// ── Main component ────────────────────────────────────────────────────────────
export function ChatWidget({ apiKey, apiUrl = "http://localhost:4000/api" }: { apiKey: string; apiUrl?: string }) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [tc, setTc] = useState<Partial<TC> | null>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"home" | "chat" | "help">("chat");
  const [proactiveBubbles, setProactiveBubbles] = useState<string[]>([]);
  const [showQR, setShowQR] = useState(true);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [flowId, setFlowId] = useState<string | null>(null);
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([]);
  const [flowEdges, setFlowEdges] = useState<FlowEdge[]>([]);
  const [flowCurrentId, setFlowCurrentId] = useState<string | null>(null);
  const [flowAnswers, setFlowAnswers] = useState<Record<string, string>>({});
  const [flowDone, setFlowDone] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);

  // Motion One — premium spring entrance for the panel
  useEffect(() => {
    if (open && panelRef.current) {
      animate(
        panelRef.current,
        { opacity: [0, 1], transform: ["translateY(20px) scale(.96)", "translateY(0) scale(1)"] },
        { duration: 0.42, easing: [0.34, 1.56, 0.64, 1] },
      );
    }
  }, [open]);

  // Inject keyframes + base styles into the widget's root (Shadow DOM when present)
  useEffect(() => {
    const node = rootRef.current?.getRootNode();
    const target: ParentNode = node instanceof ShadowRoot ? node : document.head;
    const s = document.createElement("style");
    s.textContent = `
      @keyframes ab-pop{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}
      @keyframes ab-bubble{0%{opacity:0;transform:translateX(28px) scale(.85)}60%{opacity:1}100%{opacity:1;transform:none}}
      @keyframes ab-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
      @keyframes ab-panel{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}
      @keyframes ab-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}
      @keyframes ab-spin{to{transform:rotate(360deg)}}
      @keyframes ab-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
      @keyframes ab-mic{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)}50%{box-shadow:0 0 0 6px rgba(239,68,68,0)}}
      :host{all:initial}
      ${MARKDOWN_CSS}
      #askbase-widget-root,#askbase-widget-root *{box-sizing:border-box;font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
      #askbase-widget-root button{appearance:none;-webkit-appearance:none;font:inherit}
      #askbase-widget-root .ab-scroll::-webkit-scrollbar{width:6px;height:6px}
      #askbase-widget-root .ab-scroll::-webkit-scrollbar-thumb{background:rgba(0,0,0,.14);border-radius:999px}
      #askbase-widget-root .ab-scroll::-webkit-scrollbar-track{background:transparent}
      #askbase-widget-root .ab-hscroll::-webkit-scrollbar{display:none}
      #askbase-widget-root input::placeholder,#askbase-widget-root textarea::placeholder{color:currentColor;opacity:.55}
    `;
    target.appendChild(s);
    return () => { s.remove(); };
  }, []);

  // Load config + theme (localStorage cache → instant; fresh fetch in background)
  useEffect(() => {
    if (!apiKey) return;
    const cacheKey = `askbase_cfg_${apiKey}`;

    function applyTheme(d: any) {
      if (!d?.theme) return;
      setTc({
        headerBg: d.theme.headerBg ?? d.primaryColor,
        headerText: d.theme.headerText ?? "#ffffff",
        chatBg: d.theme.chatBg ?? "#f8fafc",
        botBg: d.theme.botBg ?? "#ffffff",
        botText: d.theme.botText ?? "#1e293b",
        userBg: d.theme.userBg ?? d.primaryColor,
        userText: d.theme.userText ?? "#ffffff",
        accent: d.theme.accent ?? d.primaryColor,
        launcherBg: d.theme.launcherBg ?? d.primaryColor,
        launcherIconUrl: d.theme.launcherIconUrl ?? null,
        radius: parseInt(String(d.theme.radius), 10) || 18, // API sends "16px" → 16
        fontSize: d.theme.fontSize ?? "14px",
        showTimestamps: d.theme.showTimestamps ?? false,
      });
    }

    // 1. Hydrate instantly from cache if present
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) { const d = JSON.parse(cached); setConfig(d); applyTheme(d); }
    } catch {}

    // 2. Always refresh in the background
    fetch(`${apiUrl}/knowledge/config/public`, { headers: { "x-api-key": apiKey } })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        const d = data?.data ?? data;
        if (!d) throw new Error();
        setConfig(d); applyTheme(d);
        try { localStorage.setItem(cacheKey, JSON.stringify(d)); } catch {}
      })
      .catch(() => { if (!config) setLoadError(true); });
  }, [apiKey, apiUrl]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, sending]);

  const cfg = config;
  const C: TC = {
    headerBg: tc?.headerBg ?? cfg?.primaryColor ?? "#4f46e5",
    headerText: tc?.headerText ?? "#ffffff",
    chatBg: tc?.chatBg ?? "#f8fafc",
    botBg: tc?.botBg ?? "#ffffff",
    botText: tc?.botText ?? "#1e293b",
    userBg: tc?.userBg ?? cfg?.primaryColor ?? "#4f46e5",
    userText: tc?.userText ?? "#ffffff",
    accent: tc?.accent ?? cfg?.primaryColor ?? "#4f46e5",
    launcherBg: tc?.launcherBg ?? cfg?.primaryColor ?? "#4f46e5",
    launcherIconUrl: tc?.launcherIconUrl ?? null,
    radius: tc?.radius ?? 18,
    fontSize: tc?.fontSize ?? "14px",
    showTimestamps: tc?.showTimestamps ?? false,
  };

  // Chrome colors derived from chatBg so the shell matches the theme
  const light = isLight(C.chatBg);
  const surface = light ? "#ffffff" : shade(C.chatBg, 14);
  const borderColor = light ? "#eceef2" : "rgba(255,255,255,0.08)";
  const mutedText = light ? "#8a93a3" : "rgba(255,255,255,0.5)";
  const foreground = light ? "#1a1f29" : "#f4f6fa";
  const inputBg = light ? "#f4f5f7" : "rgba(255,255,255,0.06)";
  const headerGrad = `linear-gradient(135deg, ${shade(C.headerBg, 18)} 0%, ${C.headerBg} 60%, ${shade(C.headerBg, -16)} 100%)`;

  const pos: React.CSSProperties = cfg?.widgetPosition === "bottom-left" ? { left: 24 } : { right: 24 };
  const inFlow = !!flowId && !flowDone;
  const loading = !config && !loadError;

  const starters = (cfg?.conversationStarters ?? []).filter(s => s.label?.trim());
  const qr = (cfg?.widgetQuickReplies ?? []).filter(q => q.label?.trim());
  const articles = (cfg?.helpArticles ?? []).filter(a => a.title?.trim());
  const tabs = [
    { id: "chat" as const, label: "Messages", Icon: Icons.Chat },
    { id: "home" as const, label: "Home", Icon: Icons.Home },
    ...(cfg?.showHelpCenter ? [{ id: "help" as const, label: "Help", Icon: Icons.Book }] : []),
  ];

  function addBotMsg(content: string, choices?: ChatMsg["choices"]) {
    setMsgs(p => [...p, { id: crypto.randomUUID(), role: "bot", content, choices }]);
  }

  function scheduleProactive(messages: Array<{ text: string; delaySeconds: number }>, repeat: boolean) {
    timersRef.current.forEach(clearTimeout); timersRef.current = [];
    if (cycleRef.current) clearTimeout(cycleRef.current);
    messages.forEach(({ text, delaySeconds }) => {
      const t = setTimeout(() => { setProactiveBubbles(p => [...p, text]); playSound(); }, delaySeconds * 1000);
      timersRef.current.push(t);
    });
    if (repeat && messages.length > 0) {
      const last = Math.max(...messages.map(m => m.delaySeconds));
      cycleRef.current = setTimeout(() => { setProactiveBubbles([]); scheduleProactive(messages, repeat); }, (last + 6) * 1000);
    }
  }

  useEffect(() => {
    const m = cfg?.openingMessages ?? [];
    if (!m.length || open) return;
    scheduleProactive(m, cfg?.repeatMessages ?? false);
    return () => { timersRef.current.forEach(clearTimeout); if (cycleRef.current) clearTimeout(cycleRef.current); };
  }, [cfg?.openingMessages, cfg?.repeatMessages, open]);

  function clearProactive() {
    setProactiveBubbles([]); timersRef.current.forEach(clearTimeout);
    if (cycleRef.current) clearTimeout(cycleRef.current);
  }

  function openWidget() {
    setOpen(true); setTab("chat");
    if (msgs.length === 0) addBotMsg(cfg?.welcomeMessage || "Hi! How can I help?");
    clearProactive();
  }

  function openChat() {
    setTab("chat");
    if (msgs.length === 0) addBotMsg(cfg?.welcomeMessage || "Hi! How can I help?");
  }

  function endFlow() {
    setFlowDone(true); setFlowId(null); setFlowNodes([]); setFlowEdges([]); setFlowCurrentId(null);
  }

  // Walk the flow by following edges from a node, pausing at collect/choice nodes.
  async function runFlowFrom(
    startId: string | null,
    nodes: FlowNode[],
    edges: FlowEdge[],
    answers: Record<string, string>,
    fId: string,
  ) {
    const nextId = (id: string, handle?: string) => {
      // Prefer an edge whose sourceHandle matches (choice branches); else first edge from node
      const matches = edges.filter(e => e.source === id);
      const byHandle = handle ? matches.find(e => e.sourceHandle === handle) : null;
      return (byHandle ?? matches[0])?.target ?? null;
    };

    let id: string | null = startId;
    const guard = new Set<string>(); // prevent infinite loops on cyclic graphs
    while (id && !guard.has(id)) {
      guard.add(id);
      const node = nodes.find(n => n.id === id);
      if (!node) break;
      if (node.type === "collect") {
        setFlowCurrentId(id);
        addBotMsg(node.data.question || `Please enter your ${node.data.fieldName || "answer"}`);
        return;
      }
      if (node.type === "choice") {
        setFlowCurrentId(id);
        setMsgs(p => [...p, { id: crypto.randomUUID(), role: "bot", content: node.data.question || "Choose:", choices: node.data.options ?? [] }]);
        return;
      }
      if (node.type === "message") { addBotMsg(node.data.message || ""); id = nextId(id); continue; }
      if (node.type === "end") { addBotMsg(node.data.message || "Thanks! 🎉"); endFlow(); return; }
      if (["lead_save", "webhook", "google_sheet"].includes(node.type)) {
        try { await fetch(`${apiUrl}/flows/public/${fId}/submit`, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey }, body: JSON.stringify({ data: answers }) }); } catch {}
        id = nextId(id); continue;
      }
      // start / unknown node types → just follow the edge
      id = nextId(id);
    }
    // Exhausted with no interactive node — never leave the user stuck
    endFlow();
  }

  async function startFlow(fId: string) {
    try {
      const res = await fetch(`${apiUrl}/flows/public/${fId}`, { headers: { "x-api-key": apiKey } });
      const data = await res.json(); const d = data?.data ?? data;
      const nodes: FlowNode[] = d.nodes ?? [];
      const edges: FlowEdge[] = d.edges ?? [];
      if (!nodes.length) { addBotMsg("Thanks! Is there anything else I can help with?"); return; }
      setFlowId(fId); setFlowNodes(nodes); setFlowEdges(edges); setFlowAnswers({}); setFlowDone(false); setFlowCurrentId(null);
      const startNode = nodes.find(n => n.type === "start") ?? nodes[0];
      await runFlowFrom(startNode.id, nodes, edges, {}, fId);
    } catch { addBotMsg("Couldn't load that flow. Please try again."); }
  }

  async function send(text?: string) {
    const raw = (text ?? input).trim();
    if (!raw || sending) return;
    if (tab !== "chat") setTab("chat");
    setInput("");
    setMsgs(p => [...p, { id: crypto.randomUUID(), role: "user", content: raw }]);
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ content: raw, conversationId: convId ?? undefined }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json(); const d = data?.data ?? data;
      if (d?.conversationId) setConvId(d.conversationId);
      if (d?.action === "invoke_flow" && d?.flowId) {
        await startFlow(d.flowId);
      } else {
        const reply = (d?.message?.content ?? d?.content ?? "").toString().trim();
        addBotMsg(reply && reply !== "__flow_trigger__"
          ? reply
          : "Sorry, I couldn't generate a response just now. Please try rephrasing or ask again.");
      }
    } catch { addBotMsg("I'm having trouble connecting right now. Please try again in a moment."); }
    finally { setSending(false); }
  }

  async function pickChoice(opt: { id: string; label: string; value: string }) {
    if (!flowId) return;
    const node = flowNodes.find(n => n.id === flowCurrentId);
    setMsgs(p => [...p, { id: crypto.randomUUID(), role: "user", content: opt.label }]);
    const answers = { ...flowAnswers, [node?.data?.fieldName ?? "choice"]: opt.value };
    setFlowAnswers(answers);
    const next = node ? flowEdges.filter(e => e.source === node.id) : [];
    // Branch by option if the edge carries a matching sourceHandle, else the single outgoing edge
    const target = (next.find(e => e.sourceHandle === opt.id || e.sourceHandle === opt.value) ?? next[0])?.target ?? null;
    await runFlowFrom(target, flowNodes, flowEdges, answers, flowId);
  }

  // Submit a validated flow collect value (validation handled in FlowCollectForm via zod)
  function submitFlowValue(value: string) {
    if (sending || !flowId) return;
    const node = flowNodes.find(n => n.id === flowCurrentId);
    if (node?.type !== "collect") return;
    const val = (value ?? "").trim();
    setMsgs(p => [...p, { id: crypto.randomUUID(), role: "user", content: val || "Skipped" }]);
    const answers = { ...flowAnswers, [node.data?.fieldName ?? "answer"]: val };
    setFlowAnswers(answers);
    const target = flowEdges.find(e => e.source === node.id)?.target ?? null;
    runFlowFrom(target, flowNodes, flowEdges, answers, flowId);
  }

  // Voice input via Web Speech API (no library)
  function toggleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (listening) { recognitionRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setInput(txt);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  }

  function Avatar({ size }: { size: number }) {
    const fs = Math.round(size * 0.5);
    return cfg?.botAvatarUrl
      ? <img src={cfg.botAvatarUrl} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
      : <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg, ${shade(C.accent, 30)}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: fs, color: "#fff" }}>{cfg?.botAvatarEmoji ?? "💬"}</div>;
  }

  const currentFlowNode = inFlow ? flowNodes.find(n => n.id === flowCurrentId) ?? null : null;
  const collectNode = currentFlowNode?.type === "collect" ? currentFlowNode : null;
  const inCollect = !!collectNode;
  const awaitingChoice = currentFlowNode?.type === "choice";
  const voiceSupported = typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <div ref={rootRef} style={{ ["--ab-accent" as any]: C.accent }}>
      {/* Proactive bubbles */}
      {!open && proactiveBubbles.length > 0 && (
        <div style={{ position: "fixed", zIndex: 2147483646, bottom: 94, display: "flex", flexDirection: "column", gap: 9, alignItems: "flex-end", maxWidth: 300, ...pos }}>
          {proactiveBubbles.map((text, i) => (
            <button key={i} onClick={openWidget}
              style={{ background: "#fff", border: "none", borderRadius: "18px 18px 5px 18px", padding: "12px 16px", boxShadow: "0 10px 30px -6px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.06)", fontSize: 13.5, fontWeight: 500, color: "#1a1f29", cursor: "pointer", maxWidth: 300, lineHeight: 1.45, fontFamily: "inherit", textAlign: "left", animation: "ab-bubble 0.42s cubic-bezier(.34,1.56,.64,1) both", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; e.currentTarget.style.boxShadow = "0 14px 34px -6px rgba(0,0,0,0.24), 0 2px 6px rgba(0,0,0,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 10px 30px -6px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.06)"; }}>
              {text}
            </button>
          ))}
          <button onClick={clearProactive} aria-label="Dismiss messages"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(17,24,39,0.82)", backdropFilter: "blur(4px)", color: "#fff", border: "none", borderRadius: 999, fontSize: 11.5, fontWeight: 500, padding: "5px 11px 5px 12px", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(0,0,0,0.18)", animation: "ab-fade 0.3s ease both", transition: "background 0.15s ease" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(17,24,39,0.95)")} onMouseLeave={e => (e.currentTarget.style.background = "rgba(17,24,39,0.82)")}>
            Dismiss <Icons.X s={11} />
          </button>
        </div>
      )}

      {/* Spinning halo around the launcher while config loads */}
      {loading && !open && (
        <div aria-hidden style={{ position: "fixed", bottom: 20, zIndex: 2147483646, width: 68, height: 68, borderRadius: "50%", border: `3px solid ${C.launcherBg}2e`, borderTopColor: C.launcherBg, animation: "ab-spin 0.7s linear infinite", pointerEvents: "none", ...(cfg?.widgetPosition === "bottom-left" ? { left: 20 } : { right: 20 }) }} />
      )}

      {/* Launcher FAB */}
      <button
        onClick={() => (open ? setOpen(false) : openWidget())}
        aria-label="Open chat"
        style={{ position: "fixed", bottom: 24, zIndex: 2147483647, width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg, ${shade(C.launcherBg, 24)}, ${C.launcherBg})`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 24px ${C.launcherBg}66, 0 2px 8px rgba(0,0,0,0.18)`, transition: "transform 0.18s cubic-bezier(.34,1.56,.64,1)", color: "#fff", ...pos }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open ? <Icons.X s={22} />
          : C.launcherIconUrl ? <img src={C.launcherIconUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            : <span style={{ fontSize: 26, lineHeight: 1 }}>{cfg?.botAvatarEmoji ?? "💬"}</span>}
        {!open && proactiveBubbles.length > 0 && (
          <span style={{ position: "absolute", top: 0, right: 0, minWidth: 18, height: 18, padding: "0 5px", background: "#ef4444", borderRadius: 999, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>{proactiveBubbles.length}</span>
        )}
      </button>

      {/* Widget panel */}
      {open && (
        <div ref={panelRef} style={{ position: "fixed", bottom: 96, zIndex: 2147483646, width: 384, maxWidth: "calc(100vw - 32px)", height: 620, maxHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 60px -12px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.04)", borderRadius: 20, background: surface, ...pos }}>

        {/* ── Loading state ── */}
        {loading ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#fff" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", border: "3px solid #ececf1", borderTopColor: C.accent, animation: "ab-spin 0.8s linear infinite" }} />
            <p style={{ fontSize: 13, color: "#9aa1ac", margin: 0 }}>Loading…</p>
          </div>
        ) : loadError ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 24, textAlign: "center", background: "#fff" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1a1f29", margin: 0 }}>Couldn't connect</p>
            <p style={{ fontSize: 12.5, color: "#9aa1ac", margin: 0, lineHeight: 1.5 }}>Please check your connection and try again.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 11, padding: "13px 14px 13px 16px", background: headerGrad, flexShrink: 0 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Avatar size={38} />
                <span style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: "#22c55e", border: `2px solid ${C.headerBg}` }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: C.headerText, fontWeight: 700, fontSize: 15, margin: 0, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cfg?.name ?? "Assistant"}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0, animation: "ab-pulse 2s ease-in-out infinite" }} />
                  <span style={{ color: C.headerText, opacity: 0.85, fontSize: 12, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cfg?.botSubtitle || "Online"}</span>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ flexShrink: 0, width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", color: C.headerText, transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")} onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}>
                <Icons.X s={16} />
              </button>
            </div>

            {/* ── HOME TAB ── */}
            {tab === "home" && (
              <div className="ab-scroll" style={{ flex: 1, overflowY: "auto", background: C.chatBg }}>
                <div style={{ padding: "22px 20px 18px" }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: foreground, lineHeight: 1.3, margin: 0, letterSpacing: "-0.01em" }}>{cfg?.homeGreeting || "Hi there 👋"}</p>
                  <p style={{ fontSize: 13.5, color: mutedText, margin: "6px 0 0", lineHeight: 1.45 }}>{cfg?.homeSubgreeting || "How can we help you today?"}</p>
                </div>
                <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={openChat} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "15px 16px", borderRadius: 16, background: `linear-gradient(135deg, ${shade(C.accent, 22)}, ${C.accent})`, color: "#fff", border: "none", cursor: "pointer", fontSize: 14.5, fontWeight: 600, fontFamily: "inherit", boxShadow: `0 6px 16px ${C.accent}40` }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><Icons.Chat s={18} />Start a conversation</span>
                    <Icons.ChevronRight />
                  </button>
                  {starters.length > 0 && <>
                    <p style={{ fontSize: 11, fontWeight: 700, color: mutedText, textTransform: "uppercase", letterSpacing: "0.06em", margin: "10px 0 2px 2px" }}>Popular questions</p>
                    {starters.map((s, i) => (
                      <button key={i} onClick={() => send(s.message || s.label)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%", padding: "13px 15px", borderRadius: 14, background: surface, color: foreground, border: `1px solid ${borderColor}`, cursor: "pointer", fontSize: 13.5, textAlign: "left", fontFamily: "inherit", transition: "border-color 0.15s, transform 0.1s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; }} onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; }}>
                        <span>{s.label}</span><span style={{ color: C.accent, flexShrink: 0 }}><Icons.ChevronRight /></span>
                      </button>
                    ))}
                  </>}
                  {cfg?.showHelpCenter && articles.length > 0 && <>
                    <p style={{ fontSize: 11, fontWeight: 700, color: mutedText, textTransform: "uppercase", letterSpacing: "0.06em", margin: "10px 0 2px 2px" }}>{cfg?.helpCenterTitle || "Help center"}</p>
                    {articles.slice(0, 3).map((a, i) => (
                      <a key={i} href={a.url ?? "#"} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "13px 15px", borderRadius: 14, background: surface, color: foreground, border: `1px solid ${borderColor}`, textDecoration: "none", fontSize: 13.5 }}>
                        <span>{a.title}</span><span style={{ color: C.accent, flexShrink: 0 }}><Icons.ChevronRight /></span>
                      </a>
                    ))}
                  </>}
                </div>
              </div>
            )}

            {/* ── CHAT TAB ── */}
            {tab === "chat" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: C.chatBg }}>
                <div className="ab-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {msgs.length === 0 && (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                      <Avatar size={28} />
                      <div style={{ background: C.botBg, color: C.botText, borderRadius: `${C.radius}px ${C.radius}px ${C.radius}px 5px`, padding: "11px 14px", maxWidth: "82%", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: `1px solid ${borderColor}` }}>
                        <BotMarkdown text={cfg?.welcomeMessage || "Hi! How can I help?"} fontSize={C.fontSize} />
                      </div>
                    </div>
                  )}
                  {msgs.map(m => (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end" }}>
                        {m.role === "bot" && <Avatar size={28} />}
                        <div style={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: "82%", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                          <div style={{
                            padding: "11px 14px", fontSize: C.fontSize, lineHeight: 1.55,
                            ...(m.role === "user"
                              ? { borderRadius: `${C.radius}px ${C.radius}px 5px ${C.radius}px`, background: `linear-gradient(135deg, ${shade(C.userBg, 18)}, ${C.userBg})`, color: C.userText, boxShadow: `0 2px 8px ${C.userBg}33` }
                              : { borderRadius: `${C.radius}px ${C.radius}px ${C.radius}px 5px`, background: C.botBg, color: C.botText, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: `1px solid ${borderColor}` }),
                          }}>
                            {m.role === "bot" ? <BotMarkdown text={m.content} fontSize={C.fontSize} /> : m.content}
                          </div>
                          {C.showTimestamps && <span style={{ fontSize: 10, color: mutedText, padding: "0 4px" }}>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                        </div>
                      </div>
                      {m.choices && m.choices.length > 0 && awaitingChoice && m.id === msgs[msgs.length - 1]?.id && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 36, alignItems: "flex-start" }}>
                          {m.choices.map(opt => (
                            <button key={opt.id} onClick={() => pickChoice(opt)} style={{ textAlign: "left", fontSize: 13, fontWeight: 500, padding: "9px 14px", borderRadius: 999, border: `1.5px solid ${C.accent}`, color: C.accent, background: surface, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.background = surface; e.currentTarget.style.color = C.accent; }}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {sending && (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                      <Avatar size={28} />
                      <div style={{ background: C.botBg, borderRadius: `${C.radius}px ${C.radius}px ${C.radius}px 5px`, padding: "13px 16px", display: "flex", alignItems: "center", gap: 5, border: `1px solid ${borderColor}` }}>
                        {[0, 150, 300].map((d, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, display: "inline-block", animation: `ab-bounce 1.3s ${d}ms infinite` }} />)}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEnd} />
                </div>

                {/* Composer */}
                <div style={{ flexShrink: 0, borderTop: `1px solid ${borderColor}`, background: surface }}>
                  {/* Flow collect input — react-hook-form + zod validation */}
                  {inCollect && collectNode ? (
                    <FlowCollectForm
                      key={collectNode.id}
                      node={collectNode}
                      sending={sending}
                      colors={{ accent: C.accent, border: borderColor, inputBg, fg: foreground, muted: mutedText }}
                      onSubmit={submitFlowValue}
                    />
                  ) : !awaitingChoice && (
                    <>
                      {/* Quick replies — compact chips, collapsible */}
                      {qr.length > 0 && showQR && (
                        <div className="ab-hscroll" style={{ display: "flex", gap: 7, padding: "10px 14px 2px", overflowX: "auto", scrollbarWidth: "none" }}>
                          {qr.map((q, i) => (
                            <button key={i} onClick={() => send(q.label)} style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 500, border: `1.5px solid ${C.accent}40`, color: C.accent, background: light ? C.accent + "0d" : "transparent", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = C.accent; }} onMouseLeave={e => { e.currentTarget.style.background = light ? C.accent + "0d" : "transparent"; e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent + "40"; }}>
                              {q.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Input row */}
                      <div style={{ padding: "8px 14px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                        {qr.length > 0 && (
                          <button onClick={() => setShowQR(v => !v)} aria-label={showQR ? "Hide suggestions" : "Show suggestions"} title={showQR ? "Hide suggestions" : "Show suggestions"} style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: inputBg, border: "none", cursor: "pointer", color: mutedText, transition: "color 0.15s" }}
                            onMouseEnter={e => (e.currentTarget.style.color = C.accent)} onMouseLeave={e => (e.currentTarget.style.color = mutedText)}>
                            <Icons.Chevron s={16} dir={showQR ? "down" : "up"} />
                          </button>
                        )}
                        <div style={{ flex: 1, display: "flex", alignItems: "center", background: inputBg, borderRadius: 999, padding: "3px 4px 3px 16px", border: `1.5px solid transparent`, transition: "border-color 0.15s", minWidth: 0 }}>
                          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={listening ? "Listening…" : (cfg?.inputPlaceholder || "Type your message…")} disabled={sending} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: foreground, fontFamily: "inherit", padding: "8px 0", minWidth: 0 }}
                            onFocus={e => (e.currentTarget.parentElement!.style.borderColor = C.accent)} onBlur={e => (e.currentTarget.parentElement!.style.borderColor = "transparent")} />
                          {voiceSupported && !input.trim() && (
                            <button onClick={toggleVoice} aria-label={listening ? "Stop voice input" : "Voice input"} title={listening ? "Stop" : "Speak"} style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: listening ? "#ef4444" : "transparent", border: "none", cursor: "pointer", color: listening ? "#fff" : mutedText, transition: "color 0.15s, background 0.15s", animation: listening ? "ab-mic 1.2s ease-in-out infinite" : undefined }}
                              onMouseEnter={e => { if (!listening) e.currentTarget.style.color = C.accent; }} onMouseLeave={e => { if (!listening) e.currentTarget.style.color = mutedText; }}>
                              <Icons.Mic s={17} />
                            </button>
                          )}
                          <button onClick={() => send()} disabled={!input.trim() || sending} aria-label="Send" style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `linear-gradient(135deg, ${shade(C.accent, 18)}, ${C.accent})`, border: "none", cursor: input.trim() && !sending ? "pointer" : "default", color: "#fff", opacity: input.trim() && !sending ? 1 : 0.4, transition: "opacity 0.15s, transform 0.1s" }}
                            onMouseEnter={e => { if (input.trim() && !sending) e.currentTarget.style.transform = "scale(1.08)"; }} onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
                            <Icons.Send s={17} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── HELP TAB ── */}
            {tab === "help" && cfg?.showHelpCenter && (
              <div className="ab-scroll" style={{ flex: 1, overflowY: "auto", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 9, background: C.chatBg }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: foreground, margin: "0 0 6px" }}>{cfg?.helpCenterTitle || "Help center"}</p>
                {articles.length === 0
                  ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "56px 0", gap: 10, color: mutedText }}><Icons.Book s={28} /><p style={{ fontSize: 13, margin: 0 }}>No articles yet.</p></div>
                  : articles.map((a, i) => <a key={i} href={a.url ?? "#"} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px 15px", borderRadius: 14, background: surface, color: foreground, border: `1px solid ${borderColor}`, textDecoration: "none", fontSize: 13.5 }}><span>{a.title}</span><span style={{ color: C.accent, flexShrink: 0 }}><Icons.ChevronRight /></span></a>)}
              </div>
            )}

            {/* Footer */}
            {(cfg?.showPoweredBy || cfg?.businessHoursText) && (
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "7px 16px", borderTop: `1px solid ${borderColor}`, background: surface }}>
                {cfg?.businessHoursText
                  ? <span style={{ fontSize: 10.5, color: mutedText, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cfg.businessHoursText}</span>
                  : <span />}
                {cfg?.showPoweredBy && <a href={cfg?.footerLinkUrl || "#"} target={cfg?.footerLinkUrl ? "_blank" : undefined} rel="noopener noreferrer" style={{ fontSize: 10.5, color: mutedText, textDecoration: "none", flexShrink: 0 }}>{cfg?.footerText || "Powered by AskBase"}</a>}
              </div>
            )}

            {/* Tab bar */}
            <div style={{ flexShrink: 0, display: "flex", borderTop: `1px solid ${borderColor}`, background: surface }}>
              {tabs.map(({ id, label, Icon }) => {
                const active = tab === id;
                return (
                  <button key={id} onClick={() => (id === "chat" ? openChat() : setTab(id))}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 0 7px", fontSize: 10, fontWeight: 600, border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", color: active ? C.accent : mutedText, transition: "color 0.15s" }}>
                    <Icon s={17} />{label}
                  </button>
                );
              })}
            </div>
          </>
        )}
        </div>
      )}
    </div>
  );
}
