"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Bell, UserRoundCheck, MessageSquare, X } from "lucide-react";
import { useNotificationStore } from "@/store/notifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { notifications, markAllRead, dismiss, unreadCount } = useNotificationStore();
  const count = unreadCount();

  function openConv(convId: string, notifId: string) {
    dismiss(notifId);
    setOpen(false);
    router.push(`/dashboard/conversations/${convId}`);
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(v => !v); if (!open) markAllRead(); }}
        className="relative p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
      >
        <Bell className="w-4.5 h-4.5 w-[18px] h-[18px]" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="absolute top-full right-0 mt-2 w-80 z-50 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold">Notifications</p>
                {notifications.length > 0 && (
                  <button
                    onClick={() => useNotificationStore.getState().markAllRead()}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
                  <Bell className="w-6 h-6 opacity-30" />
                  <p className="text-xs">No notifications yet</p>
                </div>
              ) : (
                <div className="max-h-[340px] overflow-y-auto divide-y divide-border/60">
                  {notifications.map(n => {
                    const isHandoff = n.type === "handoff";
                    const Icon = isHandoff ? UserRoundCheck : MessageSquare;
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors",
                          !n.read && "bg-primary/5"
                        )}
                        onClick={() => openConv(n.conversationId, n.id)}
                      >
                        <div className={cn(
                          "mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                          isHandoff ? "bg-amber-500/15" : "bg-primary/10"
                        )}>
                          <Icon className={cn("w-3.5 h-3.5", isHandoff ? "text-amber-500" : "text-primary")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">
                            {isHandoff ? "Handoff needed" : "New conversation"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {n.customerName ? `${n.customerName}: ` : ""}{n.preview}
                          </p>
                          <p className="text-[10px] text-muted-foreground/50 mt-1">
                            {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                        {!n.read && (
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
