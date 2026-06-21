import { Router } from "express";
import { authenticate, requireRole } from "../../common/middleware/auth.middleware";
import {
  listKnowledgeBases, createKnowledgeBase, updateKnowledgeBase,
  deleteKnowledgeBase, getKnowledgeBaseDocuments, clearKnowledgeBase,
} from "./knowledge-bases.controller";

const router = Router();
router.use(authenticate);

router.get("/", listKnowledgeBases);
router.post("/", requireRole("owner", "admin"), createKnowledgeBase);
router.patch("/:id", requireRole("owner", "admin"), updateKnowledgeBase);
router.delete("/:id", requireRole("owner", "admin"), deleteKnowledgeBase);
router.get("/:id/documents", getKnowledgeBaseDocuments);
router.delete("/:id/clear", requireRole("owner", "admin"), clearKnowledgeBase);

export default router;
