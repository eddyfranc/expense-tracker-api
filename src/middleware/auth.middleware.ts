import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../utils/errors.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authentication token is missing or malformed"));
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return next(new UnauthorizedError("Authentication token is missing"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
    };
    return next();
  } catch (error) {
    return next(error);
  }
}
