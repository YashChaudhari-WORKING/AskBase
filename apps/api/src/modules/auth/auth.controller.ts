import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { success, error } from "../../common/utils/response";
import type { AuthRequest } from "../../common/middleware/auth.middleware";
import { db, users, tenants } from "@askbase/database";
import { eq, and } from "drizzle-orm";
import { hash, compare } from "bcryptjs";

const authService = new AuthService();
const IS_PROD = process.env.NODE_ENV === "production";

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token", { path: "/api/auth" });
}

export async function register(req: Request, res: Response) {
  try {
    const result = await authService.register(req.body);
    return success(res, result, "Verification email sent", 201);
  } catch (err: any) {
    return error(res, err.message, 400);
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const token = req.query.token as string;
    if (!token) return error(res, "Verification token required", 400);
    const result = await authService.verifyEmail(token);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return success(res, { user: result.user }, "Email verified successfully");
  } catch (err: any) {
    return error(res, err.message, 400);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const result = await authService.login(req.body);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return success(res, { user: result.user }, "Login successful");
  } catch (err: any) {
    return error(res, err.message, 401);
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    // cookie-first, body fallback for any legacy clients
    const token = (req as any).cookies?.refresh_token ?? req.body?.refreshToken;
    if (!token) return error(res, "Refresh token required", 401);

    const result = await authService.refresh(token);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return success(res, {}); // tokens live in cookies — nothing in body
  } catch {
    clearAuthCookies(res);
    return error(res, "Session expired. Please sign in again.", 401);
  }
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookies(res);
  return success(res, null, "Signed out");
}

export async function me(req: AuthRequest, res: Response) {
  try {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      avatarUrl: users.avatarUrl,
      tenantId: users.tenantId,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, req.user!.id)).limit(1);

    if (!user) return error(res, "User not found", 404);

    const [tenant] = await db.select({ id: tenants.id, name: tenants.name, slug: tenants.slug, plan: tenants.plan })
      .from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);

    return success(res, {
      ...user,
      name: `${user.firstName} ${user.lastName}`.trim(),
      tenant: tenant ?? null,
    });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const { firstName, lastName, currentPassword, newPassword } = req.body;
    const updates: Record<string, any> = { updatedAt: new Date() };

    if (firstName?.trim()) updates.firstName = firstName.trim();
    if (lastName?.trim()) updates.lastName = lastName.trim();

    if (newPassword) {
      if (!currentPassword) return error(res, "Current password required", 400);
      const [user] = await db.select({ passwordHash: users.passwordHash })
        .from(users).where(eq(users.id, req.user!.id)).limit(1);
      if (!user) return error(res, "User not found", 404);
      const valid = await compare(currentPassword, user.passwordHash);
      if (!valid) return error(res, "Current password is incorrect", 400);
      updates.passwordHash = await hash(newPassword, 12);
    }

    const [updated] = await db.update(users).set(updates)
      .where(eq(users.id, req.user!.id))
      .returning({ firstName: users.firstName, lastName: users.lastName, email: users.email, role: users.role });

    return success(res, { ...updated, name: `${updated.firstName} ${updated.lastName}`.trim() });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}
