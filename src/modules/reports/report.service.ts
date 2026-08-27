import { ReportRepository } from "./report.repository.js";
import type { MonthlyReportQuery, DateRangeSummaryQuery } from "./report.schema.js";

export interface MonthlyReportResponse {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  totalIncomeCents: number;
  totalExpensesCents: number;
  balanceCents: number;
  savingsRatePercentage: number;
  expenseCount: number;
  incomeCount: number;
}

export interface CategoryReportItem {
  categoryId: string;
  categoryName: string;
  color: string | null;
  icon: string | null;
  amount: number;
  amountCents: number;
  percentage: number;
  expenseCount: number;
}

export interface CategoryReportResponse {
  year: number;
  month: number;
  totalExpenses: number;
  categories: CategoryReportItem[];
}

export interface SummaryReportResponse {
  from: string;
  to: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  totalIncomeCents: number;
  totalExpensesCents: number;
  balanceCents: number;
  expenseCount: number;
  incomeCount: number;
}

export class ReportService {
  constructor(private readonly reportRepository: ReportRepository = new ReportRepository()) {}

  private getMonthDateRange(year: number, month: number): { startDate: Date; endDate: Date } {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    // Day 0 of next month is the last day of this month
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { startDate, endDate };
  }

  async getMonthlyReport(userId: string, query: MonthlyReportQuery): Promise<MonthlyReportResponse> {
    const { startDate, endDate } = this.getMonthDateRange(query.year, query.month);
    const totals = await this.reportRepository.getMonthlyTotals(userId, startDate, endDate);

    const balanceCents = totals.totalIncomeCents - totals.totalExpenseCents;
    const savingsRate =
      totals.totalIncomeCents > 0
        ? Math.round(((totals.totalIncomeCents - totals.totalExpenseCents) / totals.totalIncomeCents) * 10000) / 100
        : 0;

    return {
      year: query.year,
      month: query.month,
      totalIncome: totals.totalIncomeCents / 100,
      totalExpenses: totals.totalExpenseCents / 100,
      balance: balanceCents / 100,
      totalIncomeCents: totals.totalIncomeCents,
      totalExpensesCents: totals.totalExpenseCents,
      balanceCents,
      savingsRatePercentage: savingsRate,
      expenseCount: totals.expenseCount,
      incomeCount: totals.incomeCount,
    };
  }

  async getCategorySpendingReport(
    userId: string,
    query: MonthlyReportQuery
  ): Promise<CategoryReportResponse> {
    const { startDate, endDate } = this.getMonthDateRange(query.year, query.month);
    const [categoriesBreakdown, totals] = await Promise.all([
      this.reportRepository.getSpendingByCategory(userId, startDate, endDate),
      this.reportRepository.getMonthlyTotals(userId, startDate, endDate),
    ]);

    const totalExpenseCents = totals.totalExpenseCents;

    const categories = categoriesBreakdown.map((item) => {
      const percentage =
        totalExpenseCents > 0
          ? Math.round((item.totalAmountCents / totalExpenseCents) * 10000) / 100
          : 0;

      return {
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        color: item.color,
        icon: item.icon,
        amount: item.totalAmountCents / 100,
        amountCents: item.totalAmountCents,
        percentage,
        expenseCount: item.expenseCount,
      };
    });

    return {
      year: query.year,
      month: query.month,
      totalExpenses: totalExpenseCents / 100,
      categories,
    };
  }

  async getSummaryReport(userId: string, query: DateRangeSummaryQuery): Promise<SummaryReportResponse> {
    const startDate = new Date(query.from);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(query.to);
    endDate.setHours(23, 59, 59, 999);

    const totals = await this.reportRepository.getCustomRangeTotals(userId, startDate, endDate);
    const balanceCents = totals.totalIncomeCents - totals.totalExpenseCents;

    return {
      from: query.from.toISOString().split("T")[0]!,
      to: query.to.toISOString().split("T")[0]!,
      totalIncome: totals.totalIncomeCents / 100,
      totalExpenses: totals.totalExpenseCents / 100,
      balance: balanceCents / 100,
      totalIncomeCents: totals.totalIncomeCents,
      totalExpensesCents: totals.totalExpenseCents,
      balanceCents,
      expenseCount: totals.expenseCount,
      incomeCount: totals.incomeCount,
    };
  }
}
