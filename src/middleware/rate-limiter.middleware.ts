import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RateLimitExceeded",
      message: "Too many requests from this IP, please try again later",
    },
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // stricter limit for login/register attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RateLimitExceeded",
      message: "Too many authentication attempts, please try again after 15 minutes",
    },
  },
});
