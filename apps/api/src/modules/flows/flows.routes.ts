import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.middleware";
import * as ctrl from "./flows.controller";

const router = Router();

// Public — no auth — widget reads flow nodes and submits leads
router.get("/public/:flowId", ctrl.getFlowPublic);
router.post("/public/:flowId/submit", ctrl.submitFlowLead);

router.use(authenticate);

router.get("/", ctrl.listFlows);
router.post("/", ctrl.createFlow);
router.get("/:id", ctrl.getFlow);
router.put("/:id", ctrl.updateFlow);
router.delete("/:id", ctrl.deleteFlow);
router.get("/:id/leads", ctrl.getFlowLeads);
router.patch("/:id/leads/:leadId", ctrl.updateFlowLead);
router.post("/generate", ctrl.generateFlow);

export default router;
