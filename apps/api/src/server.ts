import { env } from "./config/env";
import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { logger } from "./common/utils/logger";
import { startIngestionWorker } from "./modules/knowledge/ingestion.worker";
import { db, conversations } from "@askbase/database";
import { eq } from "drizzle-orm";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, cb) => cb(null, true),
    methods: ["GET", "POST"],
    credentials: false,
  },
});

// In-memory presence tracking
// conversationId → { tenantId, socketIds }
const presence = new Map<string, { tenantId: string; sockets: Set<string> }>();
// socketId → conversationId (for widget sockets only)
const socketConv = new Map<string, string>();
// tenantId → Set of agent socketIds currently online (dashboard open)
const agentPresence = new Map<string, Set<string>>();
// socketId → tenantId (for agent sockets)
const agentSocketTenant = new Map<string, string>();

export function isAgentOnline(tenantId: string): boolean {
  const sockets = agentPresence.get(tenantId);
  return !!sockets && sockets.size > 0;
}

io.on("connection", (socket) => {
  logger.debug({ socketId: socket.id }, "Client connected");

  socket.on("join:tenant", (tenantId: string) => {
    socket.join(`tenant:${tenantId}`);
    logger.debug({ socketId: socket.id, tenantId }, "Joined tenant room");
    // Track as online agent
    if (!agentPresence.has(tenantId)) agentPresence.set(tenantId, new Set());
    agentPresence.get(tenantId)!.add(socket.id);
    agentSocketTenant.set(socket.id, tenantId);
  });

  socket.on("join:conversation", async (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
    logger.debug({ socketId: socket.id, conversationId }, "Joined conversation room");

    // Track presence
    if (!presence.has(conversationId)) {
      // Look up tenantId once
      try {
        const [conv] = await db.select({ tenantId: conversations.tenantId, subject: conversations.subject })
          .from(conversations).where(eq(conversations.id, conversationId)).limit(1);
        if (conv) {
          presence.set(conversationId, { tenantId: conv.tenantId, sockets: new Set([socket.id]) });
          socketConv.set(socket.id, conversationId);
          io.to(`tenant:${conv.tenantId}`).emit("conversation:active", { conversationId, subject: conv.subject });
        }
      } catch { /* ignore */ }
    } else {
      const entry = presence.get(conversationId)!;
      entry.sockets.add(socket.id);
      socketConv.set(socket.id, conversationId);
      // Re-emit active in case the dashboard missed it
      io.to(`tenant:${entry.tenantId}`).emit("conversation:active", { conversationId });
    }
  });

  socket.on("join:document", (documentId: string) => {
    socket.join(`document:${documentId}`);
  });

  socket.on("agent:typing", (conversationId: string) => {
    socket.to(`conversation:${conversationId}`).emit("agent:typing");
  });

  socket.on("disconnect", () => {
    logger.debug({ socketId: socket.id }, "Client disconnected");

    // Clean up visitor presence
    const conversationId = socketConv.get(socket.id);
    if (conversationId) {
      socketConv.delete(socket.id);
      const entry = presence.get(conversationId);
      if (entry) {
        entry.sockets.delete(socket.id);
        if (entry.sockets.size === 0) {
          io.to(`tenant:${entry.tenantId}`).emit("conversation:inactive", { conversationId });
          presence.delete(conversationId);
        }
      }
    }

    // Clean up agent presence
    const tenantId = agentSocketTenant.get(socket.id);
    if (tenantId) {
      agentSocketTenant.delete(socket.id);
      const agentSockets = agentPresence.get(tenantId);
      if (agentSockets) {
        agentSockets.delete(socket.id);
        if (agentSockets.size === 0) agentPresence.delete(tenantId);
      }
    }
  });
});

export { io };

const PORT = parseInt(process.env.PORT ?? env.PORT, 10);
server.listen(PORT, "0.0.0.0", () => {
  logger.info({ port: PORT, env: env.NODE_ENV }, "AskBase API server started");
  startIngestionWorker();
});
