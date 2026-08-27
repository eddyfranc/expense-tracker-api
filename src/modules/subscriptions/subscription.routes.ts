import { Router } from "express";
import { SubscriptionController } from "./subscription.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  subscriptionIdParamSchema,
  subscriptionQuerySchema,
} from "./subscription.schema.js";

const router = Router();
const subscriptionController = new SubscriptionController();

router.use(authenticate);

router.get(
  "/",
  validateRequest({ query: subscriptionQuerySchema }),
  subscriptionController.list
);

router.post(
  "/",
  validateRequest({ body: createSubscriptionSchema }),
  subscriptionController.create
);

router.patch(
  "/:id",
  validateRequest({ params: subscriptionIdParamSchema, body: updateSubscriptionSchema }),
  subscriptionController.update
);

router.delete(
  "/:id",
  validateRequest({ params: subscriptionIdParamSchema }),
  subscriptionController.delete
);

export default router;
