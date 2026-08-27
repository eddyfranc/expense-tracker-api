import { eq, and, or, isNull, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { categories, expenses, type Category, type NewCategory } from "../../db/schema/index.js";

export class CategoryRepository {
  async findAllByUser(userId: string): Promise<Category[]> {
    return db
      .select()
      .from(categories)
      .where(or(eq(categories.userId, userId), isNull(categories.userId)))
      .orderBy(categories.name);
  }

  async findByIdAndUser(id: string, userId: string): Promise<Category | undefined> {
    const results = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), or(eq(categories.userId, userId), isNull(categories.userId))))
      .limit(1);
    return results[0];
  }

  async findUserOwnedById(id: string, userId: string): Promise<Category | undefined> {
    const results = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .limit(1);
    return results[0];
  }

  async findByNameAndUser(name: string, userId: string): Promise<Category | undefined> {
    const results = await db
      .select()
      .from(categories)
      .where(
        and(
          sql`LOWER(${categories.name}) = LOWER(${name})`,
          or(eq(categories.userId, userId), isNull(categories.userId))
        )
      )
      .limit(1);
    return results[0];
  }

  async create(data: NewCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(data).returning();
    if (!created) {
      throw new Error("Failed to create category");
    }
    return created;
  }

  async update(id: string, userId: string, data: Partial<NewCategory>): Promise<Category | undefined> {
    const [updated] = await db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return updated;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning({ id: categories.id });
    return result.length > 0;
  }

  async countExpensesInCategory(categoryId: string, userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(expenses)
      .where(and(eq(expenses.categoryId, categoryId), eq(expenses.userId, userId)));
    return result[0]?.count ?? 0;
  }
}
