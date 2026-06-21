import { create } from "zustand";

export type NotifType = "handoff" | "new_conversation";

export interface Notification {
  id: string;
  type: NotifType;
  conversationId: string;
  customerName: string | null;
  preview: string;
  timestamp: number;
  read: boolean;
}

interface State {
  notifications: Notification[];
  liveConvCount: number;
  setLiveConvCount: (n: number) => void;
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<State>((set, get) => ({
  notifications: [],
  liveConvCount: 0,

  setLiveConvCount: (n) => set({ liveConvCount: n }),

  addNotification: (n) =>
    set(s => ({
      notifications: [
        { ...n, id: `${Date.now()}-${Math.random()}`, timestamp: Date.now(), read: false },
        ...s.notifications,
      ].slice(0, 20),
    })),

  markAllRead: () =>
    set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),

  dismiss: (id) =>
    set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),

  unreadCount: () => get().notifications.filter(n => !n.read).length,
}));
