import { Router } from "express";
import { ExpenseController } from "./expense.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema,
  expenseFilterQuerySchema,
} from "./expense.schema.js";

const router = Router();
const expenseController = new ExpenseController();

router.use(authenticate);

router.get(
  "/",
  validateRequest({ query: expenseFilterQuerySchema }),
  expenseController.list
);

router.post(
  "/",
  validateRequest({ body: createExpenseSchema }),
  expenseController.create
);

router.get(
  "/:id",
  validateRequest({ params: expenseIdParamSchema }),
  expenseController.getById
);

router.patch(
  "/:id",
  validateRequest({ params: expenseIdParamSchema, body: updateExpenseSchema }),
  expenseController.update
);

router.delete(
  "/:id",
  validateRequest({ params: expenseIdParamSchema }),
  expenseController.delete
);

export default router;
