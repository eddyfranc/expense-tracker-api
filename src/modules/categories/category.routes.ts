import { Router } from "express";
import { CategoryController } from "./category.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from "./category.schema.js";

const router = Router();
const categoryController = new CategoryController();

router.use(authenticate);

router.get("/", categoryController.list);
router.post("/", validateRequest({ body: createCategorySchema }), categoryController.create);
router.get("/:id", validateRequest({ params: categoryIdParamSchema }), categoryController.getById);
router.patch(
  "/:id",
  validateRequest({ params: categoryIdParamSchema, body: updateCategorySchema }),
  categoryController.update
);
router.delete("/:id", validateRequest({ params: categoryIdParamSchema }), categoryController.delete);

export default router;
