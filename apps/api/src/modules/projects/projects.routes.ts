import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate, requireRole } from "../../common/middleware/auth.middleware";
import { env } from "../../config/env";
import {
  listProjects, getProject, createProject, updateProject,
  deleteProject, hardDeleteProject, generatePrompt, generateConfig,
  generateIntent, generateTrigger, previewChat, initializeProject,
  generateFlowBot, initializeFlowBot, createFlowOnly, generateSetupGuide,
  generateOpeningMessages, livePreview, regenerateKey,
} from "./projects.controller";

const router = Router();
router.use(authenticate);

// Tight rate limit for preview-chat (AI calls per user)
const previewChatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 30 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "development",
});

router.get("/", listProjects);
router.get("/:id", getProject);
router.post("/", requireRole("owner", "admin"), createProject);
router.patch("/:id", requireRole("owner", "admin"), updateProject);
router.delete("/:id", requireRole("owner", "admin"), deleteProject);           // soft deactivate
router.delete("/:id/permanent", requireRole("owner"), hardDeleteProject);      // hard delete (owner only)
router.post("/generate-prompt", generatePrompt);
router.post("/generate-config", generateConfig);
router.post("/generate-intent", generateIntent);
router.post("/generate-trigger", generateTrigger);
router.post("/generate-flow-bot", generateFlowBot);
router.post("/preview-chat", previewChatLimiter, previewChat);
router.post("/initialize", requireRole("owner", "admin"), initializeProject);
router.post("/initialize-flow", requireRole("owner", "admin"), initializeFlowBot);
router.post("/create-flow-only", requireRole("owner", "admin"), createFlowOnly);
router.post("/generate-setup-guide", generateSetupGuide);
router.post("/generate-opening-messages", generateOpeningMessages);
router.post("/:id/live-preview", livePreview);
router.post("/:id/regenerate-key", requireRole("owner", "admin"), regenerateKey);

export default router;
