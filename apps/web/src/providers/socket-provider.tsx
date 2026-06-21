"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useNotificationStore } from "@/store/notifications";

const SocketContext = createContext<Socket | null>(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({
  children,
  tenantId,
}: {
  children: React.ReactNode;
  tenantId: string | null;
}) {
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();
  const addNotification = useNotificationStore(s => s.addNotification);
  const setLiveConvCount = useNotificationStore(s => s.setLiveConvCount);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    const s = io(process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:4000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => {
      s.emit("join:tenant", tenantId);
    });

    s.on("handoff:triggered", (data: { conversationId: string; customerName: string | null; preview: string }) => {
      addNotification({ type: "handoff", ...data });

      toast.error("Handoff needed", {
        description: `${data.customerName ?? "Customer"} needs a human agent`,
        duration: Infinity,
        action: {
          label: "Open",
          onClick: () => router.push(`/dashboard/conversations/${data.conversationId}`),
        },
      });
    });

    s.on("conversation:new", (data: { conversationId: string; subject: string }) => {
      addNotification({
        type: "new_conversation",
        conversationId: data.conversationId,
        customerName: null,
        preview: data.subject ?? "New conversation",
      });
      setLiveConvCount(useNotificationStore.getState().liveConvCount + 1);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [tenantId]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
