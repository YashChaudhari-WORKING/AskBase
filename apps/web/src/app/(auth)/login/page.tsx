"use client";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@askbase/shared";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { SignalAnimation, SignalLogo } from "@/components/signal-animation";
import { toast } from "sonner";

type Msg = { role: "user" | "bot"; text: string };

const SCRIPT: Array<Msg & { typingMs?: number }> = [
  { role: "user", text: "What did I miss?" },
  { role: "bot",  text: "312 customers got instant answers while you were away. 4 went to your team. Zero waited more than 8 seconds.", typingMs: 1400 },
  { role: "user", text: "Which question came up the most?" },
  { role: "bot",  text: '"How do I cancel?" — 28 times. Want me to flag it? A better cancellation doc could deflect that entirely.', typingMs: 1600 },
  { role: "user", text: "Yeah, let's sort that out." },
  { role: "bot",  text: "Already noted. I'll surface it the moment you're in. See you inside 👋", typingMs: 1000 },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3.5 py-2.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-indigo-400/50"
          style={{ animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [serverError, setServerError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  useEffect(() => {
    api.get("/auth/me")
      .then(() => router.replace("/dashboard"))
      .catch(() => setAuthChecking(false));
  }, [router]);

  useEffect(() => {
    if (authChecking) return;
    const t = setTimeout(() => setShowChat(true), 5400);
    return () => clearTimeout(t);
  }, [authChecking]);

  useEffect(() => {
    if (!showChat || started.current) return;
    started.current = true;
    let delay = 600;
    SCRIPT.forEach(({ role, text, typingMs }) => {
      if (role === "user") {
        setTimeout(() => setMessages(prev => [...prev, { role, text }]), delay);
        delay += 700;
      } else {
        setTimeout(() => setIsTyping(true), delay);
        delay += typingMs ?? 1400;
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, { role, text }]);
        }, delay);
        delay += 900;
      }
    });
  }, [showChat]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  async function onSubmit(data: LoginInput) {
    try {
      setServerError("");
      const tid = toast.loading("Signing in…");
      await api.post("/auth/login", data);
      toast.success("Welcome back!", { id: tid, description: "Taking you to your workspace…" });
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.error ?? "Invalid email or password";
      setServerError(msg);
      toast.error("Sign in failed", { description: msg });
    }
  }

  if (authChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <SignalAnimation className="w-[220px] h-[220px]" />
        <div className="auth-logo-row mt-2">
          <SignalLogo size={22} />
          <span className="auth-logo-text">AskBase</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: .35 }
          30%            { transform: translateY(-3px); opacity: 1 }
        }
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-in { animation: msg-in .25s ease-out both; }
        @keyframes chat-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .chat-fade { animation: chat-fade .6s ease-out both; }
      `}</style>

      <div className="auth-page">

        {/* logo */}
        <div className="auth-logo-row">
          <SignalLogo size={24} />
          <span className="auth-logo-text">AskBase</span>
        </div>

        {/* card */}
        <div className="auth-card" style={{ maxWidth: "860px" }}>

          {/* left panel — chat demo */}
          <div className="auth-panel-left" style={{ width: "400px", minHeight: "500px" }}>
            <div className="auth-panel-glow" />

            {/* animation layer */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center z-10 transition-opacity duration-700"
              style={{ opacity: showChat ? 0 : 1, pointerEvents: "none" }}
            >
              <SignalAnimation className="w-[260px] h-[260px]" />
              <p className="mt-6 text-white/15 text-[9px] tracking-[0.28em] uppercase font-light">
                Your knowledge · Instantly answered
              </p>
            </div>

            {/* chat layer */}
            <div
              className="absolute inset-0 flex flex-col z-20 transition-opacity duration-700"
              style={{ opacity: showChat ? 1 : 0, pointerEvents: showChat ? "auto" : "none" }}
            >
              {/* chat header */}
              <div className="flex items-center gap-2.5 px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
                  <SignalLogo size={16} />
                </div>
                <div>
                  <p className="text-white/75 text-[13px] font-semibold">AskBase AI</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-white/28 text-[10px]">while you were away</span>
                  </div>
                </div>
              </div>

              {/* messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5" style={{ scrollbarWidth: "none" }}>
                {messages.map((m, i) => (
                  <div key={i} className={`msg-in flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[88%] px-3.5 py-2.5 text-[12px] leading-relaxed"
                      style={m.role === "user"
                        ? { background: "rgba(99,102,241,0.18)", color: "rgba(255,255,255,0.82)", borderRadius: "14px 14px 3px 14px" }
                        : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px 14px 14px 3px" }
                      }
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="msg-in flex justify-start">
                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px 14px 14px 3px" }}>
                      <TypingDots />
                    </div>
                  </div>
                )}
              </div>

              {/* input bar (decorative) */}
              <div className="px-4 pb-4 pt-2">
                <div className="h-9 rounded-lg flex items-center px-3 gap-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span className="text-white/18 text-[12px] flex-1">Ask anything…</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400/35" />
                </div>
              </div>
            </div>
          </div>

          {/* right: form */}
          <div className="auth-panel-right">
            <div className="w-full" style={{ maxWidth: "310px" }}>

              <div className="mb-6">
                <h1 className="auth-heading">Welcome back</h1>
                <p className="auth-subheading">Sign in to your workspace</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">

                <div>
                  <label className="auth-label">Email</label>
                  <input type="email" className="auth-input" placeholder="you@company.com" {...register("email")} />
                  {errors.email && <p className="auth-error">{errors.email.message}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="auth-label" style={{ marginBottom: 0 }}>Password</label>
                    <button type="button" className="text-[10px] text-indigo-400/60 hover:text-indigo-300 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      className="auth-input pr-10"
                      placeholder="••••••••"
                      {...register("password")}
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && <p className="auth-error">{errors.password.message}</p>}
                </div>

                {serverError && (
                  <div className="rounded-lg px-3.5 py-2.5 text-[12px]"
                    style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", color: "rgba(248,113,113,0.85)" }}>
                    {serverError}
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="auth-btn mt-1">
                  {isSubmitting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Signing in…</>
                    : <>Sign in <ArrowRight className="w-3.5 h-3.5" /></>
                  }
                </button>
              </form>

              <p className="auth-divider mt-4">
                No account?{" "}
                <Link href="/register" className="auth-link font-semibold">Create one free</Link>
              </p>

            </div>
          </div>
        </div>

        <p className="text-white/10 text-[11px] mt-6">© 2026 AskBase · All rights reserved</p>
      </div>
    </>
  );
}
