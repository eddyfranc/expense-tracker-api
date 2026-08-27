import request from "supertest";
import { createApp } from "../../src/app.js";
import { generateAccessToken } from "../../src/utils/jwt.js";

// Mock database interactions
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

describe("Expenses & Reports Integration API", () => {
  const app = createApp();
  const testUserId = "987e6543-e21b-43d2-b654-426614174000";
  const validToken = generateAccessToken({
    userId: testUserId,
    email: "testuser@example.com",
  });

  describe("POST /api/v1/expenses", () => {
    it("should reject creation if amount is negative or zero", async () => {
      const response = await request(app)
        .post("/api/v1/expenses")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          amount: -15.5,
          categoryId: "123e4567-e89b-12d3-a456-426614174000",
          description: "Invalid expense",
          expenseDate: "2026-08-27",
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("ValidationError");
    });

    it("should reject creation if categoryId is not a valid UUID", async () => {
      const response = await request(app)
        .post("/api/v1/expenses")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          amount: 50.0,
          categoryId: "non-uuid-category",
          description: "Coffee",
          expenseDate: "2026-08-27",
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it("should reject creation if expenseDate is invalid", async () => {
      const response = await request(app)
        .post("/api/v1/expenses")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          amount: 25.0,
          categoryId: "123e4567-e89b-12d3-a456-426614174000",
          description: "Lunch",
          expenseDate: "invalid-date-string",
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/expenses (Query Validation)", () => {
    it("should reject invalid year query parameter", async () => {
      const response = await request(app)
        .get("/api/v1/expenses?year=1800")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it("should reject invalid month query parameter", async () => {
      const response = await request(app)
        .get("/api/v1/expenses?month=15")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it("should reject invalid sort option", async () => {
      const response = await request(app)
        .get("/api/v1/expenses?sort=unknown_sort_field")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/reports/monthly", () => {
    it("should require both year and month query parameters", async () => {
      const response = await request(app)
        .get("/api/v1/reports/monthly?year=2026")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it("should reject invalid month numbers", async () => {
      const response = await request(app)
        .get("/api/v1/reports/monthly?year=2026&month=0")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });
});
