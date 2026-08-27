import { z } from "zod";

export const createExpenseSchema = z.object({
  amount: z.number({ required_error: "Amount is required" }).positive("Amount must be greater than zero"),
  categoryId: z.string().uuid("Invalid category ID format"),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional(),
  expenseDate: z.coerce.date({ invalid_type_error: "Expense date must be a valid date" }),
});

export const updateExpenseSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero").optional(),
  categoryId: z.string().uuid("Invalid category ID format").optional(),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").nullable().optional(),
  expenseDate: z.coerce.date().optional(),
});

export const expenseIdParamSchema = z.object({
  id: z.string().uuid("Invalid expense ID format"),
});

export const expenseFilterQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  categoryId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  q: z.string().trim().optional(),
  sort: z.enum(["expense_date", "-expense_date", "amount", "-amount", "created_at", "-created_at"]).default("-expense_date"),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseFilterQuery = z.infer<typeof expenseFilterQuerySchema>;
