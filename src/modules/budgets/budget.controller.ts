import type { Request, Response, NextFunction } from "express";
import { BudgetService } from "./budget.service.js";
import { sendSuccess, sendCreated, sendNoContent } from "../../utils/response.js";
import type { CreateBudgetInput, UpdateBudgetInput } from "./budget.schema.js";

export class BudgetController {
  constructor(private readonly budgetService: BudgetService = new BudgetService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const year = req.query.year ? Number(req.query.year) : undefined;
      const month = req.query.month ? Number(req.query.month) : undefined;

      const items = await this.budgetService.listBudgets(userId, year, month);
      sendSuccess(res, items);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input = req.body as CreateBudgetInput;
      const budget = await this.budgetService.createBudget(userId, input);
      sendCreated(res, budget, "Budget set successfully");
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };
      const input = req.body as UpdateBudgetInput;
      const budget = await this.budgetService.updateBudget(userId, id, input);
      sendSuccess(res, budget, "Budget updated successfully");
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };
      await this.budgetService.deleteBudget(userId, id);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  };
}
