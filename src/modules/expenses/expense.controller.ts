import type { Request, Response, NextFunction } from "express";
import { ExpenseService } from "./expense.service.js";
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from "../../utils/response.js";
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseFilterQuery,
} from "./expense.schema.js";

export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService = new ExpenseService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const filters = req.query as unknown as ExpenseFilterQuery;
      const { data, pagination } = await this.expenseService.listExpenses(userId, filters);
      sendPaginated(res, data, pagination);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };
      const expense = await this.expenseService.getExpenseById(id, userId);
      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input = req.body as CreateExpenseInput;
      const created = await this.expenseService.createExpense(userId, input);
      sendCreated(res, created, "Expense created successfully");
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };
      const input = req.body as UpdateExpenseInput;
      const updated = await this.expenseService.updateExpense(id, userId, input);
      sendSuccess(res, updated, "Expense updated successfully");
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };
      await this.expenseService.deleteExpense(id, userId);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };
}
