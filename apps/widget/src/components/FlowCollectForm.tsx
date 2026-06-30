import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { FlowNode } from "../types";

interface Colors {
  accent: string; border: string; inputBg: string; fg: string; muted: string;
}

// Build a zod schema for a single collect field from its node config.
function fieldSchema(d: FlowNode["data"]) {
  const required = !!d.required;

  if (d.fieldType === "number") {
    let inner = z.number({ invalid_type_error: "Please enter a valid number." });
    if (d.min != null) inner = inner.min(d.min, `Must be ${d.min} or more.`);
    if (d.max != null) inner = inner.max(d.max, `Must be ${d.max} or less.`);
    return z.preprocess(
      (v) => (v === "" || v == null ? undefined : Number(v)),
      required
        ? inner.refine((v) => v !== undefined, "This field is required.")
        : inner.optional(),
    );
  }

  let s = z.string();
  if (d.fieldType === "email") s = s.email("Please enter a valid email address.");
  else if (d.fieldType === "phone") s = s.regex(/^[\d\s()+\-]{7,}$/, "Please enter a valid phone number.");
  if (d.minLength) s = s.min(d.minLength, `Please enter at least ${d.minLength} characters.`);
  if (d.maxLength) s = s.max(d.maxLength, `Please keep this under ${d.maxLength} characters.`);
  if (d.pattern) { try { s = s.regex(new RegExp(d.pattern), "Please check the format and try again."); } catch {} }

  return required
    ? z.string().min(1, "This field is required.").pipe(s)
    : z.union([z.literal(""), s]);
}

export function FlowCollectForm({
  node, colors, sending, onSubmit,
}: {
  node: FlowNode;
  colors: Colors;
  sending: boolean;
  onSubmit: (value: string) => void;
}) {
  const d = node.data ?? {};
  const { fieldType = "text", placeholder, helpText, required } = d;
  const isLong = fieldType === "longtext";

  const schema = useMemo(() => z.object({ value: fieldSchema(d) }), [node.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const { register, handleSubmit, formState: { errors }, watch } = useForm<{ value: string }>({
    resolver: zodResolver(schema as any),
    defaultValues: { value: "" },
    mode: "onSubmit",
  });

  const err = errors.value?.message as string | undefined;
  const value = watch("value");

  const submit = handleSubmit((v) => onSubmit(String(v.value ?? "").trim()));

  const fieldStyle: React.CSSProperties = {
    width: "100%", border: `1.5px solid ${err ? "#ef4444" : colors.border}`, borderRadius: 12,
    padding: "11px 13px", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "none",
    color: colors.fg, background: colors.inputBg, transition: "border-color 0.15s",
  };

  return (
    <form onSubmit={submit} style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
      {isLong ? (
        <textarea
          autoFocus rows={3} {...register("value")} placeholder={placeholder || "Type your answer…"}
          style={fieldStyle}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } }}
          onFocus={(e) => { if (!err) e.currentTarget.style.borderColor = colors.accent; }}
          onBlur={(e) => { if (!err) e.currentTarget.style.borderColor = colors.border; }}
        />
      ) : (
        <input
          autoFocus
          type={fieldType === "email" ? "email" : fieldType === "phone" ? "tel" : fieldType === "number" ? "number" : "text"}
          {...register("value")} placeholder={placeholder || "Type your answer…"}
          style={fieldStyle}
          onFocus={(e) => { if (!err) e.currentTarget.style.borderColor = colors.accent; }}
          onBlur={(e) => { if (!err) e.currentTarget.style.borderColor = colors.border; }}
        />
      )}

      {err
        ? <p style={{ fontSize: 11.5, color: "#ef4444", margin: 0, fontWeight: 500 }}>{err}</p>
        : helpText
          ? <p style={{ fontSize: 11.5, color: colors.muted, margin: 0 }}>{helpText}</p>
          : !required && <p style={{ fontSize: 11.5, color: colors.muted, margin: 0 }}>Optional</p>}

      <button type="submit" disabled={sending} style={{ height: 42, borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#fff", background: colors.accent, border: "none", cursor: sending ? "default" : "pointer", fontFamily: "inherit", opacity: sending ? 0.5 : 1 }}>
        {required ? "Continue" : ((value ?? "").toString().trim() ? "Continue" : "Skip")}
      </button>
    </form>
  );
}
