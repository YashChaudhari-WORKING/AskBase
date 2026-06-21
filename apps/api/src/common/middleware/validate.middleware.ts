import type { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { error } from "../utils/response";

export function validate(schema: ZodSchema, source: "body" | "params" | "query" = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return error(res, "Validation failed", 422, "VALIDATION_ERROR", result.error.flatten());
    }
    req[source] = result.data;
    next();
  };
}
