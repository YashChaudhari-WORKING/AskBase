import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { logger } from "./common/utils/logger";
import { errorHandler, notFound } from "./common/middleware/error.middleware";
import authRoutes from "./modules/auth/auth.routes";
import knowledgeRoutes from "./modules/knowledge/knowledge.routes";
import chatRoutes from "./modules/chat/chat.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import keysRoutes from "./modules/keys/keys.routes";
import agentConsoleRoutes from "./modules/agents/agent-console.routes";
import agentsRoutes from "./modules/agents/agents.routes";
import projectsRoutes from "./modules/projects/projects.routes";
import knowledgeBasesRoutes from "./modules/knowledge-bases/knowledge-bases.routes";
import flowsRoutes from "./modules/flows/flows.routes";
import widgetThemesRoutes from "./modules/widget-themes/widget-themes.routes";
import teamRoutes from "./modules/team/team.routes";
import { env } from "./config/env";

const app = express();

app.use(helmet());

// Unified CORS: widget routes allow any origin, dashboard routes are strict
app.use((req, res, next) => {
  const isWidgetRoute =
    req.path === "/api/chat/message" ||
    req.path.startsWith("/api/knowledge/config") ||
    req.path.startsWith("/api/flows/public");

  if (isWidgetRoute) {
    res.header("Access-Control-Allow-Origin", req.headers.origin ?? "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, x-api-key");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    return next();
  }

  return cors({ origin: env.CORS_ORIGIN, credentials: true })(req, res, next);
});
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({
  logger,
  customSuccessMessage: (req, res, responseTime) =>
    `${req.method} ${req.url} → ${res.statusCode} (${responseTime}ms)`,
  customErrorMessage: (req, res, err, responseTime) =>
    `${req.method} ${req.url} → ${res.statusCode} (${responseTime}ms) ${err?.message ?? ""}`,
  serializers: { req: () => undefined, res: () => undefined },
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 200 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "development",
}));

app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/keys", keysRoutes);
app.use("/api/console", agentConsoleRoutes);
app.use("/api/agents", agentsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/knowledge-bases", knowledgeBasesRoutes);
app.use("/api/flows", flowsRoutes);
app.use("/api/widget-themes", widgetThemesRoutes);
app.use("/api/team", teamRoutes);

app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== "production") {
  const routes = [
    "POST   /api/auth/register",
    "POST   /api/auth/login",
    "POST   /api/auth/logout",
    "GET    /api/auth/me",
    "GET    /api/auth/verify-email",
    "POST   /api/auth/refresh",
    "GET    /api/knowledge/*",
    "POST   /api/knowledge/*",
    "GET    /api/chat/*",
    "POST   /api/chat/*",
    "GET    /api/analytics/*",
    "GET    /api/agents/*",
    "POST   /api/agents/*",
    "GET    /api/flows/*",
    "POST   /api/flows/*",
    "GET    /api/keys/*",
    "POST   /api/keys/*",
    "GET    /api/team/*",
    "GET    /api/widget-themes/*",
  ];
  logger.info(`\n  Routes registered:\n${routes.map(r => `    ${r}`).join("\n")}\n`);
}

export default app;
