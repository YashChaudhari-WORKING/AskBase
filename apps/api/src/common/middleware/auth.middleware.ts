import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { error } from "../utils/response";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: "owner" | "admin" | "agent";
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  // cookie-first (dashboard), then Bearer header (API clients / widget)
  const cookieToken = (req as any).cookies?.access_token as string | undefined;
  const headerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;

  const token = cookieToken ?? headerToken;
  if (!token) return error(res, "Unauthorized", 401, "UNAUTHORIZED");

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      tenantId: payload.tenantId,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    return error(res, "Invalid or expired token", 401, "INVALID_TOKEN");
  }
}

export function requireRole(...roles: Array<"owner" | "admin" | "agent">) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return error(res, "Forbidden", 403, "FORBIDDEN");
    }
    next();
  };
}
