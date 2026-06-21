import { Router } from "express";
import multer from "multer";
import path from "path";
import { uploadDocument, listDocuments, deleteDocument, scrapeUrl, getDocumentChunks, discoverPages, clearTenantData } from "./knowledge.controller";
import { authenticate, requireRole } from "../../common/middleware/auth.middleware";
import { apiKeyAuth } from "../../common/middleware/apikey.middleware";
import { getConfig, updateConfig } from "./config.controller";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".txt", ".md", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

const router = Router();

// Public config fetch — widget reads this via x-api-key
router.get("/config/public", apiKeyAuth, getConfig);

router.use(authenticate);
router.get("/", listDocuments);
router.post("/upload", requireRole("owner", "admin"), upload.single("file"), uploadDocument);
router.post("/scrape", requireRole("owner", "admin"), scrapeUrl);
router.post("/discover", requireRole("owner", "admin"), discoverPages);
router.get("/:id/chunks", getDocumentChunks);
router.delete("/:id", requireRole("owner", "admin"), deleteDocument);

router.delete("/clear", requireRole("owner", "admin"), clearTenantData);
router.get("/config", getConfig);
router.patch("/config", updateConfig);

export default router;
