import { Router } from "express";
import { getOverview } from "./analytics.controller";
import { authenticate } from "../../common/middleware/auth.middleware";

const router = Router();
router.use(authenticate);
router.get("/overview", getOverview);

export default router;
