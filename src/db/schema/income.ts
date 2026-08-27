import { pgTable, uuid, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const income = pgTable(
  "income",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    source: varchar("source", { length: 150 }).notNull(),
    description: varchar("description", { length: 500 }),
    incomeDate: timestamp("income_date", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("income_user_id_idx").on(table.userId),
    index("income_income_date_idx").on(table.incomeDate),
  ]
);

export type Income = typeof income.$inferSelect;
export type NewIncome = typeof income.$inferInsert;
