import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.middleware";
import {
  listWidgetThemes,
  getWidgetTheme,
  createWidgetTheme,
  updateWidgetTheme,
  deleteWidgetTheme,
  generateWidgetTheme,
} from "./widget-themes.controller";

const router = Router();

router.use(authenticate);

router.get("/", listWidgetThemes);
router.post("/", createWidgetTheme);
router.post("/generate", generateWidgetTheme);
router.get("/:id", getWidgetTheme);
router.patch("/:id", updateWidgetTheme);
router.delete("/:id", deleteWidgetTheme);

export default router;
