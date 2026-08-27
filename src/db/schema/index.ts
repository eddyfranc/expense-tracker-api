import { relations } from "drizzle-orm";
import { users } from "./users";
import { refreshTokens } from "./refresh-tokens";
import { categories } from "./categories";
import { expenses } from "./expenses";
import { income } from "./income";
import { budgets } from "./budgets";
import { subscriptions } from "./subscriptions";

export * from "./users";
export * from "./refresh-tokens";
export * from "./categories";
export * from "./expenses";
export * from "./income";
export * from "./budgets";
export * from "./subscriptions";

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  categories: many(categories),
  expenses: many(expenses),
  income: many(income),
  budgets: many(budgets),
  subscriptions: many(subscriptions),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  expenses: many(expenses),
  budgets: many(budgets),
  subscriptions: many(subscriptions),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
}));

export const incomeRelations = relations(income, ({ one }) => ({
  user: one(users, {
    fields: [income.userId],
    references: [users.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [subscriptions.categoryId],
    references: [categories.id],
  }),
}));
