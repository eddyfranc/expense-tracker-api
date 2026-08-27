import { db } from "../../db/index.js";
import { budgets, categories, expenses } from "../../db/schema/index.js";
import { eq, and, sql } from "drizzle-orm";
import { NotFoundError, ConflictError } from "../../utils/errors.js";
import type { CreateBudgetInput, UpdateBudgetInput } from "./budget.schema.js";

export interface BudgetWithProgress {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  categoryIcon: string | null;
  year: number;
  month: number;
  amount: number;
  amountCents: number;
  spentAmount: number;
  spentAmountCents: number;
  remainingAmount: number;
  remainingAmountCents: number;
  percentageUsed: number;
  status: "under" | "warning" | "exceeded";
  createdAt: Date;
  updatedAt: Date;
}

export class BudgetService {
  async listBudgets(userId: string, year?: number, month?: number): Promise<BudgetWithProgress[]> {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    const startDate = new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));

    // 1. Fetch budgets for this user and month
    const userBudgets = await db
      .select({
        id: budgets.id,
        userId: budgets.userId,
        categoryId: budgets.categoryId,
        year: budgets.year,
        month: budgets.month,
        amountCents: budgets.amountCents,
        createdAt: budgets.createdAt,
        updatedAt: budgets.updatedAt,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
      })
      .from(budgets)
      .innerJoin(categories, eq(budgets.categoryId, categories.id))
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.year, currentYear),
          eq(budgets.month, currentMonth)
        )
      );

    // 2. Fetch actual expenses grouped by category for this period
    const spentByCategory = await db
      .select({
        categoryId: expenses.categoryId,
        totalSpentCents: sql<number>`coalesce(sum(${expenses.amountCents}), 0)::int`,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          sql`${expenses.expenseDate} >= ${startDate}`,
          sql`${expenses.expenseDate} <= ${endDate}`
        )
      )
      .groupBy(expenses.categoryId);

    const spentMap = new Map<string, number>();
    spentByCategory.forEach((row) => {
      spentMap.set(row.categoryId, Number(row.totalSpentCents));
    });

    return userBudgets.map((b) => {
      const spentCents = spentMap.get(b.categoryId) || 0;
      const remainingCents = b.amountCents - spentCents;
      const percentage = b.amountCents > 0 ? Math.round((spentCents / b.amountCents) * 10000) / 100 : 0;

      let status: "under" | "warning" | "exceeded" = "under";
      if (percentage >= 100) {
        status = "exceeded";
      } else if (percentage >= 80) {
        status = "warning";
      }

      return {
        id: b.id,
        userId: b.userId,
        categoryId: b.categoryId,
        categoryName: b.categoryName,
        categoryColor: b.categoryColor,
        categoryIcon: b.categoryIcon,
        year: b.year,
        month: b.month,
        amount: b.amountCents / 100,
        amountCents: b.amountCents,
        spentAmount: spentCents / 100,
        spentAmountCents: spentCents,
        remainingAmount: remainingCents / 100,
        remainingAmountCents: remainingCents,
        percentageUsed: percentage,
        status,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      };
    });
  }

  async createBudget(userId: string, input: CreateBudgetInput) {
    const amountCents = Math.round(input.amount * 100);

    // Verify category exists
    const categoryExists = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.id, input.categoryId),
          sql`(${categories.userId} = ${userId} OR ${categories.userId} IS NULL)`
        )
      )
      .limit(1);

    if (categoryExists.length === 0) {
      throw new NotFoundError("Category not found");
    }

    try {
      const [newBudget] = await db
        .insert(budgets)
        .values({
          userId,
          categoryId: input.categoryId,
          year: input.year,
          month: input.month,
          amountCents,
        })
        .onConflictDoUpdate({
          target: [budgets.userId, budgets.categoryId, budgets.year, budgets.month],
          set: {
            amountCents,
            updatedAt: new Date(),
          },
        })
        .returning();

      return newBudget;
    } catch (err: any) {
      if (err.code === "23505") {
        throw new ConflictError("A budget for this category and month already exists");
      }
      throw err;
    }
  }

  async updateBudget(userId: string, id: string, input: UpdateBudgetInput) {
    const amountCents = Math.round(input.amount * 100);

    const [updated] = await db
      .update(budgets)
      .set({
        amountCents,
        updatedAt: new Date(),
      })
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .returning();

    if (!updated) {
      throw new NotFoundError("Budget not found");
    }

    return updated;
  }

  async deleteBudget(userId: string, id: string) {
    const [deleted] = await db
      .delete(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .returning({ id: budgets.id });

    if (!deleted) {
      throw new NotFoundError("Budget not found");
    }

    return deleted;
  }
}
