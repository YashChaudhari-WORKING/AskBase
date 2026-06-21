import type { Response } from "express";
import type { AuthRequest } from "../../common/middleware/auth.middleware";
import { db, users } from "@askbase/database";
import { eq, and, ne } from "drizzle-orm";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { success, error } from "../../common/utils/response";

export async function listMembers(req: AuthRequest, res: Response) {
  try {
    const members = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.tenantId, req.user!.tenantId));

    return success(res, members.map(m => ({
      ...m,
      name: `${m.firstName} ${m.lastName}`.trim(),
    })));
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function inviteMember(req: AuthRequest, res: Response) {
  try {
    const { email, firstName, lastName, role = "agent" } = req.body;
    if (!email?.trim() || !firstName?.trim()) return error(res, "Email and first name required", 400);

    const existing = await db.select({ id: users.id })
      .from(users).where(and(eq(users.tenantId, req.user!.tenantId), eq(users.email, email.trim().toLowerCase()))).limit(1);
    if (existing.length) return error(res, "A member with this email already exists", 409);

    // Generate a temporary password — member should reset on first login
    const tempPassword = randomBytes(8).toString("hex");
    const passwordHash = await hash(tempPassword, 12);

    const [member] = await db.insert(users).values({
      tenantId: req.user!.tenantId,
      email: email.trim().toLowerCase(),
      firstName: firstName.trim(),
      lastName: (lastName ?? "").trim(),
      passwordHash,
      role: role as "owner" | "admin" | "agent",
    }).returning({ id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName, role: users.role });

    return success(res, {
      ...member,
      name: `${member.firstName} ${member.lastName}`.trim(),
      tempPassword,
    }, "Member invited", 201);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function updateMemberRole(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!["owner", "admin", "agent"].includes(role)) return error(res, "Invalid role", 400);

    const [updated] = await db.update(users).set({ role, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.tenantId, req.user!.tenantId), ne(users.id, req.user!.id)))
      .returning({ id: users.id, role: users.role });

    if (!updated) return error(res, "Member not found or cannot update own role", 400);
    return success(res, updated);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

export async function removeMember(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (id === req.user!.id) return error(res, "Cannot remove yourself", 400);

    await db.update(users).set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.tenantId, req.user!.tenantId)));

    return success(res, { removed: true });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}
