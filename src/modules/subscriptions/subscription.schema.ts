import { z } from "zod";

export const createSubscriptionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150),
  categoryId: z.string().uuid("Invalid category ID format"),
  amount: z.number().positive("Amount must be greater than zero"),
  billingCycle: z.enum(["weekly", "monthly", "yearly"]).default("monthly"),
  nextBillingDate: z.coerce.date(),
  status: z.enum(["active", "paused", "cancelled"]).default("active"),
  description: z.string().trim().max(500).optional(),
});

export const updateSubscriptionSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  categoryId: z.string().uuid("Invalid category ID format").optional(),
  amount: z.number().positive("Amount must be greater than zero").optional(),
  billingCycle: z.enum(["weekly", "monthly", "yearly"]).optional(),
  nextBillingDate: z.coerce.date().optional(),
  status: z.enum(["active", "paused", "cancelled"]).optional(),
  description: z.string().trim().max(500).nullable().optional(),
});

export const subscriptionIdParamSchema = z.object({
  id: z.string().uuid("Invalid subscription ID format"),
});

export const subscriptionQuerySchema = z.object({
  status: z.enum(["active", "paused", "cancelled"]).optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
