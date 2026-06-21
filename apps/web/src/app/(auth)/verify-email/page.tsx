"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignalLogo } from "@/components/signal-animation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

type State = "verifying" | "success" | "error";

function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<State>("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setState("error"); setErrorMsg("No verification token found."); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => { setState("success"); setTimeout(() => router.push("/dashboard"), 2500); })
      .catch((err) => { setState("error"); setErrorMsg(err.response?.data?.error ?? "Verification failed. The link may have expired."); });
  }, []);

  return (
    <div
      className="w-full max-w-sm flex flex-col items-center text-center gap-5 rounded-2xl p-10"
      style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {state === "verifying" && (
        <><Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        <div><p className="auth-heading">Verifying your email…</p><p className="auth-subheading mt-1">Just a moment.</p></div></>
      )}
      {state === "success" && (
        <><div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-emerald-400" /></div>
        <div><p className="auth-heading">Email verified</p><p className="auth-subheading mt-1">Taking you to your dashboard…</p></div></>
      )}
      {state === "error" && (
        <><div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <XCircle className="w-6 h-6 text-red-400" /></div>
        <div><p className="auth-heading">Verification failed</p><p className="auth-subheading mt-1">{errorMsg}</p></div>
        <Link href="/register" className="auth-btn" style={{ textDecoration: "none", maxWidth: "200px" }}>Register again</Link></>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="auth-page">
      <div className="auth-logo-row">
        <SignalLogo size={24} />
        <span className="auth-logo-text">AskBase</span>
      </div>
      <Suspense fallback={<Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
