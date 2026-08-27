import { UserRepository } from "./user.repository.js";
import { NotFoundError, UnauthorizedError } from "../../utils/errors.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import type { UpdateProfileInput, ChangePasswordInput } from "./user.schema.js";

export interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  constructor(private readonly userRepository: UserRepository = new UserRepository()) {}

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfileResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updated = await this.userRepository.update(userId, {
      ...(input.firstName ? { firstName: input.firstName } : {}),
      ...(input.lastName ? { lastName: input.lastName } : {}),
    });

    if (!updated) {
      throw new NotFoundError("User not found");
    }

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isMatch = await comparePassword(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    const newPasswordHash = await hashPassword(input.newPassword);
    await this.userRepository.update(userId, { passwordHash: newPasswordHash });
  }
}
