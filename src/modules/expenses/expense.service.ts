import { ExpenseRepository, type ExpenseWithCategory } from "./expense.repository.js";
import { CategoryRepository } from "../categories/category.repository.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { buildPaginationMeta } from "../../utils/pagination.js";
import type { PaginationMeta } from "../../utils/response.js";
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseFilterQuery,
} from "./expense.schema.js";

export interface ExpenseResponse {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  amountCents: number;
  description: string | null;
  expenseDate: Date;
  category: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class ExpenseService {
  constructor(
    private readonly expenseRepository: ExpenseRepository = new ExpenseRepository(),
    private readonly categoryRepository: CategoryRepository = new CategoryRepository()
  ) {}

  private mapToResponse(item: ExpenseWithCategory): ExpenseResponse {
    return {
      id: item.id,
      userId: item.userId,
      categoryId: item.categoryId,
      amount: item.amountCents / 100,
      amountCents: item.amountCents,
      description: item.description,
      expenseDate: item.expenseDate,
      category: item.category,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async listExpenses(
    userId: string,
    filters: ExpenseFilterQuery
  ): Promise<{ data: ExpenseResponse[]; pagination: PaginationMeta }> {
    const [items, totalCount] = await Promise.all([
      this.expenseRepository.findManyWithFilters(userId, filters),
      this.expenseRepository.countWithFilters(userId, filters),
    ]);

    const data = items.map((item) => this.mapToResponse(item));
    const pagination = buildPaginationMeta(totalCount, filters.page, filters.limit);

    return { data, pagination };
  }

  async getExpenseById(id: string, userId: string): Promise<ExpenseResponse> {
    const item = await this.expenseRepository.findByIdAndUser(id, userId);
    if (!item) {
      throw new NotFoundError("Expense not found");
    }
    return this.mapToResponse(item);
  }

  async createExpense(userId: string, input: CreateExpenseInput): Promise<ExpenseResponse> {
    // Verify category exists and belongs to user or is global
    const category = await this.categoryRepository.findByIdAndUser(input.categoryId, userId);
    if (!category) {
      throw new BadRequestError("Invalid category ID: category does not exist or is not accessible");
    }

    const amountCents = Math.round(input.amount * 100);
    const created = await this.expenseRepository.create({
      userId,
      categoryId: input.categoryId,
      amountCents,
      description: input.description,
      expenseDate: input.expenseDate,
    });

    const fullExpense = await this.expenseRepository.findByIdAndUser(created.id, userId);
    if (!fullExpense) {
      throw new Error("Failed to retrieve created expense");
    }

    return this.mapToResponse(fullExpense);
  }

  async updateExpense(id: string, userId: string, input: UpdateExpenseInput): Promise<ExpenseResponse> {
    const existing = await this.expenseRepository.findByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundError("Expense not found");
    }

    if (input.categoryId && input.categoryId !== existing.categoryId) {
      const category = await this.categoryRepository.findByIdAndUser(input.categoryId, userId);
      if (!category) {
        throw new BadRequestError("Invalid category ID: category does not exist or is not accessible");
      }
    }

    const updateData: {
      amountCents?: number;
      categoryId?: string;
      description?: string | null;
      expenseDate?: Date;
    } = {};

    if (input.amount !== undefined) {
      updateData.amountCents = Math.round(input.amount * 100);
    }
    if (input.categoryId !== undefined) {
      updateData.categoryId = input.categoryId;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.expenseDate !== undefined) {
      updateData.expenseDate = input.expenseDate;
    }

    const updated = await this.expenseRepository.update(id, userId, updateData);
    if (!updated) {
      throw new NotFoundError("Expense not found");
    }

    const fullExpense = await this.expenseRepository.findByIdAndUser(id, userId);
    if (!fullExpense) {
      throw new NotFoundError("Expense not found");
    }

    return this.mapToResponse(fullExpense);
  }

  async deleteExpense(id: string, userId: string): Promise<void> {
    const deleted = await this.expenseRepository.delete(id, userId);
    if (!deleted) {
      throw new NotFoundError("Expense not found");
    }
  }
}
