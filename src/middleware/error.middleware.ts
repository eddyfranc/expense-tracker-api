import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.name,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Handle Postgres Unique Constraint Violation (code 23505)
  if ("code" in err && err.code === "23505") {
    res.status(409).json({
      success: false,
      error: {
        code: "ConflictError",
        message: "A record with the given unique value already exists",
      },
    });
    return;
  }

  // Handle Postgres Foreign Key Violation (code 23503)
  if ("code" in err && err.code === "23503") {
    res.status(400).json({
      success: false,
      error: {
        code: "ForeignKeyViolationError",
        message: "Referenced resource does not exist or cannot be modified",
      },
    });
    return;
  }

  // Handle SyntaxError in JSON body parsing
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    res.status(400).json({
      success: false,
      error: {
        code: "InvalidJsonError",
        message: "Malformed JSON payload in request body",
      },
    });
    return;
  }

  // Log unexpected errors
  console.error("💥 Unhandled Error:", err);

  const isDevelopment = env.NODE_ENV === "development";
  res.status(500).json({
    success: false,
    error: {
      code: "InternalServerError",
      message: isDevelopment ? err.message : "An unexpected internal server error occurred",
      ...(isDevelopment ? { stack: err.stack } : {}),
    },
  });
}
