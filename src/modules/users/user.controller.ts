import type { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service.js";
import { sendSuccess } from "../../utils/response.js";
import type { UpdateProfileInput, ChangePasswordInput } from "./user.schema.js";

export class UserController {
  constructor(private readonly userService: UserService = new UserService()) {}

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await this.userService.getProfile(userId);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input = req.body as UpdateProfileInput;
      const updated = await this.userService.updateProfile(userId, input);
      sendSuccess(res, updated, "Profile updated successfully");
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input = req.body as ChangePasswordInput;
      await this.userService.changePassword(userId, input);
      sendSuccess(res, null, "Password changed successfully");
    } catch (error) {
      next(error);
    }
  };
}
