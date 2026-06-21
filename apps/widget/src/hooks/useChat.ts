import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import type { Message } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:4000";

export function useChat(apiKey: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(WS_URL, { auth: { apiKey } });
    setSocket(s);
    return () => { s.disconnect(); };
  }, [apiKey]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit("join:conversation", conversationId);

    socket.on("message:new", (msg: any) => {
      // Skip flow trigger internal messages and deduplicate HTTP-added messages
      if (msg.content === "__flow_trigger__") return;
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, {
          id: msg.id,
          role: msg.senderType === "customer" ? "user" : msg.senderType,
          content: msg.content,
          sources: msg.sources,
          isHandoff: msg.isHandoffTrigger,
          createdAt: new Date(msg.createdAt),
        }];
      });
    });

    socket.on("agent:typing", () => {
      setAgentTyping(true);
      setTimeout(() => setAgentTyping(false), 3000);
    });

    return () => {
      socket.off("message:new");
      socket.off("agent:typing");
    };
  }, [socket, conversationId]);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/chat/message`,
        { content, conversationId: conversationId ?? undefined },
        { headers: { "x-api-key": apiKey } }
      );

      const { message, conversationId: convId } = res.data.data;
      if (!conversationId) setConversationId(convId);

      // Skip internal flow trigger messages
      if (message.content !== "__flow_trigger__") {
        setMessages(prev => [...prev, {
          id: message.id,
          role: message.senderType === "customer" ? "user" : message.senderType,
          content: message.content,
          sources: message.sources,
          isHandoff: message.isHandoffTrigger,
          createdAt: new Date(message.createdAt),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "ai",
        content: "Something went wrong. Please try again.",
        createdAt: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, apiKey]);

  return { messages, sendMessage, loading, agentTyping };
}
