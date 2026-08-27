import { pgTable, uuid, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { categories } from "./categories";

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  billingCycle: varchar("billing_cycle", { length: 20 }).default("monthly").notNull(), // 'weekly' | 'monthly' | 'yearly'
  nextBillingDate: timestamp("next_billing_date", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(), // 'active' | 'paused' | 'cancelled'
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
