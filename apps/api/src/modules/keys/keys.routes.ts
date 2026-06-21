import { Router } from "express";
import { listKeys, createKey, revokeKey } from "./keys.controller";
import { authenticate } from "../../common/middleware/auth.middleware";

const router = Router();
router.get("/", authenticate, listKeys);
router.post("/", authenticate, createKey);
router.delete("/:id", authenticate, revokeKey);
export default router;
