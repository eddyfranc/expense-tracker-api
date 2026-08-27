import request from "supertest";
import { createApp } from "../../src/app.js";

// Mock database interactions for isolated fast integration testing
jest.mock("../../src/db/index.js", () => {
  return {
    pool: {
      query: jest.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] }),
      end: jest.fn().mockResolvedValue(undefined),
    },
    db: {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      transaction: jest.fn(),
    },
  };
});

describe("Auth & Health Integration API", () => {
  const app = createApp();

  describe("GET /api/v1/health", () => {
    it("should return healthy status code 200", async () => {
      const response = await request(app).get("/api/v1/health");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe("healthy");
      expect(response.body.database).toBe("connected");
    });
  });

  describe("POST /api/v1/auth/register", () => {
    it("should fail validation if email is invalid", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "invalid-email",
          password: "Password123!",
          firstName: "John",
          lastName: "Doe",
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("ValidationError");
    });

    it("should fail validation if password is too short", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "valid@example.com",
          password: "short",
          firstName: "John",
          lastName: "Doe",
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Protected Endpoints", () => {
    it("should return 401 when Authorization header is missing", async () => {
      const response = await request(app).get("/api/v1/expenses");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain("Authentication token is missing");
    });

    it("should return 401 when Bearer token is malformed", async () => {
      const response = await request(app)
        .get("/api/v1/expenses")
        .set("Authorization", "Bearer invalid-token-string");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
