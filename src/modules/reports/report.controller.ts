import type { Request, Response, NextFunction } from "express";
import { ReportService } from "./report.service.js";
import { sendSuccess } from "../../utils/response.js";
import type { MonthlyReportQuery, DateRangeSummaryQuery } from "./report.schema.js";

export class ReportController {
  constructor(private readonly reportService: ReportService = new ReportService()) {}

  getMonthlyReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const query = req.query as unknown as MonthlyReportQuery;
      const report = await this.reportService.getMonthlyReport(userId, query);
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  };

  getCategorySpending = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const query = req.query as unknown as MonthlyReportQuery;
      const report = await this.reportService.getCategorySpendingReport(userId, query);
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  };

  getSummaryReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const query = req.query as unknown as DateRangeSummaryQuery;
      const report = await this.reportService.getSummaryReport(userId, query);
      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  };
}
