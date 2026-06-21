import { Router } from "express";
import { sendMessage, getConversation, listConversations, resolveConversation, agentReply } from "./chat.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { SendMessageSchema, ResolveConversationSchema } from "@askbase/shared";
import { apiKeyAuth } from "../../common/middleware/apikey.middleware";

const router = Router();

router.post("/message", apiKeyAuth, validate(SendMessageSchema), sendMessage);
router.get("/", authenticate, listConversations);
router.get("/:id", authenticate, getConversation);
router.post("/:id/reply", authenticate, agentReply);
router.post("/:id/resolve", authenticate, validate(ResolveConversationSchema), resolveConversation);

export default router;
