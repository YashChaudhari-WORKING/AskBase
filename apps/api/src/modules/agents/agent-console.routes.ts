import { Router } from "express";
import { getQueue, acceptHandoff, sendAgentMessage, resolveByAgent } from "./agent-console.controller";
import { authenticate } from "../../common/middleware/auth.middleware";

const router = Router();
router.use(authenticate);
router.get("/queue", getQueue);
router.post("/:conversationId/accept", acceptHandoff);
router.post("/:conversationId/message", sendAgentMessage);
router.post("/:conversationId/resolve", resolveByAgent);
export default router;
