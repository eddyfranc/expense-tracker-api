import { eq, and, gte, lte, ilike, sql, desc, asc, type SQL } from "drizzle-orm";
import { db } from "../../db/index.js";
import { income, type Income, type NewIncome } from "../../db/schema/index.js";
import type { IncomeFilterQuery } from "./income.schema.js";

export class IncomeRepository {
  private buildFilterConditions(userId: string, filters: IncomeFilterQuery): SQL[] {
    const conditions: SQL[] = [eq(income.userId, userId)];

    if (filters.source) {
      conditions.push(ilike(income.source, `%${filters.source}%`));
    }

    if (filters.year && filters.month) {
      const startDate = new Date(Date.UTC(filters.year, filters.month - 1, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(filters.year, filters.month, 0, 23, 59, 59, 999));
      conditions.push(gte(income.incomeDate, startDate));
      conditions.push(lte(income.incomeDate, endDate));
    } else if (filters.year) {
      const startDate = new Date(Date.UTC(filters.year, 0, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(filters.year, 11, 31, 23, 59, 59, 999));
      conditions.push(gte(income.incomeDate, startDate));
      conditions.push(lte(income.incomeDate, endDate));
    }

    if (filters.from) {
      conditions.push(gte(income.incomeDate, filters.from));
    }

    if (filters.to) {
      conditions.push(lte(income.incomeDate, filters.to));
    }

    return conditions;
  }

  async findManyWithFilters(userId: string, filters: IncomeFilterQuery): Promise<Income[]> {
    const conditions = this.buildFilterConditions(userId, filters);
    const offset = (filters.page - 1) * filters.limit;

    let orderByClause;
    switch (filters.sort) {
      case "income_date":
        orderByClause = asc(income.incomeDate);
        break;
      case "-income_date":
        orderByClause = desc(income.incomeDate);
        break;
      case "amount":
        orderByClause = asc(income.amountCents);
        break;
      case "-amount":
        orderByClause = desc(income.amountCents);
        break;
      case "created_at":
        orderByClause = asc(income.createdAt);
        break;
      case "-created_at":
      default:
        orderByClause = desc(income.createdAt);
        break;
    }

    return db
      .select()
      .from(income)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(filters.limit)
      .offset(offset);
  }

  async countWithFilters(userId: string, filters: IncomeFilterQuery): Promise<number> {
    const conditions = this.buildFilterConditions(userId, filters);
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(income)
      .where(and(...conditions));

    return result[0]?.count ?? 0;
  }

  async findByIdAndUser(id: string, userId: string): Promise<Income | undefined> {
    const rows = await db
      .select()
      .from(income)
      .where(and(eq(income.id, id), eq(income.userId, userId)))
      .limit(1);

    return rows[0];
  }

  async create(data: NewIncome): Promise<Income> {
    const [created] = await db.insert(income).values(data).returning();
    if (!created) {
      throw new Error("Failed to create income");
    }
    return created;
  }

  async update(id: string, userId: string, data: Partial<NewIncome>): Promise<Income | undefined> {
    const [updated] = await db
      .update(income)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(income.id, id), eq(income.userId, userId)))
      .returning();
    return updated;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(income)
      .where(and(eq(income.id, id), eq(income.userId, userId)))
      .returning({ id: income.id });
    return result.length > 0;
  }
}
