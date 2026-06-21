import { Router } from "express";
import { authenticate, requireRole } from "../../common/middleware/auth.middleware";
import { listMembers, inviteMember, updateMemberRole, removeMember } from "./team.controller";

const router = Router();
router.use(authenticate);

router.get("/",           listMembers);
router.post("/",          requireRole("owner", "admin"), inviteMember);
router.patch("/:id/role", requireRole("owner", "admin"), updateMemberRole);
router.delete("/:id",     requireRole("owner", "admin"), removeMember);

export default router;
