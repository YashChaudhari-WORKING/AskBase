import { db, users } from "@askbase/database";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { hashPassword } from "../../common/utils/hash";

export class AgentsService {
  async list(tenantId: string) {
    return db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.tenantId, tenantId));
  }

  async invite(tenantId: string, data: { email: string; firstName: string; lastName: string; role: string }) {
    const existing = await db.select({ id: users.id }).from(users)
      .where(and(eq(users.email, data.email), eq(users.tenantId, tenantId))).limit(1);
    if (existing.length > 0) throw new Error("Agent with this email already exists");

    const temporaryPassword = randomBytes(16).toString("hex");
    const passwordHash = await hashPassword(temporaryPassword);

    const [user] = await db.insert(users).values({
      tenantId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role as any,
      passwordHash,
    }).returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      createdAt: users.createdAt,
    });
    return user;
  }

  async updateRole(tenantId: string, agentId: string, role: string) {
    const [updated] = await db.update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(and(eq(users.id, agentId), eq(users.tenantId, tenantId)))
      .returning({ id: users.id, role: users.role });
    if (!updated) throw new Error("Agent not found");
    return updated;
  }

  async setActive(tenantId: string, agentId: string, isActive: boolean) {
    const [updated] = await db.update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(users.id, agentId), eq(users.tenantId, tenantId)))
      .returning({ id: users.id, isActive: users.isActive });
    if (!updated) throw new Error("Agent not found");
    return updated;
  }

  async remove(tenantId: string, agentId: string) {
    await db.delete(users).where(and(eq(users.id, agentId), eq(users.tenantId, tenantId)));
    return { deleted: true };
  }
}
