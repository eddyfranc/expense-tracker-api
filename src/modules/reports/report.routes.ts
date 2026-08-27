import { Router } from "express";
import { ReportController } from "./report.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import { monthlyReportQuerySchema, dateRangeSummaryQuerySchema } from "./report.schema.js";

const router = Router();
const reportController = new ReportController();

router.use(authenticate);

router.get(
  "/monthly",
  validateRequest({ query: monthlyReportQuerySchema }),
  reportController.getMonthlyReport
);

router.get(
  "/monthly/categories",
  validateRequest({ query: monthlyReportQuerySchema }),
  reportController.getCategorySpending
);

router.get(
  "/summary",
  validateRequest({ query: dateRangeSummaryQuerySchema }),
  reportController.getSummaryReport
);

export default router;
