"use client"

import * as React from "react"
import { RotateCcw, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { IntentField } from "./OnboardingState"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FlowReplayPreviewProps {
  name?: string
  welcomeMessage: string
  responseTimeText?: string
  fields: IntentField[]
  successMessage: string
  className?: string
}

interface Step {
  id: string
  kind:
    | "welcome"
    | "question"
    | "answer"
    | "bad_answer"
    | "error"
    | "options"
    | "success"
  content?: string
  /** For "question" steps — optional hint shown under the bubble */
  hint?: string
  options?: { label: string; value: string }[]
  fieldType?: string
}

// ---------------------------------------------------------------------------
// Fake-answer generator
// ---------------------------------------------------------------------------

// AI-provided sample takes priority; fall back to heuristic.
function bestGoodAnswer(field: IntentField): string {
  if (field.sampleGoodAnswer && field.sampleGoodAnswer.trim().length > 0) {
    return field.sampleGoodAnswer
  }
  return fakeAnswer(field)
}

function fakeAnswer(field: IntentField): string {
  const label = field.label?.toLowerCase() ?? field.key ?? ""
  const pattern = field.pattern ?? ""

  // ── INDIAN IDs (detect by label OR by AI-generated regex pattern) ─────
  if (/\bpan\b/i.test(label) || /^\[A-Z\]\{5\}/.test(pattern)) return "ABCDE1234F"
  if (/aadhaar|aadhar/i.test(label) || /\^\[2-9\]\[0-9\]\{3\}/.test(pattern)) return "1234 5678 9012"
  if (/gst|gstin/i.test(label) || /\^\[0-9\]\{2\}\[A-Z\]\{5\}/.test(pattern)) return "27ABCDE1234F1Z5"
  if (/ifsc/i.test(label) || /\^\[A-Z\]\{4\}0/.test(pattern)) return "HDFC0001234"
  if (/pin\s?code|postal\s?code|zip/i.test(label) || /\^\[1-9\]\[0-9\]\{5\}/.test(pattern)) return "400001"
  if (/passport/i.test(label)) return "A1234567"
  if (/vehicle|rto|registration/i.test(label)) return "MH12AB1234"

  if (field.type === "email") return "john@example.com"

  if (field.type === "phone") {
    // Indian pattern hint → Indian number
    const isIndian = /\[6-9\]\\d\{9\}/.test(pattern) || /\\\+91/.test(pattern) || /\+91/.test(field.placeholder ?? "")
    return isIndian ? "+91 98765 43210" : "+1 555-0123"
  }

  if (field.type === "date") return "Next Friday"

  if (field.type === "number") {
    // INR / lakhs / crores
    if (/lakh|crore|inr|rupee|₹/i.test(label) || /lakh|crore|inr|rupee|₹/i.test(field.helpText ?? "")) {
      // Pick a value inside [min,max] if given, else a sensible default
      const max = field.max
      const min = field.min ?? 0
      if (max && max <= 500) return String(Math.min(50, Math.max(min, 25)))
      return "50"
    }
    if (/budget|price|amount|salary|revenue/.test(label)) return "$250,000"
    if (/age/.test(label)) return "32"
    if (/year|experience/.test(label)) return "5"
    if (/party|guest|people|count|number\s?of/.test(label)) return "4"
    if (/bedroom|bhk/.test(label)) return "2"
    if (/rating|score/.test(label)) return field.max ? String(field.max - 1) : "4"
    if (/gpa/.test(label)) return "3.8"
    if (/cgpa/.test(label)) return "8.5"
    if (/percent|marks/.test(label)) return "87"
    if (field.min !== undefined && field.max !== undefined) {
      return String(Math.round((field.min + field.max) / 2))
    }
    return "5"
  }

  if (field.type === "select" && field.options && field.options.length > 0) {
    return field.options[0].label
  }

  if (field.type === "url") return "https://acme.com"

  if (field.type === "longtext") {
    if (/description|issue|bug|error|complaint|ticket/.test(label)) return "The submit button isn't responding when clicked on mobile Chrome."
    if (/feedback|review|comment|experience|opinion/.test(label)) return "Great experience overall, very responsive team!"
    if (/note|request|additional|special/.test(label)) return "Please contact me after 5 PM."
    if (/message|inquiry|query/.test(label)) return "I'd like to learn more about your pricing plans."
    if (/pain|goal|problem/.test(label)) return "Need to streamline our current onboarding process."
    if (/cover|statement|purpose|motivation|essay/.test(label)) return "Passionate about technology and eager to contribute to meaningful work."
    if (/reason|why/.test(label)) return "I've been using your product for 2 years and need a plan upgrade."
    return "I'd like to get more information about your services."
  }

  // Plain text — guess from label
  if (/parent.*name|guardian/.test(label)) return "Priya Sharma"
  if (/student|child.*name/.test(label)) return "Arjun"
  if (/full\s?legal\s?name|name.*official/.test(label)) return "Aarav Sharma"
  if (/name/.test(label)) return "Aarav Sharma"
  if (/company|business|org|firm/.test(label)) return "Acme Corp"
  if (/job.*title|role|position|designation/.test(label)) return "Product Manager"
  if (/address|location/.test(label)) return "Bandra West, Mumbai"
  if (/city/.test(label)) return "Mumbai"
  if (/state/.test(label)) return "Maharashtra"
  if (/country/.test(label)) return "India"
  if (/website|url|link/.test(label)) return "acme.com"
  if (/class|grade/.test(label)) return "SR KG"
  if (/policy.*number|policy\s?no/.test(label)) return "POL-2024-12345"
  if (/registration|reg\s?no/.test(label)) return "REG-987654"
  if (/specialty|specialisation|specialization/.test(label)) return "Cardiology"
  if (/complaint|reason|concern/.test(label)) return "General consultation"

  return "Sample answer"
}

function questionFor(field: IntentField): string {
  const raw = (field.label ?? field.key ?? "info").toString().trim()
  // Strip leading "your" so we don't get "What's your your name?"
  const lower = raw.toLowerCase().replace(/^your\s+/i, "")
  // If the AI gave us a long descriptive label (>= 6 words), shorten it for the question.
  const words = lower.split(/\s+/)
  const trimmed = words.length > 5 ? words.slice(0, 4).join(" ") : lower
  return `What's your ${trimmed}?`
}

// ---------------------------------------------------------------------------
// Validation demo — picks one rule per field and crafts a bad answer + error
// Returns null if the field has no meaningful validation to demo.
// ---------------------------------------------------------------------------

function validationDemo(field: IntentField): { bad: string; error: string } | null {
  // AI-provided pair takes priority — they were generated alongside the validation rule
  // and are guaranteed to match the spec.
  if (
    field.sampleBadAnswer &&
    field.sampleBadAnswer.trim().length > 0 &&
    field.sampleErrorMessage &&
    field.sampleErrorMessage.trim().length > 0
  ) {
    return { bad: field.sampleBadAnswer, error: field.sampleErrorMessage }
  }

  const label = (field.label ?? field.key ?? "this field").toString().toLowerCase().replace(/^your\s+/i, "")

  if (field.type === "email") {
    return {
      bad: "john@invalid",
      error: "Hmm — that doesn't look like a valid email. Try something like name@company.com.",
    }
  }

  if (field.type === "phone") {
    // Pattern hints whether it's Indian
    const isIndian = (field.pattern ?? "").includes("[6-9]") || (field.pattern ?? "").includes("\\+91")
    return isIndian
      ? {
          bad: "12345",
          error: "Please enter a 10-digit Indian mobile starting with 6, 7, 8 or 9 — optional +91.",
        }
      : {
          bad: "123",
          error: "That doesn't look like a phone number — please use 7–20 digits.",
        }
  }

  if (field.type === "number") {
    if (field.min !== undefined && field.max !== undefined) {
      return {
        bad: String(field.max + 1),
        error: `${field.label || "Value"} must be between ${field.min} and ${field.max}.`,
      }
    }
    if (field.min !== undefined) {
      return {
        bad: String(field.min - 1),
        error: `${field.label || "Value"} must be at least ${field.min}.`,
      }
    }
    if (field.max !== undefined) {
      return {
        bad: String(field.max + 1),
        error: `${field.label || "Value"} must be at most ${field.max}.`,
      }
    }
  }

  if (field.type === "date" && field.minDate === "future") {
    return {
      bad: "Yesterday",
      error: "Please pick a future date.",
    }
  }
  if (field.type === "date" && field.minDate === "past") {
    return {
      bad: "Tomorrow",
      error: "Please pick a past date.",
    }
  }

  if ((field.type === "text" || field.type === "longtext") && field.minLength !== undefined && field.minLength > 1) {
    return {
      bad: "a",
      error: `${field.label || "This"} must be at least ${field.minLength} characters.`,
    }
  }
  if ((field.type === "text" || field.type === "longtext") && field.pattern) {
    // Generic pattern violation — pick an obviously wrong-shaped value
    if (/PAN/i.test(label) || /^[A-Z]\{5\}/.test(field.pattern)) {
      return {
        bad: "abcd1234",
        error: "PAN must be 5 letters, 4 digits, then 1 letter (e.g. ABCDE1234F).",
      }
    }
    if (/aadhaar/i.test(label)) {
      return {
        bad: "1234",
        error: "Aadhaar must be a 12-digit number.",
      }
    }
    if (/pin\s?code|postal/i.test(label)) {
      return {
        bad: "12",
        error: "PIN must be 6 digits and can't start with 0.",
      }
    }
    if (/IFSC/i.test(label)) {
      return {
        bad: "HDFC1234",
        error: "IFSC must be 4 letters + 0 + 6 alphanumeric (e.g. HDFC0001234).",
      }
    }
    if (/name/i.test(label)) {
      return {
        bad: "John123",
        error: `${field.label || "Name"} should only contain letters.`,
      }
    }
    return {
      bad: "????",
      error: `${field.label || "Value"} doesn't match the expected format.`,
    }
  }

  return null
}

function buildScript(welcomeMessage: string, fields: IntentField[], successMessage: string): Step[] {
  const out: Step[] = []
  out.push({ id: "welcome", kind: "welcome", content: welcomeMessage })

  // Cap how many fields demo validation so the preview doesn't drag.
  // With AI-provided samples on every field, eligibility = validationDemo returns non-null.
  const demoIndices = new Set<number>()
  let demoBudget = 2
  fields.forEach((f, i) => {
    if (demoBudget <= 0) return
    const demo = validationDemo(f)
    if (!demo) return
    demoIndices.add(i)
    demoBudget -= 1
  })

  fields.forEach((f, i) => {
    // Only carry helpText forward if it's substantively different from the label
    const labelLower = (f.label ?? "").toLowerCase().trim()
    const helpLower = (f.helpText ?? "").toLowerCase().trim()
    const useHint = !!helpLower && helpLower !== labelLower

    out.push({
      id: `q-${i}`,
      kind: "question",
      content: questionFor(f),
      hint: useHint ? f.helpText : undefined,
      fieldType: f.type,
    })

    if (f.type === "select" && f.options && f.options.length > 0) {
      out.push({ id: `opt-${i}`, kind: "options", options: f.options })
      out.push({ id: `a-${i}`, kind: "answer", content: bestGoodAnswer(f) })
      return
    }

    // Validation demo: bad answer → error bubble → correct answer
    if (demoIndices.has(i)) {
      const demo = validationDemo(f)!
      out.push({ id: `bad-${i}`, kind: "bad_answer", content: demo.bad })
      out.push({ id: `err-${i}`, kind: "error", content: demo.error })
    }

    out.push({ id: `a-${i}`, kind: "answer", content: bestGoodAnswer(f) })
  })

  out.push({ id: "success", kind: "success", content: successMessage || "All done — we'll be in touch!" })
  return out
}

// ---------------------------------------------------------------------------
// Component — chrome-free chat list
// ---------------------------------------------------------------------------

export function FlowReplayPreview({
  welcomeMessage,
  responseTimeText,
  fields,
  successMessage,
  className,
}: FlowReplayPreviewProps) {
  const script = React.useMemo(
    () => buildScript(welcomeMessage || "Hi! Let's get you set up.", fields, successMessage),
    [welcomeMessage, fields, successMessage]
  )

  const [step, setStep] = React.useState(0)
  const [playKey, setPlayKey] = React.useState(0)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setStep(0)
  }, [script, playKey])

  React.useEffect(() => {
    if (step >= script.length) return
    const current = script[step]
    let delay = 900
    if (current.kind === "welcome") delay = 700
    if (current.kind === "question") delay = 1100
    if (current.kind === "options") delay = 800
    if (current.kind === "bad_answer") delay = 800
    if (current.kind === "error") delay = 1600       // hold the error visible
    if (current.kind === "answer") delay = 1000
    if (current.kind === "success") delay = 1500

    const t = setTimeout(() => {
      setStep((s) => Math.min(s + 1, script.length))
    }, delay)
    return () => clearTimeout(t)
  }, [step, script])

  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [step])

  const visible = script.slice(0, step + 1)
  const isPlaying = step < script.length - 1

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Quiet header — just label + replay */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {isPlaying ? "Playing" : "Done"}
        </span>
        <button
          type="button"
          onClick={() => setPlayKey((k) => k + 1)}
          aria-label="Replay"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Replay
        </button>
      </div>

      {/* Conversation — proper chat window, messages anchor to bottom */}
      <div
        ref={scrollRef}
        className="flex flex-col justify-end gap-2.5 h-[540px] overflow-y-auto rounded-lg border border-border/60 bg-card/40 p-4"
      >
        {visible.map((s, idx) => {
          if (s.kind === "answer") {
            return (
              <div
                key={idx}
                className="flex justify-end animate-in fade-in slide-in-from-right-1 duration-200"
              >
                <div className="rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[75%] bg-primary text-primary-foreground shadow-sm">
                  <p className="text-sm leading-snug whitespace-pre-wrap">
                    {s.content}
                  </p>
                </div>
              </div>
            )
          }

          // Bad answer (gets rejected) — shown with strike-through tint
          if (s.kind === "bad_answer") {
            return (
              <div
                key={idx}
                className="flex justify-end animate-in fade-in slide-in-from-right-1 duration-200"
              >
                <div className="rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[75%] bg-muted text-muted-foreground border border-destructive/40 shadow-sm">
                  <p className="text-sm leading-snug whitespace-pre-wrap line-through opacity-80">
                    {s.content}
                  </p>
                </div>
              </div>
            )
          }

          // Validation error bubble — destructive accent
          if (s.kind === "error") {
            return (
              <div
                key={idx}
                className="flex items-start gap-1.5 animate-in fade-in slide-in-from-left-1 duration-200"
              >
                <div className="rounded-2xl rounded-bl-sm px-3 py-2 max-w-[80%] bg-destructive/10 border border-destructive/30 inline-flex items-start gap-1.5 shadow-sm">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive leading-snug whitespace-pre-wrap">
                    {s.content}
                  </p>
                </div>
              </div>
            )
          }

          if (s.kind === "options" && s.options) {
            return (
              <div
                key={idx}
                className="flex flex-wrap gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200"
              >
                {s.options.map((opt, i) => (
                  <span
                    key={i}
                    className="text-xs rounded-md border border-border bg-card text-foreground px-2.5 py-1"
                  >
                    {opt.label}
                  </span>
                ))}
              </div>
            )
          }

          return (
            <div
              key={idx}
              className="flex flex-col gap-0.5 animate-in fade-in slide-in-from-left-1 duration-200"
            >
              <div
                className={cn(
                  "rounded-2xl rounded-bl-sm px-3.5 py-2 max-w-[80%] self-start inline-flex items-start gap-1.5 shadow-sm",
                  s.kind === "success"
                    ? "bg-foreground text-background"
                    : "bg-muted text-foreground"
                )}
              >
                {s.kind === "success" && (
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                )}
                <p className="text-sm leading-snug whitespace-pre-wrap">
                  {s.content}
                </p>
              </div>
              {s.kind === "welcome" && responseTimeText && (
                <p className="text-[10px] text-muted-foreground pl-3">{responseTimeText}</p>
              )}
              {s.kind === "question" && s.hint && (
                <p className="text-[10px] text-muted-foreground pl-3 italic">{s.hint}</p>
              )}
            </div>
          )
        })}

        {/* Typing dots */}
        {step < script.length && step > 0 && (
          <div className="flex items-start animate-in fade-in duration-200">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-1 shadow-sm">
              <span
                className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce"
                style={{ animationDelay: "120ms" }}
              />
              <span
                className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce"
                style={{ animationDelay: "240ms" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
