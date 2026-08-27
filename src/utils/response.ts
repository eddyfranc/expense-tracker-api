import type { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
  const responseBody: ApiResponse<T> = {
    success: true,
    ...(message ? { message } : {}),
    data,
  };
  return res.status(statusCode).json(responseBody);
}

export function sendCreated<T>(res: Response, data: T, message = "Resource created successfully"): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message?: string,
  statusCode = 200
): Response {
  const responseBody: ApiResponse<T[]> = {
    success: true,
    ...(message ? { message } : {}),
    data,
    meta: {
      pagination,
    },
  };
  return res.status(statusCode).json(responseBody);
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}
