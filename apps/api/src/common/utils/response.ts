import type { Response } from "express";
import type { ApiResponse, PaginatedResponse } from "@askbase/shared";

export function success<T>(res: Response, data: T, message?: string, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, message } satisfies ApiResponse<T>);
}

export function error(res: Response, message: string, statusCode = 400, code?: string, details?: unknown) {
  return res.status(statusCode).json({ success: false, error: message, code, details } satisfies ApiResponse);
}

export function paginated<T>(res: Response, data: T[], total: number, page: number, limit: number) {
  return res.status(200).json({
    success: true,
    data: { data, total, page, limit, hasNext: page * limit < total } satisfies PaginatedResponse<T>,
  });
}
