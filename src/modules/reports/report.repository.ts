import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { expenses, income, categories } from "../../db/schema/index.js";

export interface MonthlyTotals {
  totalExpenseCents: number;
  expenseCount: number;
  totalIncomeCents: number;
  incomeCount: number;
}

export interface CategorySpendingAggregate {
  categoryId: string;
  categoryName: string;
  color: string | null;
  icon: string | null;
  totalAmountCents: number;
  expenseCount: number;
}

export class ReportRepository {
  async getMonthlyTotals(userId: string, startDate: Date, endDate: Date): Promise<MonthlyTotals> {
    const [expenseResult, incomeResult] = await Promise.all([
      db
        .select({
          total: sql<number>`coalesce(sum(${expenses.amountCents}), 0)::bigint`,
          count: sql<number>`count(*)::int`,
        })
        .from(expenses)
        .where(
          and(
            eq(expenses.userId, userId),
            gte(expenses.expenseDate, startDate),
            lte(expenses.expenseDate, endDate)
          )
        ),
      db
        .select({
          total: sql<number>`coalesce(sum(${income.amountCents}), 0)::bigint`,
          count: sql<number>`count(*)::int`,
        })
        .from(income)
        .where(
          and(
            eq(income.userId, userId),
            gte(income.incomeDate, startDate),
            lte(income.incomeDate, endDate)
          )
        ),
    ]);

    return {
      totalExpenseCents: Number(expenseResult[0]?.total ?? 0),
      expenseCount: expenseResult[0]?.count ?? 0,
      totalIncomeCents: Number(incomeResult[0]?.total ?? 0),
      incomeCount: incomeResult[0]?.count ?? 0,
    };
  }

  async getSpendingByCategory(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CategorySpendingAggregate[]> {
    const rows = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        color: categories.color,
        icon: categories.icon,
        totalAmountCents: sql<number>`coalesce(sum(${expenses.amountCents}), 0)::bigint`,
        expenseCount: sql<number>`count(${expenses.id})::int`,
      })
      .from(expenses)
      .innerJoin(categories, eq(expenses.categoryId, categories.id))
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.expenseDate, startDate),
          lte(expenses.expenseDate, endDate)
        )
      )
      .groupBy(categories.id, categories.name, categories.color, categories.icon)
      .orderBy(sql`sum(${expenses.amountCents}) desc`);

    return rows.map((row) => ({
      ...row,
      totalAmountCents: Number(row.totalAmountCents),
    }));
  }

  async getCustomRangeTotals(userId: string, startDate: Date, endDate: Date): Promise<MonthlyTotals> {
    return this.getMonthlyTotals(userId, startDate, endDate);
  }
}
