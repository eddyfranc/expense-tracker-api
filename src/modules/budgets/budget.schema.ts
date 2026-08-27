import { z } from "zod";

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID format"),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  amount: z.number().positive("Budget amount must be greater than zero"),
});

export const updateBudgetSchema = z.object({
  amount: z.number().positive("Budget amount must be greater than zero"),
});

export const budgetIdParamSchema = z.object({
  id: z.string().uuid("Invalid budget ID format"),
});

export const budgetQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
