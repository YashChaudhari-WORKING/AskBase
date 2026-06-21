import { Router } from "express";
import { listAgents, inviteAgent, updateAgentRole, deactivateAgent, activateAgent, removeAgent } from "./agents.controller";
import { authenticate } from "../../common/middleware/auth.middleware";

const router = Router();
router.use(authenticate);
router.get("/", listAgents);
router.post("/invite", inviteAgent);
router.patch("/:id/role", updateAgentRole);
router.patch("/:id/deactivate", deactivateAgent);
router.patch("/:id/activate", activateAgent);
router.delete("/:id", removeAgent);
export default router;
