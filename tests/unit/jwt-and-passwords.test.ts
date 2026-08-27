import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "../../src/utils/jwt.js";
import { hashPassword, comparePassword } from "../../src/utils/password.js";

describe("Security Utilities", () => {
  describe("Password Hashing", () => {
    it("should hash and verify passwords correctly", async () => {
      const plainPassword = "SuperSecretPassword123!";
      const hash = await hashPassword(plainPassword);

      expect(hash).not.toBe(plainPassword);
      expect(hash).toHaveLength(60); // bcrypt hash length

      const isValid = await comparePassword(plainPassword, hash);
      expect(isValid).toBe(true);

      const isInvalid = await comparePassword("WrongPassword", hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe("JWT Token Utilities", () => {
    const mockUser = {
      userId: "123e4567-e89b-12d3-a456-426614174000",
      email: "user@example.com",
    };

    it("should generate and verify valid access tokens", () => {
      const token = generateAccessToken(mockUser);
      expect(typeof token).toBe("string");

      const payload = verifyAccessToken(token);
      expect(payload.userId).toBe(mockUser.userId);
      expect(payload.email).toBe(mockUser.email);
    });

    it("should generate and verify valid refresh tokens", () => {
      const token = generateRefreshToken(mockUser);
      expect(typeof token).toBe("string");

      const payload = verifyRefreshToken(token);
      expect(payload.userId).toBe(mockUser.userId);
      expect(payload.email).toBe(mockUser.email);
    });

    it("should reject corrupted tokens", () => {
      expect(() => verifyAccessToken("invalid.jwt.token")).toThrow();
    });
  });
});
