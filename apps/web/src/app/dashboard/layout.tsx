"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, createContext, useContext } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, Search, ChevronsUpDown } from "lucide-react";
import { SignalLogo } from "@/components/signal-animation";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  OverviewIcon, KnowledgeIcon,
  BotsIcon, FlowsIcon, LeadsIcon, ConversationsIcon, AnalyticsIcon, WidgetsIcon, SettingsIcon,
} from "@/components/icons/nav-icons";
import { OnboardingProvider } from "@/components/onboarding";
import { CommandPalette } from "@/components/command-palette";
import { SocketProvider } from "@/providers/socket-provider";
import { NotificationBell } from "@/components/notification-bell";
import { LiveConversationsWidget } from "@/components/live-widget";
import { useNotificationStore } from "@/store/notifications";
import { PageHeaderProvider, PageHeaderSlot } from "@/components/dashboard/page-header";

type User = { name?: string; email?: string; role?: string; firstName?: string; lastName?: string; tenantId?: string } | null;

const SidebarOpen = createContext(false);

const navItems = [
  { href: "/dashboard",               label: "Overview",       icon: OverviewIcon       },
  { href: "/dashboard/bots",          label: "Assistants",     icon: BotsIcon           },
  { href: "/dashboard/knowledge",     label: "Knowledge",      icon: KnowledgeIcon      },
  { href: "/dashboard/flows",         label: "Flows",          icon: FlowsIcon          },
  { href: "/dashboard/leads",         label: "Leads",          icon: LeadsIcon          },
  { href: "/dashboard/conversations", label: "Conversations",  icon: ConversationsIcon  },
];

const secondaryItems = [
  { href: "/dashboard/analytics", label: "Analytics", icon: AnalyticsIcon },
];

