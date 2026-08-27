import { Router } from "express";
import { IncomeController } from "./income.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  createIncomeSchema,
  updateIncomeSchema,
  incomeIdParamSchema,
  incomeFilterQuerySchema,
} from "./income.schema.js";

const router = Router();
const incomeController = new IncomeController();

router.use(authenticate);

router.get(
  "/",
  validateRequest({ query: incomeFilterQuerySchema }),
  incomeController.list
);

router.post(
  "/",
  validateRequest({ body: createIncomeSchema }),
  incomeController.create
);

router.get(
  "/:id",
  validateRequest({ params: incomeIdParamSchema }),
  incomeController.getById
);

router.patch(
  "/:id",
  validateRequest({ params: incomeIdParamSchema, body: updateIncomeSchema }),
  incomeController.update
);

router.delete(
  "/:id",
  validateRequest({ params: incomeIdParamSchema }),
  incomeController.delete
);

export default router;
