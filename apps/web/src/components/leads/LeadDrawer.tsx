"use client";

import { useState } from "react";
import { X, Tag, StickyNote, MessageSquare, Workflow, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { timeAgo, type Lead } from "./types";
import api from "@/lib/api";

type DrawerTab = "fields" | "chat" | "meta";

interface Props {
  lead: Lead;
  onClose: () => void;
  onUpdate: (patch: Partial<Lead>) => void;
}

export function LeadDrawer({ lead, onClose, onUpdate }: Props) {
  const [notes, setNotes]       = useState(lead.notes ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags]         = useState<string[]>(lead.tags ?? []);
  const [saving, setSaving]     = useState(false);
  const [tab, setTab]           = useState<DrawerTab>("fields");

  const fieldKeys = Object.keys(lead.data).filter(k => !k.startsWith("_"));
  const primaryName = lead.data?.name ?? lead.data?.full_name ?? lead.data?.email ?? "Lead";
  const initials = primaryName.slice(0, 2).toUpperCase();

  async function saveNotes() {
    setSaving(true);
    await api.patch(`/flows/${lead.flowId}/leads/${lead.id}`, { notes }).catch(() => {});
    onUpdate({ notes });
    setSaving(false);
  }

  async function addTag(raw: string) {
    const t = raw.trim().toLowerCase();
    if (!t || tags.includes(t)) { setTagInput(""); return; }
    const next = [...tags, t];
    setTags(next);
    setTagInput("");
    await api.patch(`/flows/${lead.flowId}/leads/${lead.id}`, { tags: next }).catch(() => {});
    onUpdate({ tags: next });
  }

  async function removeTag(tag: string) {
    const next = tags.filter(x => x !== tag);
    setTags(next);
    await api.patch(`/flows/${lead.flowId}/leads/${lead.id}`, { tags: next }).catch(() => {});
    onUpdate({ tags: next });
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[460px] bg-card border-l border-border flex flex-col h-full shadow-2xl">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{initials}</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground leading-tight">{primaryName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge
                    status={lead.status}
                    onChange={s => {
                      onUpdate({ status: s });
                      api.patch(`/flows/${lead.flowId}/leads/${lead.id}`, { status: s }).catch(() => {});
                    }}
                  />
                  {lead.isPartial && <Badge variant="warning" className="text-[10px] h-5">Partial</Badge>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            {lead.flowName && (
              <span className="flex items-center gap-1.5">
                <Workflow className="w-3.5 h-3.5" />
                {lead.flowName}
              </span>
            )}
            <span>{timeAgo(lead.createdAt)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6 flex-shrink-0">
          {(["fields", "chat", "meta"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 mr-5 text-xs font-semibold border-b-2 -mb-px transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t === "chat" ? "Chat replay" : t === "meta" ? "Source & UTM" : "Fields"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {tab === "fields" && <FieldsTab fieldKeys={fieldKeys} lead={lead} tags={tags} tagInput={tagInput} notes={notes} saving={saving} onTagInput={setTagInput} onAddTag={addTag} onRemoveTag={removeTag} onNoteChange={setNotes} onSaveNotes={saveNotes} />}
          {tab === "chat"   && <ChatTab conversation={lead.conversation} />}
          {tab === "meta"   && <MetaTab lead={lead} />}
        </div>
      </div>
    </div>
  );
}

// ── Sub-panels ────────────────────────────────────────────────────────────────

function FieldsTab({ fieldKeys, lead, tags, tagInput, notes, saving, onTagInput, onAddTag, onRemoveTag, onNoteChange, onSaveNotes }: {
  fieldKeys: string[];
  lead: Lead;
  tags: string[];
  tagInput: string;
  notes: string;
  saving: boolean;
  onTagInput: (v: string) => void;
  onAddTag: (t: string) => void;
  onRemoveTag: (t: string) => void;
  onNoteChange: (v: string) => void;
  onSaveNotes: () => void;
}) {
  return (
    <div className="px-6 py-5 space-y-6">
      {/* Fields */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">Collected fields</p>
        <div className="rounded-xl border border-border overflow-hidden">
          {fieldKeys.length === 0
            ? <p className="text-sm text-muted-foreground/50 px-4 py-3">No fields collected</p>
            : fieldKeys.map((key, i) => (
              <div key={key} className={`flex items-start gap-4 px-4 py-3 ${i < fieldKeys.length - 1 ? "border-b border-border/60" : ""}`}>
                <span className="text-[11px] font-mono text-muted-foreground/50 pt-0.5 min-w-[100px] flex-shrink-0 truncate">{key}</span>
                <span className="text-sm text-foreground font-medium break-all leading-snug">{String(lead.data[key] ?? "—")}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3 flex items-center gap-1.5">
          <Tag className="w-3 h-3" /> Tags
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
              {tag}
              <button onClick={() => onRemoveTag(tag)} className="hover:text-destructive transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={e => onTagInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onAddTag(tagInput)}
            placeholder="+ Add tag"
            className="px-3 py-1 text-xs bg-transparent border border-dashed border-border rounded-full outline-none placeholder:text-muted-foreground/40 text-foreground focus:border-primary/50 w-24 transition-colors"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3 flex items-center gap-1.5">
          <StickyNote className="w-3 h-3" /> Internal notes
        </p>
        <textarea
          value={notes}
          onChange={e => onNoteChange(e.target.value)}
          placeholder="Add notes visible only to your team…"
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none"
        />
        <Button size="sm" onClick={onSaveNotes} disabled={saving || notes === (lead.notes ?? "")} className="mt-2">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Save notes
        </Button>
      </div>
    </div>
  );
}

function ChatTab({ conversation }: { conversation: Lead["conversation"] }) {
  if (conversation.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground/40">
        <MessageSquare className="w-8 h-8" />
        <p className="text-sm">No conversation recorded</p>
      </div>
    );
  }
  return (
    <div className="px-6 py-5 space-y-3">
      {conversation.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            msg.role === "user"
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm border border-border/60"
          }`}>
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function MetaTab({ lead }: { lead: Lead }) {
  const rows = [
    ["Flow",         lead.flowName],
    ["Source URL",   lead.sourceUrl],
    ["UTM Source",   lead.utmSource],
    ["UTM Medium",   lead.utmMedium],
    ["UTM Campaign", lead.utmCampaign],
    ["Submitted",    new Date(lead.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })],
  ] as const;

  return (
    <div className="px-6 py-5">
      <div className="rounded-xl border border-border overflow-hidden">
        {rows.map(([label, val], i) => (
          <div key={label} className={`flex items-start gap-4 px-4 py-3 ${i < rows.length - 1 ? "border-b border-border/60" : ""}`}>
            <span className="text-[11px] font-mono text-muted-foreground/50 pt-0.5 min-w-[110px] flex-shrink-0">{label}</span>
            <span className="text-xs text-foreground break-all">
              {val || <span className="text-muted-foreground/30">Not set</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
