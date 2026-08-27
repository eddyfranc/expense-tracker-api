import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users, type User } from "../../db/schema/index.js";

export class UserRepository {
  async findById(id: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0];
  }

  async update(id: string, data: Partial<Omit<User, "id" | "createdAt">>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }
}
