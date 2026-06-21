import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { error } from "../utils/response";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
  return error(res, "Internal server error", 500, "INTERNAL_ERROR");
}

export function notFound(req: Request, res: Response) {
  return error(res, `Route ${req.method} ${req.path} not found`, 404, "NOT_FOUND");
}
