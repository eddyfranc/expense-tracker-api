import { CategoryRepository } from "./category.repository.js";
import { NotFoundError, ConflictError, BadRequestError } from "../../utils/errors.js";
import type { Category } from "../../db/schema/index.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.schema.js";

export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository = new CategoryRepository()) {}

  async listCategories(userId: string): Promise<Category[]> {
    return this.categoryRepository.findAllByUser(userId);
  }

  async getCategoryById(id: string, userId: string): Promise<Category> {
    const category = await this.categoryRepository.findByIdAndUser(id, userId);
    if (!category) {
      throw new NotFoundError("Category not found");
    }
    return category;
  }

  async createCategory(userId: string, input: CreateCategoryInput): Promise<Category> {
    const existing = await this.categoryRepository.findByNameAndUser(input.name, userId);
    if (existing) {
      throw new ConflictError(`Category with name "${input.name}" already exists`);
    }

    return this.categoryRepository.create({
      userId,
      name: input.name,
      description: input.description,
      color: input.color,
      icon: input.icon,
    });
  }

  async updateCategory(id: string, userId: string, input: UpdateCategoryInput): Promise<Category> {
    const category = await this.categoryRepository.findUserOwnedById(id, userId);
    if (!category) {
      throw new NotFoundError("Category not found or cannot be modified");
    }

    if (input.name && input.name.toLowerCase() !== category.name.toLowerCase()) {
      const existing = await this.categoryRepository.findByNameAndUser(input.name, userId);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Category with name "${input.name}" already exists`);
      }
    }

    const updated = await this.categoryRepository.update(id, userId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
    });

    if (!updated) {
      throw new NotFoundError("Category not found");
    }

    return updated;
  }

  async deleteCategory(id: string, userId: string): Promise<void> {
    const category = await this.categoryRepository.findUserOwnedById(id, userId);
    if (!category) {
      throw new NotFoundError("Category not found or cannot be deleted");
    }

    const expenseCount = await this.categoryRepository.countExpensesInCategory(id, userId);
    if (expenseCount > 0) {
      throw new BadRequestError(
        `Cannot delete category "${category.name}" because it is currently assigned to ${expenseCount} expense(s). Reassign or delete those expenses first.`
      );
    }

    const deleted = await this.categoryRepository.delete(id, userId);
    if (!deleted) {
      throw new NotFoundError("Category not found");
    }
  }
}
