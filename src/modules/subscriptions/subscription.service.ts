import { db } from "../../db/index.js";
import { subscriptions, categories } from "../../db/schema/index.js";
import { eq, and, sql, asc } from "drizzle-orm";
import { NotFoundError } from "../../utils/errors.js";
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from "./subscription.schema.js";

export interface FormattedSubscription {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string | null;
  categoryIcon: string | null;
  name: string;
  amount: number;
  amountCents: number;
  billingCycle: string;
  nextBillingDate: Date;
  status: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SubscriptionService {
  async listSubscriptions(userId: string, status?: string): Promise<{
    subscriptions: FormattedSubscription[];
    summary: {
      totalActive: number;
      estimatedMonthlyBurn: number;
      upcomingIn7Days: number;
    };
  }> {
    const conditions = [eq(subscriptions.userId, userId)];
    if (status) {
      conditions.push(eq(subscriptions.status, status));
    }

    const rows = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        categoryId: subscriptions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
        name: subscriptions.name,
        amountCents: subscriptions.amountCents,
        billingCycle: subscriptions.billingCycle,
        nextBillingDate: subscriptions.nextBillingDate,
        status: subscriptions.status,
        description: subscriptions.description,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
      })
      .from(subscriptions)
      .innerJoin(categories, eq(subscriptions.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(asc(subscriptions.nextBillingDate));

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let activeCount = 0;
    let totalMonthlyBurnCents = 0;
    let upcomingCount = 0;

    const formattedList = rows.map((r) => {
      if (r.status === "active") {
        activeCount++;
        if (r.billingCycle === "monthly") {
          totalMonthlyBurnCents += r.amountCents;
        } else if (r.billingCycle === "yearly") {
          totalMonthlyBurnCents += Math.round(r.amountCents / 12);
        } else if (r.billingCycle === "weekly") {
          totalMonthlyBurnCents += Math.round((r.amountCents * 52) / 12);
        }

        const billingDate = new Date(r.nextBillingDate);
        if (billingDate >= now && billingDate <= sevenDaysFromNow) {
          upcomingCount++;
        }
      }

      return {
        id: r.id,
        userId: r.userId,
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        categoryColor: r.categoryColor,
        categoryIcon: r.categoryIcon,
        name: r.name,
        amount: r.amountCents / 100,
        amountCents: r.amountCents,
        billingCycle: r.billingCycle,
        nextBillingDate: r.nextBillingDate,
        status: r.status,
        description: r.description,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return {
      subscriptions: formattedList,
      summary: {
        totalActive: activeCount,
        estimatedMonthlyBurn: totalMonthlyBurnCents / 100,
        upcomingIn7Days: upcomingCount,
      },
    };
  }

  async createSubscription(userId: string, input: CreateSubscriptionInput) {
    const amountCents = Math.round(input.amount * 100);

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

    const [created] = await db
      .insert(subscriptions)
      .values({
        userId,
        categoryId: input.categoryId,
        name: input.name,
        amountCents,
        billingCycle: input.billingCycle,
        nextBillingDate: input.nextBillingDate,
        status: input.status,
        description: input.description,
      })
      .returning();

    return {
      ...created,
      amount: created.amountCents / 100,
    };
  }

  async updateSubscription(userId: string, id: string, input: UpdateSubscriptionInput) {
    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.amount !== undefined) updatePayload.amountCents = Math.round(input.amount * 100);
    if (input.billingCycle !== undefined) updatePayload.billingCycle = input.billingCycle;
    if (input.nextBillingDate !== undefined) updatePayload.nextBillingDate = input.nextBillingDate;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.description !== undefined) updatePayload.description = input.description;

    if (input.categoryId) {
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
      updatePayload.categoryId = input.categoryId;
    }

    const [updated] = await db
      .update(subscriptions)
      .set(updatePayload)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
      .returning();

    if (!updated) {
      throw new NotFoundError("Subscription not found");
    }

    return {
      ...updated,
      amount: updated.amountCents / 100,
    };
  }

  async deleteSubscription(userId: string, id: string) {
    const [deleted] = await db
      .delete(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
      .returning({ id: subscriptions.id });

    if (!deleted) {
      throw new NotFoundError("Subscription not found");
    }

    return deleted;
  }
}
