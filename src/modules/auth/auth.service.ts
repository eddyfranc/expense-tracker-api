import { AuthRepository } from "./auth.repository.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { ConflictError, UnauthorizedError } from "../../utils/errors.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: Date;
  };
  tokens: AuthTokens;
}

export class AuthService {
  constructor(private readonly authRepository: AuthRepository = new AuthRepository()) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await this.authRepository.findUserByEmail(input.email);
    if (existingUser) {
      throw new ConflictError("A user with this email address already exists");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.authRepository.createUserWithDefaults({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const tokens = this.generateTokens(user.id, user.email);

    // Save refresh token with 7 days expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.authRepository.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const tokens = this.generateTokens(user.id, user.email);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.authRepository.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  async refreshTokens(oldRefreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(oldRefreshToken);

    const savedToken = await this.authRepository.findValidRefreshToken(oldRefreshToken);
    if (!savedToken) {
      throw new UnauthorizedError("Refresh token is invalid, expired, or revoked");
    }

    // Revoke the old refresh token (Token Rotation)
    await this.authRepository.revokeRefreshToken(oldRefreshToken);

    // Issue new pair
    const newTokens = this.generateTokens(payload.userId, payload.email);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.authRepository.saveRefreshToken(payload.userId, newTokens.refreshToken, expiresAt);

    return newTokens;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.authRepository.revokeRefreshToken(refreshToken);
  }

  private generateTokens(userId: string, email: string): AuthTokens {
    const accessToken = generateAccessToken({ userId, email });
    const refreshToken = generateRefreshToken({ userId, email });
    return { accessToken, refreshToken };
  }
}
