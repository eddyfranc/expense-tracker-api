import { z } from "zod";

export const monthlyReportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const dateRangeSummaryQuerySchema = z.object({
  from: z.coerce.date({ invalid_type_error: "from parameter must be a valid date" }),
  to: z.coerce.date({ invalid_type_error: "to parameter must be a valid date" }),
});

export type MonthlyReportQuery = z.infer<typeof monthlyReportQuerySchema>;
export type DateRangeSummaryQuery = z.infer<typeof dateRangeSummaryQuerySchema>;
