"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
  User, Building2, Users, Key, Shield,
  Plus, Trash2, Copy, Check, Loader2,
  AlertTriangle, Eye, EyeOff, Crown, ChevronDown, Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { usePageHeader } from "@/components/dashboard/page-header";
import { PageHeaderBar } from "@/components/dashboard/page-header-bar";

// ── Types ──────────────────────────────────────────────────

interface Me {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  tenant: { id: string; name: string; slug: string; plan: string } | null;
}

interface Member {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: "owner" | "admin" | "agent";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; color: string }> = {
  owner:  { label: "Owner",  color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  admin:  { label: "Admin",  color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  agent:  { label: "Agent",  color: "bg-muted text-muted-foreground" },
};

function fmt(dateStr: string | null) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Tab: Profile ───────────────────────────────────────────

function ProfileTab({ me, onUpdate }: { me: Me; onUpdate: (updated: Partial<Me>) => void }) {
  const [form, setForm] = useState({ firstName: me.firstName, lastName: me.lastName });
  const [pw, setPw]     = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [savedPw, setSavedPw] = useState(false);
  const [errPw, setErrPw]   = useState("");

  async function saveProfile() {
    setSaving(true);
    try {
      const r = await api.patch("/auth/profile", form);
      const data = r.data?.data ?? r.data;
      onUpdate({ firstName: data.firstName, lastName: data.lastName, name: data.name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    setErrPw("");
    if (pw.next !== pw.confirm) { setErrPw("Passwords do not match"); return; }
    if (pw.next.length < 8) { setErrPw("Minimum 8 characters"); return; }
    setSavingPw(true);
    try {
      await api.patch("/auth/profile", { currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: "", next: "", confirm: "" });
      setSavedPw(true);
      setTimeout(() => setSavedPw(false), 2000);
    } catch (e: any) {
      setErrPw(e?.response?.data?.message ?? "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Avatar + name block */}
      <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-[0_4px_18px_hsl(var(--primary)/0.35)] flex-shrink-0">
          <span className="text-primary-foreground text-xl font-bold">
            {me.firstName?.[0]?.toUpperCase()}{me.lastName?.[0]?.toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-semibold text-foreground">{me.name || me.email}</p>
          <p className="text-sm text-muted-foreground">{me.email}</p>
          <Badge className={cn("mt-1 text-xs capitalize", ROLE_META[me.role]?.color)}>{ROLE_META[me.role]?.label ?? me.role}</Badge>
        </div>
      </div>

      {/* Profile fields */}
      <div className="p-4 bg-card border border-border rounded-xl space-y-4">
        <p className="text-sm font-semibold text-foreground">Personal info</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">First name</label>
            <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Last name</label>
            <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">Email</label>
          <Input value={me.email} disabled className="opacity-60" />
          <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
        </div>
        <Button size="sm" onClick={saveProfile} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
          {saved ? "Saved" : "Save changes"}
        </Button>
      </div>

      {/* Password change */}
      <div className="p-4 bg-card border border-border rounded-xl space-y-4">
        <p className="text-sm font-semibold text-foreground">Change password</p>
        <div className="space-y-3">
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              placeholder="Current password"
              value={pw.current}
              onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
            />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Input type="password" placeholder="New password (min 8 chars)" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} />
          <Input type="password" placeholder="Confirm new password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} />
        </div>
        {errPw && <p className="text-xs text-destructive">{errPw}</p>}
        <Button size="sm" onClick={changePassword} disabled={savingPw || !pw.current || !pw.next} className="gap-2">
          {savingPw ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : savedPw ? <Check className="w-3.5 h-3.5" /> : null}
          {savedPw ? "Password changed" : "Update password"}
        </Button>
      </div>
    </div>
  );
}

// ── Tab: Workspace ─────────────────────────────────────────

function WorkspaceTab({ me }: { me: Me }) {
  const t = me.tenant;
  if (!t) return <p className="text-muted-foreground text-sm">No workspace info.</p>;

  const planMeta: Record<string, string> = {
    free:       "bg-muted text-muted-foreground",
    starter:    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    pro:        "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    enterprise: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="space-y-4 max-w-lg">
      <div className="p-4 bg-card border border-border rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Workspace</p>
          <Badge className={cn("capitalize text-xs", planMeta[t.plan] ?? planMeta.free)}>
            <Crown className="w-3 h-3 mr-1" />{t.plan}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Workspace name</label>
            <Input value={t.name} disabled className="opacity-60" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Slug</label>
            <div className="flex items-center h-10 px-3 rounded-lg border border-border bg-muted/40">
              <span className="text-muted-foreground text-sm">askbase.io/</span>
              <span className="text-sm font-mono text-foreground">{t.slug}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">Contact support to rename your workspace or change your plan.</p>
      </div>
    </div>
  );
}

// ── Tab: Team ──────────────────────────────────────────────

function TeamTab({ me }: { me: Me }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen]   = useState(false);
  const [inviteForm, setInviteForm]   = useState({ firstName: "", lastName: "", email: "", role: "agent" });
  const [inviting, setInviting]       = useState(false);
  const [tempCred, setTempCred]       = useState<{ email: string; password: string } | null>(null);
  const [removing, setRemoving]       = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);

  const load = useCallback(async () => {
    const r = await api.get("/team").catch(() => ({ data: { data: [] } }));
    setMembers((r.data?.data ?? []).filter((m: Member) => m.isActive));
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  async function invite() {
    setInviting(true);
    try {
      const r = await api.post("/team", inviteForm);
      const data = r.data?.data ?? r.data;
      setTempCred({ email: data.email, password: data.tempPassword });
      setInviteForm({ firstName: "", lastName: "", email: "", role: "agent" });
      setInviteOpen(false);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to invite");
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(id: string, role: string) {
    await api.patch(`/team/${id}/role`, { role });
    setMembers(ms => ms.map(m => m.id === id ? { ...m, role: role as Member["role"] } : m));
  }

  async function remove(id: string) {
    setRemoving(id);
    try {
      await api.delete(`/team/${id}`);
      setMembers(ms => ms.filter(m => m.id !== id));
    } finally {
      setRemoving(null);
    }
  }

  const canManage = me.role === "owner" || me.role === "admin";

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Temp credential reveal */}
      {tempCred && (
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Member invited — share credentials once</p>
            <button onClick={() => setTempCred(null)} className="text-muted-foreground hover:text-foreground text-xs">Dismiss</button>
          </div>
          <div className="bg-background rounded-lg border border-border px-3 py-2.5 font-mono text-sm">
            <p>Email: <span className="text-foreground">{tempCred.email}</span></p>
            <p>Temp password: <span className="text-foreground">{tempCred.password}</span></p>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => {
            navigator.clipboard.writeText(`Email: ${tempCred.email}\nPassword: ${tempCred.password}`);
            setCopied(true); setTimeout(() => setCopied(false), 2000);
          }}>
            {copied ? <><Check className="w-3.5 h-3.5" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy credentials</>}
          </Button>
        </div>
      )}

      <div className="p-4 bg-card border border-border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Team members</p>
            <p className="text-xs text-muted-foreground mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""}</p>
          </div>
          {canManage && (
            <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-2">
              <Plus className="w-3.5 h-3.5" />Invite member
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {m.firstName?.[0]?.toUpperCase()}{m.lastName?.[0]?.toUpperCase() ?? ""}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.name || m.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canManage && m.id !== me.id && m.role !== "owner" ? (
                    <div className="relative">
                      <select
                        value={m.role}
                        onChange={e => changeRole(m.id, e.target.value)}
                        className="h-7 px-2 pr-6 text-xs rounded-lg border border-border bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30"
                      >
                        <option value="admin">Admin</option>
                        <option value="agent">Agent</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  ) : (
                    <Badge className={cn("text-xs", ROLE_META[m.role]?.color)}>{ROLE_META[m.role]?.label}</Badge>
                  )}
                  {m.id === me.id && <span className="text-xs text-muted-foreground">(you)</span>}
                  {canManage && m.id !== me.id && m.role !== "owner" && (
                    <button
                      onClick={() => remove(m.id)}
                      disabled={removing === m.id}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      {removing === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Invite team member</DialogTitle>
            <DialogDescription className="text-sm">A temporary password will be generated. Share it with the member directly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="First name" value={inviteForm.firstName} onChange={e => setInviteForm(f => ({ ...f, firstName: e.target.value }))} />
              <Input placeholder="Last name" value={inviteForm.lastName} onChange={e => setInviteForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
            <Input placeholder="Email" type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} />
            <div className="relative">
              <select
                value={inviteForm.role}
                onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                className="w-full h-10 px-3 pr-8 text-sm rounded-lg border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="admin">Admin — can manage most settings</option>
                <option value="agent">Agent — view and respond only</option>
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              onClick={invite}
              disabled={inviting || !inviteForm.email.trim() || !inviteForm.firstName.trim()}
              className="gap-2"
            >
              {inviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Tab: API Keys ──────────────────────────────────────────

function ApiKeysTab() {
  const [keys, setKeys]           = useState<ApiKey[]>([]);
  const [loading, setLoading]     = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName]       = useState("");
  const [creating, setCreating]     = useState(false);
  const [revealed, setRevealed]     = useState<string | null>(null);
  const [copied, setCopied]         = useState(false);
  const [revoking, setRevoking]     = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api.get("/keys").catch(() => ({ data: { data: [] } }));
    setKeys((r.data?.data ?? []).filter((k: ApiKey) => k.isActive));
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  async function createKey() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const r = await api.post("/keys", { name: newName.trim() });
      const data = r.data?.data ?? r.data;
      setRevealed(data.rawKey ?? data.key ?? null);
      setNewName("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    setRevoking(id);
    try {
      await api.delete(`/keys/${id}`);
      setKeys(ks => ks.filter(k => k.id !== id));
    } finally {
      setRevoking(null);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="p-4 bg-card border border-border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">API Keys</p>
            <p className="text-xs text-muted-foreground mt-0.5">Workspace-level keys for direct API access</p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-3.5 h-3.5" />New key
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" />)}</div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-muted-foreground">
            <Key className="w-7 h-7 mb-2 opacity-25" />
            <p className="text-sm">No API keys yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {keys.map(k => (
              <div key={k.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{k.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{k.keyPrefix}••••••••••</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Created {fmt(k.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">Used {fmt(k.lastUsedAt)}</p>
                </div>
                <button
                  onClick={() => revokeKey(k.id)}
                  disabled={revoking === k.id}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  {revoking === k.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={open => { setCreateOpen(open); if (!open) setRevealed(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{revealed ? "Copy your key" : "Create API key"}</DialogTitle>
            {!revealed && <DialogDescription className="text-sm">The full key is shown only once after creation.</DialogDescription>}
          </DialogHeader>
          {revealed ? (
            <div className="space-y-4">
              <div className="bg-muted/40 border border-border rounded-lg px-3 py-2.5">
                <p className="text-xs text-muted-foreground mb-1">API key — copy before closing</p>
                <code className="text-xs font-mono text-foreground break-all">{revealed}</code>
              </div>
              <Button className="w-full gap-2" variant={copied ? "outline" : "default"} onClick={() => {
                navigator.clipboard.writeText(revealed);
                setCopied(true); setTimeout(() => setCopied(false), 2000);
              }}>
                {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy key</>}
              </Button>
              <DialogFooter>
                <Button variant="ghost" size="sm" onClick={() => { setCreateOpen(false); setRevealed(null); }}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <Input placeholder="Key name (e.g. Production)" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") createKey(); }} />
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={createKey} disabled={creating || !newName.trim()} className="gap-2">
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

const TABS = [
  { key: "profile",   label: "Profile",   icon: User      },
  { key: "workspace", label: "Workspace", icon: Building2  },
  { key: "team",      label: "Team",      icon: Users      },
  { key: "keys",      label: "API Keys",  icon: Key        },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [me, setMe]               = useState<Me | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get("/auth/me").then(r => {
      setMe(r.data?.data ?? null);
    }).finally(() => setLoading(false));
  }, []);

  function handleUpdate(updated: Partial<Me>) {
    setMe(prev => prev ? { ...prev, ...updated } : prev);
  }

  usePageHeader(
    <PageHeaderBar icon={Settings2} tone="primary" title="Settings" />,
    [],
  );

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-xl" />
        <div className="h-48 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!me) return <p className="p-6 text-muted-foreground text-sm">Failed to load settings.</p>;

  return (
    <div className="p-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-xl p-1 w-fit mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "profile"   && <ProfileTab   me={me} onUpdate={handleUpdate} />}
      {activeTab === "workspace" && <WorkspaceTab me={me} />}
      {activeTab === "team"      && <TeamTab      me={me} />}
      {activeTab === "keys"      && <ApiKeysTab />}
    </div>
  );
}
