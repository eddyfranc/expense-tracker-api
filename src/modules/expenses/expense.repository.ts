import { eq, and, gte, lte, ilike, sql, desc, asc, type SQL } from "drizzle-orm";
import { db } from "../../db/index.js";
import { expenses, categories, type Expense, type NewExpense } from "../../db/schema/index.js";
import type { ExpenseFilterQuery } from "./expense.schema.js";

export interface ExpenseWithCategory extends Expense {
  category: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  };
}

export class ExpenseRepository {
  private buildFilterConditions(userId: string, filters: ExpenseFilterQuery): SQL[] {
    const conditions: SQL[] = [eq(expenses.userId, userId)];

    if (filters.categoryId) {
      conditions.push(eq(expenses.categoryId, filters.categoryId));
    }

    if (filters.year && filters.month) {
      // Create start and end date for that month
      const startDate = new Date(Date.UTC(filters.year, filters.month - 1, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(filters.year, filters.month, 0, 23, 59, 59, 999));
      conditions.push(gte(expenses.expenseDate, startDate));
      conditions.push(lte(expenses.expenseDate, endDate));
    } else if (filters.year) {
      const startDate = new Date(Date.UTC(filters.year, 0, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(filters.year, 11, 31, 23, 59, 59, 999));
      conditions.push(gte(expenses.expenseDate, startDate));
      conditions.push(lte(expenses.expenseDate, endDate));
    }

    if (filters.from) {
      conditions.push(gte(expenses.expenseDate, filters.from));
    }

    if (filters.to) {
      conditions.push(lte(expenses.expenseDate, filters.to));
    }

    if (filters.q) {
      conditions.push(ilike(expenses.description, `%${filters.q}%`));
    }

    return conditions;
  }

  async findManyWithFilters(userId: string, filters: ExpenseFilterQuery): Promise<ExpenseWithCategory[]> {
    const conditions = this.buildFilterConditions(userId, filters);
    const offset = (filters.page - 1) * filters.limit;

    let orderByClause;
    switch (filters.sort) {
      case "expense_date":
        orderByClause = asc(expenses.expenseDate);
        break;
      case "-expense_date":
        orderByClause = desc(expenses.expenseDate);
        break;
      case "amount":
        orderByClause = asc(expenses.amountCents);
        break;
      case "-amount":
        orderByClause = desc(expenses.amountCents);
        break;
      case "created_at":
        orderByClause = asc(expenses.createdAt);
        break;
      case "-created_at":
      default:
        orderByClause = desc(expenses.createdAt);
        break;
    }

    const rows = await db
      .select({
        id: expenses.id,
        userId: expenses.userId,
        categoryId: expenses.categoryId,
        amountCents: expenses.amountCents,
        description: expenses.description,
        expenseDate: expenses.expenseDate,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
          icon: categories.icon,
        },
      })
      .from(expenses)
      .innerJoin(categories, eq(expenses.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(filters.limit)
      .offset(offset);

    return rows;
  }

  async countWithFilters(userId: string, filters: ExpenseFilterQuery): Promise<number> {
    const conditions = this.buildFilterConditions(userId, filters);
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(expenses)
      .where(and(...conditions));

    return result[0]?.count ?? 0;
  }

  async findByIdAndUser(id: string, userId: string): Promise<ExpenseWithCategory | undefined> {
    const rows = await db
      .select({
        id: expenses.id,
        userId: expenses.userId,
        categoryId: expenses.categoryId,
        amountCents: expenses.amountCents,
        description: expenses.description,
        expenseDate: expenses.expenseDate,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
          icon: categories.icon,
        },
      })
      .from(expenses)
      .innerJoin(categories, eq(expenses.categoryId, categories.id))
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .limit(1);

    return rows[0];
  }

  async create(data: NewExpense): Promise<Expense> {
    const [created] = await db.insert(expenses).values(data).returning();
    if (!created) {
      throw new Error("Failed to create expense");
    }
    return created;
  }

  async update(id: string, userId: string, data: Partial<NewExpense>): Promise<Expense | undefined> {
    const [updated] = await db
      .update(expenses)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return updated;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning({ id: expenses.id });
    return result.length > 0;
  }
}
