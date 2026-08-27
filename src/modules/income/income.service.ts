import { IncomeRepository } from "./income.repository.js";
import { NotFoundError } from "../../utils/errors.js";
import { buildPaginationMeta } from "../../utils/pagination.js";
import type { PaginationMeta } from "../../utils/response.js";
import type { Income } from "../../db/schema/index.js";
import type {
  CreateIncomeInput,
  UpdateIncomeInput,
  IncomeFilterQuery,
} from "./income.schema.js";

export interface IncomeResponse {
  id: string;
  userId: string;
  amount: number;
  amountCents: number;
  source: string;
  description: string | null;
  incomeDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class IncomeService {
  constructor(private readonly incomeRepository: IncomeRepository = new IncomeRepository()) {}

  private mapToResponse(item: Income): IncomeResponse {
    return {
      id: item.id,
      userId: item.userId,
      amount: item.amountCents / 100,
      amountCents: item.amountCents,
      source: item.source,
      description: item.description,
      incomeDate: item.incomeDate,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async listIncome(
    userId: string,
    filters: IncomeFilterQuery
  ): Promise<{ data: IncomeResponse[]; pagination: PaginationMeta }> {
    const [items, totalCount] = await Promise.all([
      this.incomeRepository.findManyWithFilters(userId, filters),
      this.incomeRepository.countWithFilters(userId, filters),
    ]);

    const data = items.map((item) => this.mapToResponse(item));
    const pagination = buildPaginationMeta(totalCount, filters.page, filters.limit);

    return { data, pagination };
  }

  async getIncomeById(id: string, userId: string): Promise<IncomeResponse> {
    const item = await this.incomeRepository.findByIdAndUser(id, userId);
    if (!item) {
      throw new NotFoundError("Income not found");
    }
    return this.mapToResponse(item);
  }

  async createIncome(userId: string, input: CreateIncomeInput): Promise<IncomeResponse> {
    const amountCents = Math.round(input.amount * 100);
    const created = await this.incomeRepository.create({
      userId,
      amountCents,
      source: input.source,
      description: input.description,
      incomeDate: input.incomeDate,
    });

    return this.mapToResponse(created);
  }

  async updateIncome(id: string, userId: string, input: UpdateIncomeInput): Promise<IncomeResponse> {
    const existing = await this.incomeRepository.findByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundError("Income not found");
    }

    const updateData: {
      amountCents?: number;
      source?: string;
      description?: string | null;
      incomeDate?: Date;
    } = {};

    if (input.amount !== undefined) {
      updateData.amountCents = Math.round(input.amount * 100);
    }
    if (input.source !== undefined) {
      updateData.source = input.source;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.incomeDate !== undefined) {
      updateData.incomeDate = input.incomeDate;
    }

    const updated = await this.incomeRepository.update(id, userId, updateData);
    if (!updated) {
      throw new NotFoundError("Income not found");
    }

    return this.mapToResponse(updated);
  }

  async deleteIncome(id: string, userId: string): Promise<void> {
    const deleted = await this.incomeRepository.delete(id, userId);
    if (!deleted) {
      throw new NotFoundError("Income not found");
    }
  }
}
