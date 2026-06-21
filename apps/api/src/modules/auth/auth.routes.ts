import { Router } from "express";
import { register, login, refresh, logout, me, updateProfile, verifyEmail } from "./auth.controller";
import { validate } from "../../common/middleware/validate.middleware";
import { authenticate } from "../../common/middleware/auth.middleware";
import { RegisterTenantSchema, LoginSchema } from "@askbase/shared";

const router = Router();

router.post("/register", validate(RegisterTenantSchema), register);
router.get("/verify-email", verifyEmail);
router.post("/login",    validate(LoginSchema), login);
router.post("/refresh",  refresh);  // reads cookie — no body schema needed
router.post("/logout",   logout);
router.get("/me",        authenticate, me);
router.patch("/profile", authenticate, updateProfile);

export default router;
