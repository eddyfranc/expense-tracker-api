import { buildPaginationMeta, parsePaginationParams } from "../../src/utils/pagination.js";

describe("Financial & Utility Calculations", () => {
  describe("Pagination Calculations", () => {
    it("should parse default pagination when not provided", () => {
      const result = parsePaginationParams();
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it("should parse valid pagination params", () => {
      const result = parsePaginationParams("3", "15");
      expect(result).toEqual({ page: 3, limit: 15 });
    });

    it("should clamp invalid pagination inputs", () => {
      const result = parsePaginationParams("-5", "500");
      expect(result.page).toBe(1);
      expect(result.limit).toBe(100); // max clamp is 100
    });

    it("should build correct pagination metadata", () => {
      const meta = buildPaginationMeta(55, 2, 20);
      expect(meta).toEqual({
        page: 2,
        limit: 20,
        total_items: 55,
        total_pages: 3,
        has_next_page: true,
        has_prev_page: true,
      });
    });

    it("should handle first page pagination metadata", () => {
      const meta = buildPaginationMeta(5, 1, 20);
      expect(meta).toEqual({
        page: 1,
        limit: 20,
        total_items: 5,
        total_pages: 1,
        has_next_page: false,
        has_prev_page: false,
      });
    });
  });

  describe("Minor Unit / Cents Financial Arithmetic", () => {
    it("should accurately convert decimal currency to integer minor units", () => {
      expect(Math.round(15.5 * 100)).toBe(1550);
      expect(Math.round(10.99 * 100)).toBe(1099);
      expect(Math.round(0.01 * 100)).toBe(1);
      expect(Math.round(1234.56 * 100)).toBe(123456);
    });

    it("should prevent floating-point precision loss when computing balances", () => {
      // Classic JS float bug: 0.1 + 0.2 === 0.30000000000000004
      const income1Cents = Math.round(0.1 * 100); // 10
      const income2Cents = Math.round(0.2 * 100); // 20
      const totalCents = income1Cents + income2Cents; // 30
      expect(totalCents / 100).toBe(0.3);
    });

    it("should accurately calculate savings rate percentage", () => {
      const totalIncomeCents = 150000;
      const totalExpensesCents = 82300;
      const balanceCents = totalIncomeCents - totalExpensesCents;
      const savingsRate =
        Math.round(((totalIncomeCents - totalExpensesCents) / totalIncomeCents) * 10000) / 100;

      expect(balanceCents).toBe(67700);
      expect(balanceCents / 100).toBe(677);
      expect(savingsRate).toBe(45.13);
    });

    it("should calculate category breakdown percentages correctly", () => {
      const totalSpendingCents = 72300;
      const foodCents = 18500;
      const transportCents = 12000;
      const rentCents = 35000;
      const entertainmentCents = 6800;

      const foodPercent = Math.round((foodCents / totalSpendingCents) * 10000) / 100;
      const transportPercent = Math.round((transportCents / totalSpendingCents) * 10000) / 100;
      const rentPercent = Math.round((rentCents / totalSpendingCents) * 10000) / 100;
      const entertainmentPercent = Math.round((entertainmentCents / totalSpendingCents) * 10000) / 100;

      expect(foodPercent).toBe(25.59);
      expect(transportPercent).toBe(16.6);
      expect(rentPercent).toBe(48.41);
      expect(entertainmentPercent).toBe(9.41);
      expect(foodPercent + transportPercent + rentPercent + entertainmentPercent).toBeCloseTo(100, 1);
    });
  });
});
