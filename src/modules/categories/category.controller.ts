import type { Request, Response, NextFunction } from "express";
import { CategoryService } from "./category.service.js";
import { sendSuccess, sendCreated, sendNoContent } from "../../utils/response.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.schema.js";

export class CategoryController {
  constructor(private readonly categoryService: CategoryService = new CategoryService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const categories = await this.categoryService.listCategories(userId);
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };
      const category = await this.categoryService.getCategoryById(id, userId);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input = req.body as CreateCategoryInput;
      const created = await this.categoryService.createCategory(userId, input);
      sendCreated(res, created, "Category created successfully");
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };
      const input = req.body as UpdateCategoryInput;
      const updated = await this.categoryService.updateCategory(id, userId, input);
      sendSuccess(res, updated, "Category updated successfully");
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };
      await this.categoryService.deleteCategory(id, userId);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  };
}