function NavItem({ href, label, icon: Icon, active, badge }: {
  href: string; label: string; icon: React.ElementType; active?: boolean; badge?: number;
}) {
  const open = useContext(SidebarOpen);
  const [hov, setHov] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative flex items-center gap-3 px-3 py-2.5 w-full rounded-xl"
    >
      {/* Active sliding pill */}
      {active && (
        <motion.div
          layoutId="nav-active"
          className="absolute inset-0 rounded-xl bg-accent"
          transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
        />
      )}

      {/* Hover bg — works in both collapsed and expanded */}
      {!active && (
        <motion.div
          animate={{ opacity: hov ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 rounded-xl bg-accent/60"
        />
      )}

      {/* Icon with spring bounce on hover */}
      <motion.div
        animate={{ scale: hov && !active ? 1.15 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className="relative z-10 flex-shrink-0"
      >
        <Icon className={cn(
          "w-[22px] h-[22px] transition-colors duration-150",
          active ? "text-foreground" : hov ? "text-foreground" : "text-muted-foreground"
        )} />
      </motion.div>

      {/* Label — always in DOM, animated with maxWidth */}
      <motion.span
        animate={{ maxWidth: open ? 200 : 0, opacity: open ? 1 : 0 }}
        transition={{
          maxWidth: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
          opacity:  { duration: 0.18, delay: open ? 0.1 : 0 },
        }}
        className={cn(
          "relative z-10 text-[15px] whitespace-nowrap overflow-hidden flex-shrink-0",
          active ? "font-semibold text-foreground" : "font-medium",
          hov ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </motion.span>

      {/* Live badge */}
      {badge != null && badge > 0 && (
        <motion.span
          animate={{ maxWidth: open ? 32 : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 overflow-hidden ml-auto"
        >
          <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none whitespace-nowrap">
            {badge > 99 ? "99+" : badge}
          </span>
        </motion.span>
      )}
      {/* Collapsed dot badge */}
      {badge != null && badge > 0 && !open && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 z-20" />
      )}

      {/* Tooltip — shows only when collapsed and hovered */}
      <AnimatePresence>
        {!open && hov && (
          <motion.span
            initial={{ opacity: 0, x: -6, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -6, scale: 0.95 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[60] bg-foreground text-background text-[13px] font-medium px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap pointer-events-none"
          >
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-foreground" />
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

function UserProfile({ user, isDark, mounted, onToggleTheme, onLogout }: {
  user: User;
  isDark: boolean;
  mounted: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}) {
  const open = useContext(SidebarOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hov, setHov] = useState(false);

  const displayName  = user?.name ?? user?.email?.split("@")[0] ?? (user === null ? "" : "…");
  const displayEmail = user?.email ?? "";
  const initials = displayName
    ? displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? "U");

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className="relative w-full flex items-center gap-3 px-2 py-2 rounded-xl"
      >
        <motion.div
          animate={{ opacity: hov || menuOpen ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 rounded-xl bg-accent/60"
        />

        <div className="relative z-10 w-[38px] h-[38px] rounded-xl bg-gradient-to-br from-primary to-primary/75 flex items-center justify-center flex-shrink-0 shadow-[0_3px_12px_hsl(var(--primary)/0.35)]">
          <span className="text-primary-foreground text-[13px] font-semibold tracking-tight">{initials}</span>
        </div>

        <motion.div
          animate={{ maxWidth: open ? 180 : 0, opacity: open ? 1 : 0 }}
          transition={{
            maxWidth: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
            opacity:  { duration: 0.18, delay: open ? 0.1 : 0 },
          }}
          className="relative z-10 flex-1 flex flex-col items-start overflow-hidden whitespace-nowrap min-w-0"
        >
          <span className="text-[13px] font-semibold text-foreground truncate w-full text-left leading-tight">{displayName}</span>
          {displayEmail && (
            <span className="text-[11px] text-muted-foreground truncate w-full text-left leading-tight mt-0.5">{displayEmail}</span>
          )}
        </motion.div>

        <motion.div
          animate={{ maxWidth: open ? 20 : 0, opacity: open ? 1 : 0 }}
          transition={{
            maxWidth: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
            opacity:  { duration: 0.18, delay: open ? 0.1 : 0 },
          }}
          className="relative z-10 overflow-hidden flex-shrink-0"
        >
          <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>

        {/* Tooltip when collapsed */}
        <AnimatePresence>
          {!open && hov && !menuOpen && (
            <motion.span
              initial={{ opacity: 0, x: -6, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -6, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[60] bg-foreground text-background text-[13px] font-medium px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap pointer-events-none"
            >
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-foreground" />
              {displayName}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="absolute bottom-full mb-2 left-0 z-50 w-56 bg-background border border-border rounded-xl shadow-2xl p-1.5"
            >
              <div className="px-2.5 py-2 border-b border-border/60 mb-1">
                <div className="text-[13px] font-semibold text-foreground truncate">{displayName}</div>
                {displayEmail && <div className="text-[11px] text-muted-foreground truncate">{displayEmail}</div>}
              </div>
              {mounted && (
                <button
                  onClick={() => { onToggleTheme(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {isDark ? "Light mode" : "Dark mode"}
                </button>
              )}
              <button
                onClick={() => { onLogout(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchTrigger({ onClick, shortcut }: { onClick: () => void; shortcut: string }) {
  const open = useContext(SidebarOpen);
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative flex w-full items-center gap-3 px-3 py-2.5 rounded-xl"
    >
      <motion.div
        animate={{ opacity: hov ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 rounded-xl bg-accent/60"
      />

      <motion.div
        animate={{ scale: hov ? 1.15 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className="relative z-10 flex-shrink-0"
      >
        <Search className={cn(
          "w-[22px] h-[22px] transition-colors duration-150",
          hov ? "text-foreground" : "text-muted-foreground"
        )} />
      </motion.div>

      <motion.span
        animate={{ maxWidth: open ? 200 : 0, opacity: open ? 1 : 0 }}
        transition={{
          maxWidth: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
          opacity:  { duration: 0.18, delay: open ? 0.1 : 0 },
        }}
        className={cn(
          "relative z-10 text-[15px] font-medium whitespace-nowrap overflow-hidden flex-shrink-0 transition-colors duration-150",
          hov ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Search
      </motion.span>

      <motion.kbd
        animate={{ maxWidth: open ? 60 : 0, opacity: open ? 1 : 0 }}
        transition={{
          maxWidth: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
          opacity:  { duration: 0.18, delay: open ? 0.1 : 0 },
        }}
        className="relative z-10 overflow-hidden whitespace-nowrap text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5"
      >
        {shortcut}
      </motion.kbd>

      <AnimatePresence>
        {!open && hov && (
          <motion.span
            initial={{ opacity: 0, x: -6, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -6, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[60] bg-foreground text-background text-[13px] font-medium px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap pointer-events-none"
          >
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-foreground" />
            Search · {shortcut}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen]       = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser]       = useState<User>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [isMac, setIsMac]     = useState(false);
  const [convBadge, setConvBadge] = useState(0);
  const liveConvCount = useNotificationStore(s => s.liveConvCount);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    setIsMac(/Mac|iPhone|iPod|iPad/.test(navigator.platform));
  }, []);

  useEffect(() => {
    import("@/lib/api").then(({ default: api }) => {
      api.get("/auth/me")
        .then((res) => setUser(res.data?.data ?? null))
        .catch(() => router.replace("/login"));
      // Fetch open+assigned conversation count for sidebar badge
      Promise.all([api.get("/chat?status=open"), api.get("/chat?status=assigned")])
        .then(([r1, r2]) => setConvBadge((r1.data?.data?.length ?? 0) + (r2.data?.data?.length ?? 0)))
        .catch(() => {});
    });
  }, [router]);

  // Update badge as new conversations arrive via socket
  useEffect(() => {
    if (liveConvCount > 0) setConvBadge(c => c + liveConvCount);
  }, [liveConvCount]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function logout() {
    import("@/lib/api").then(({ default: api }) => {
      api.post("/auth/logout").finally(() => router.replace("/login"));
    });
  }

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  }

  if (pathname.startsWith("/dashboard/bots/new")) {
    return (
      <OnboardingProvider>
        <div className="h-screen bg-background">{children}</div>
      </OnboardingProvider>
    );
  }

  const isDark = resolvedTheme === "dark";
  const shortcut = isMac ? "⌘K" : "Ctrl+K";
  const commandItems = [
    ...navItems,
    ...secondaryItems,
    { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
    { href: "/dashboard/widgets",  label: "Widgets",  icon: WidgetsIcon },
  ];

  return (
    <SocketProvider tenantId={user?.tenantId ?? null}>
    <div className="flex h-screen p-2 gap-2 bg-muted">
      <SidebarOpen.Provider value={open}>
        <motion.aside
          animate={{ width: open ? 240 : 64 }}
          transition={{ type: "spring", bounce: 0.05, duration: 0.45 }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="flex-shrink-0 flex flex-col h-full overflow-x-visible"
        >
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 px-3 pt-4 pb-3">
            <motion.div
              animate={{ scale: open ? 1 : 1 }}
              whileHover={{ scale: 1.1, rotate: 6 }}
              whileTap={{ scale: 0.93 }}
              transition={{ type: "spring", stiffness: 380, damping: 18 }}
              className="w-[38px] h-[38px] flex items-center justify-center flex-shrink-0"
            >
              <SignalLogo size={38} />
            </motion.div>
            <motion.span
              animate={{ maxWidth: open ? 140 : 0, opacity: open ? 1 : 0 }}
              transition={{
                maxWidth: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
                opacity:  { duration: 0.18, delay: open ? 0.1 : 0 },
              }}
              className="font-bold text-[16px] tracking-tight text-foreground whitespace-nowrap overflow-hidden"
            >
              AskBase
            </motion.span>
          </Link>

          {/* Search trigger */}
          <div className="px-2 pb-2">
            <SearchTrigger onClick={() => setCmdOpen(true)} shortcut={shortcut} />
          </div>

          {/* Nav */}
          <nav className="flex flex-col flex-1 gap-0.5 px-2 overflow-y-auto overflow-x-visible">
            {navItems.map(({ href, label, icon }) => (
              <NavItem
                key={href}
                href={href}
                label={label}
                icon={icon}
                active={isActive(href)}
                badge={href === "/dashboard/conversations" ? convBadge : undefined}
              />
            ))}

            <div className="border-t border-border/25 my-2 mx-1" />

            {secondaryItems.map(({ href, label, icon }) => (
              <NavItem key={href} href={href} label={label} icon={icon} active={isActive(href)} />
            ))}
          </nav>

          {/* Bottom */}
          <div className="flex flex-col gap-0.5 px-2 pb-2 pt-2 border-t border-border/25">
            <NavItem
              href="/dashboard/settings"
              label="Settings"
              icon={SettingsIcon}
              active={isActive("/dashboard/settings")}
            />
            <div className="mt-1">
              <UserProfile
                user={user}
                isDark={isDark}
                mounted={mounted}
                onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
                onLogout={logout}
              />
            </div>
          </div>
        </motion.aside>
      </SidebarOpen.Provider>

      <PageHeaderProvider>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Bare header strip — lives on the muted background above the frame (sidebar level). */}
          <div className="shrink-0 flex items-start justify-between gap-3 px-1 min-h-[40px]">
            <div className="min-w-0 flex-1">
              <PageHeaderSlot />
            </div>
            <div className="shrink-0">
              <NotificationBell />
            </div>
          </div>

          {/* Rounded page frame — holds page content / canvas only. */}
          <main className="flex-1 min-h-0 bg-background rounded-xl overflow-auto border border-border shadow-sm relative">
            {children}
          </main>
        </div>
      </PageHeaderProvider>

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        items={commandItems}
      />

      <LiveConversationsWidget />
    </div>
    </SocketProvider>
  );
}
