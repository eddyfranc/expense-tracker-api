import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users, refreshTokens, categories, type NewUser, type User } from "../../db/schema/index.js";

export const defaultCategories = [
  { name: "Food & Dining", color: "#FF5733", icon: "utensils" },
  { name: "Transport", color: "#3380FF", icon: "car" },
  { name: "Rent & Housing", color: "#8E44AD", icon: "home" },
  { name: "Bills & Utilities", color: "#F39C12", icon: "bolt" },
  { name: "Entertainment", color: "#E74C3C", icon: "film" },
  { name: "Shopping", color: "#1ABC9C", icon: "shopping-bag" },
  { name: "Health & Medical", color: "#2ECC71", icon: "heart-pulse" },
  { name: "Education", color: "#34495E", icon: "graduation-cap" },
  { name: "Other", color: "#95A5A6", icon: "circle" },
];

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return results[0];
  }

  async findUserById(id: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0];
  }

  async createUserWithDefaults(newUserData: NewUser): Promise<User> {
    return await db.transaction(async (tx) => {
      const [createdUser] = await tx.insert(users).values(newUserData).returning();
      if (!createdUser) {
        throw new Error("Failed to insert user");
      }

      // Seed default categories for this user
      const userCategories = defaultCategories.map((cat) => ({
        userId: createdUser.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
      }));

      await tx.insert(categories).values(userCategories);

      return createdUser;
    });
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(refreshTokens).values({
      userId,
      token,
      expiresAt,
    });
  }

  async findValidRefreshToken(token: string) {
    const results = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, token),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    return results[0];
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.token, token));
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.userId, userId));
  }
}
