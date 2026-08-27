import { Router } from "express";
import { BudgetController } from "./budget.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  createBudgetSchema,
  updateBudgetSchema,
  budgetIdParamSchema,
  budgetQuerySchema,
} from "./budget.schema.js";

const router = Router();
const budgetController = new BudgetController();

router.use(authenticate);

router.get(
  "/",
  validateRequest({ query: budgetQuerySchema }),
  budgetController.list
);

router.post(
  "/",
  validateRequest({ body: createBudgetSchema }),
  budgetController.create
);

router.patch(
  "/:id",
  validateRequest({ params: budgetIdParamSchema, body: updateBudgetSchema }),
  budgetController.update
);

router.delete(
  "/:id",
  validateRequest({ params: budgetIdParamSchema }),
  budgetController.delete
);

export default router;
