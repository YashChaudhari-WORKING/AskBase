import { z } from "zod";

export const RegisterTenantSchema = z.object({
  tenantName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const InviteAgentSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(["admin", "agent"]),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterTenantInput = z.infer<typeof RegisterTenantSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type InviteAgentInput = z.infer<typeof InviteAgentSchema>;
