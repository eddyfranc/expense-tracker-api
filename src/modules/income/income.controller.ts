import type { Request, Response, NextFunction } from "express";
import { IncomeService } from "./income.service.js";
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from "../../utils/response.js";
import type {
  CreateIncomeInput,
  UpdateIncomeInput,
  IncomeFilterQuery,
} from "./income.schema.js";

export class IncomeController {
  constructor(private readonly incomeService: IncomeService = new IncomeService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const filters = req.query as unknown as IncomeFilterQuery;
      const { data, pagination } = await this.incomeService.listIncome(userId, filters);
      sendPaginated(res, data, pagination);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };
      const income = await this.incomeService.getIncomeById(id, userId);
      sendSuccess(res, income);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input = req.body as CreateIncomeInput;
      const created = await this.incomeService.createIncome(userId, input);
      sendCreated(res, created, "Income created successfully");
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };
      const input = req.body as UpdateIncomeInput;
      const updated = await this.incomeService.updateIncome(id, userId, input);
      sendSuccess(res, updated, "Income updated successfully");
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };
      await this.incomeService.deleteIncome(id, userId);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };
}
