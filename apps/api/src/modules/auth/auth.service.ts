import { db, tenants, users, widgetThemes } from "@askbase/database";
import { eq, and } from "drizzle-orm";
import { hashPassword, comparePassword } from "../../common/utils/hash";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../common/utils/jwt";
import { isDisposableEmail } from "../../common/utils/disposable-emails";
import { sendVerificationEmail } from "../../common/utils/email";
import type { RegisterTenantInput, LoginInput } from "@askbase/shared";
import { DEFAULT_THEMES } from "../widget-themes/default-themes";
import { randomUUID } from "crypto";

export class AuthService {
  async register(input: RegisterTenantInput) {
    if (isDisposableEmail(input.email)) {
      throw new Error("Please use a real email address. Disposable email services are not allowed.");
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
    if (existing.length > 0) throw new Error("An account with this email already exists.");

    const slug = input.tenantName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const [tenant] = await db.insert(tenants).values({
      name: input.tenantName,
      slug: `${slug}-${Date.now()}`,
      email: input.email,
    }).returning();

    await db.insert(widgetThemes).values(DEFAULT_THEMES.map(t => ({ ...t, tenantId: tenant.id })));

    const passwordHash = await hashPassword(input.password);
    const verificationToken = randomUUID();
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const [user] = await db.insert(users).values({
      tenantId: tenant.id,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: "owner",
      emailVerified: false,
      verificationToken,
      verificationTokenExpiresAt,
    }).returning();

    await sendVerificationEmail(user.email, user.firstName, verificationToken);

    return { requiresVerification: true };
  }

  async verifyEmail(token: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token))
      .limit(1);

    if (!user) throw new Error("Invalid or expired verification link.");
    if (!user.verificationTokenExpiresAt || user.verificationTokenExpiresAt < new Date()) {
      throw new Error("This verification link has expired. Please register again.");
    }

    await db.update(users).set({
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    }).where(eq(users.id, user.id));

    const tokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role as "owner",
    };

    return {
      user: { ...user, passwordHash: undefined, verificationToken: undefined },
      accessToken: signAccessToken(tokenPayload),
      refreshToken: signRefreshToken(tokenPayload),
    };
  }

  async login(input: LoginInput) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (!user) throw new Error("Invalid credentials");

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) throw new Error("Invalid credentials");

    if (!user.isActive) throw new Error("Account is deactivated");

    if (!user.emailVerified) {
      throw new Error("Please verify your email before signing in. Check your inbox.");
    }

    const tokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role as "owner" | "admin" | "agent",
    };

    return {
      user: { ...user, passwordHash: undefined },
      accessToken: signAccessToken(tokenPayload),
      refreshToken: signRefreshToken(tokenPayload),
    };
  }

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, payload.sub), eq(users.isActive, true)))
      .limit(1);

    if (!user) throw new Error("User not found");

    const tokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role as "owner" | "admin" | "agent",
    };

    return {
      accessToken: signAccessToken(tokenPayload),
      refreshToken: signRefreshToken(tokenPayload),
    };
  }
}
