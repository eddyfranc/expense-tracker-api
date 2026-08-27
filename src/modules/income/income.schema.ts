import { z } from "zod";

export const createIncomeSchema = z.object({
  amount: z.number({ required_error: "Amount is required" }).positive("Amount must be greater than zero"),
  source: z.string().trim().min(1, "Source is required").max(150),
  description: z.string().trim().max(500).optional(),
  incomeDate: z.coerce.date({ invalid_type_error: "Income date must be a valid date" }),
});

export const updateIncomeSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero").optional(),
  source: z.string().trim().min(1, "Source cannot be empty").max(150).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  incomeDate: z.coerce.date().optional(),
});

export const incomeIdParamSchema = z.object({
  id: z.string().uuid("Invalid income ID format"),
});

export const incomeFilterQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  source: z.string().trim().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.enum(["income_date", "-income_date", "amount", "-amount", "created_at", "-created_at"]).default("-income_date"),
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
export type IncomeFilterQuery = z.infer<typeof incomeFilterQuerySchema>;
