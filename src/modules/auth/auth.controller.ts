import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { sendCreated, sendSuccess } from "../../utils/response.js";
import type { RegisterInput, LoginInput, RefreshTokenInput } from "./auth.schema.js";

export class AuthController {
  constructor(private readonly authService: AuthService = new AuthService()) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as RegisterInput;
      const result = await this.authService.register(input);
      sendCreated(res, result, "User registered successfully");
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as LoginInput;
      const result = await this.authService.login(input);
      sendSuccess(res, result, "Login successful");
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as RefreshTokenInput;
      const tokens = await this.authService.refreshTokens(refreshToken);
      sendSuccess(res, tokens, "Tokens refreshed successfully");
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as RefreshTokenInput;
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }
      sendSuccess(res, null, "Logout successful");
    } catch (error) {
      next(error);
    }
  };
}
