"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterTenantSchema, type RegisterTenantInput } from "@askbase/shared";
import api from "@/lib/api";
import Link from "next/link";
import { ArrowRight, Loader2, Eye, EyeOff, Mail } from "lucide-react";
import { SignalAnimation, SignalLogo } from "@/components/signal-animation";
import { toast } from "sonner";

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [verified, setVerified] = useState<string | null>(null); // email after submit

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterTenantInput>({
    resolver: zodResolver(RegisterTenantSchema),
  });

  async function onSubmit(data: RegisterTenantInput) {
    try {
      await api.post("/auth/register", data);
      setVerified(data.email);
    } catch (err: any) {
      const msg = err.response?.data?.error ?? "Registration failed";
      toast.error(msg);
    }
  }

  return (
    <div className="auth-page">

      <div className="auth-logo-row">
        <SignalLogo size={24} />
        <span className="auth-logo-text">AskBase</span>
      </div>

      <div className="auth-card" style={{ maxWidth: "820px" }}>

        {/* left panel */}
        <div className="auth-panel-left" style={{ width: "320px" }}>
          <div className="auth-panel-glow" />
          <div className="relative z-10 flex flex-col items-center gap-6 px-10 text-center">
            <SignalAnimation className="w-[160px] h-[160px]" />
            <div>
              <p className="text-white/55 text-sm font-semibold tracking-tight leading-snug">
                Your support team,<br />powered by AI
              </p>
              <p className="text-white/20 text-[11px] mt-2 leading-relaxed">
                Upload your docs. Let AskBase handle the questions — instantly, 24/7.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full text-left">
              {[
                "Instant answers from your knowledge base",
                "Seamless handoff to your human agents",
                "Analytics on every conversation",
              ].map(feat => (
                <div key={feat} className="flex items-center gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                    <circle cx="7" cy="7" r="6.5" stroke="rgba(99,102,241,0.3)" />
                    <path d="M4.5 7L6.5 9L9.5 5.5" stroke="rgba(99,102,241,0.6)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-white/30 text-[11px] leading-snug">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* right panel */}
        <div className="auth-panel-right">
          <div className="w-full" style={{ maxWidth: "310px" }}>

            {verified ? (
              /* ── Check your email state ── */
              <div className="flex flex-col items-center text-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h1 className="auth-heading mb-1">Check your inbox</h1>
                  <p className="auth-subheading leading-relaxed">
                    We sent a verification link to<br />
                    <span className="text-white/60 font-medium">{verified}</span>
                  </p>
                </div>
                <p className="text-[11px] text-white/20 leading-relaxed max-w-[260px]">
                  Click the link in the email to activate your account. Check spam if you don't see it within a minute.
                </p>
                <p className="auth-divider">
                  Wrong email?{" "}
                  <button onClick={() => setVerified(null)} className="auth-link font-semibold">
                    Go back
                  </button>
                </p>
              </div>
            ) : (
              /* ── Register form ── */
              <>
                <div className="mb-5">
                  <h1 className="auth-heading">Create your account</h1>
                  <p className="auth-subheading">Free forever · No credit card required</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="auth-label">First name</label>
                      <input className="auth-input" placeholder="Alex" {...register("firstName")} />
                      {errors.firstName && <p className="auth-error">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <label className="auth-label">Last name</label>
                      <input className="auth-input" placeholder="Chen" {...register("lastName")} />
                      {errors.lastName && <p className="auth-error">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="auth-label">Company</label>
                    <input className="auth-input" placeholder="Acme Inc." {...register("tenantName")} />
                    {errors.tenantName && <p className="auth-error">{errors.tenantName.message}</p>}
                  </div>

                  <div>
                    <label className="auth-label">Work email</label>
                    <input type="email" className="auth-input" placeholder="you@company.com" {...register("email")} />
                    {errors.email && <p className="auth-error">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="auth-label">Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        className="auth-input pr-10"
                        placeholder="Min. 8 characters"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="auth-error">{errors.password.message}</p>}
                  </div>

                  <button type="submit" disabled={isSubmitting} className="auth-btn mt-1">
                    {isSubmitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                      : <>Get started free <ArrowRight className="w-4 h-4" /></>
                    }
                  </button>

                  <p className="text-center text-[11px] text-white/15">
                    By signing up you agree to our{" "}
                    <Link href="/terms" className="auth-link underline underline-offset-2">Terms</Link>
                    {" "}&amp;{" "}
                    <Link href="/privacy" className="auth-link underline underline-offset-2">Privacy</Link>
                  </p>
                </form>

                <p className="auth-divider mt-4">
                  Already have an account?{" "}
                  <Link href="/login" className="auth-link font-semibold">Sign in</Link>
                </p>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
