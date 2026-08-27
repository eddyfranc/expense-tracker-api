import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import { authRateLimiter } from "../../middleware/rate-limiter.middleware.js";
import { registerSchema, loginSchema, refreshTokenSchema } from "./auth.schema.js";

const router = Router();
const authController = new AuthController();

router.post(
  "/register",
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  authController.register
);

router.post(
  "/login",
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  authController.login
);

router.post(
  "/refresh",
  validateRequest({ body: refreshTokenSchema }),
  authController.refresh
);

router.post(
  "/logout",
  validateRequest({ body: refreshTokenSchema }),
  authController.logout
);

export default router;
