import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(500).optional(),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Color must be a valid hex color code (e.g. #FF5733)").optional(),
  icon: z.string().trim().max(50).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Color must be a valid hex color code").nullable().optional(),
  icon: z.string().trim().max(50).nullable().optional(),
});

export const categoryIdParamSchema = z.object({
  id: z.string().uuid("Invalid category ID format"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
