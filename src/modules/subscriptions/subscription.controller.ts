import type { Request, Response, NextFunction } from "express";
import { SubscriptionService } from "./subscription.service.js";
import { sendSuccess, sendCreated, sendNoContent } from "../../utils/response.js";
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from "./subscription.schema.js";

export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService = new SubscriptionService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const status = req.query.status as string | undefined;
      const data = await this.subscriptionService.listSubscriptions(userId, status);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const input = req.body as CreateSubscriptionInput;
      const subscription = await this.subscriptionService.createSubscription(userId, input);
      sendCreated(res, subscription, "Subscription added successfully");
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };
      const input = req.body as UpdateSubscriptionInput;
      const subscription = await this.subscriptionService.updateSubscription(userId, id, input);
      sendSuccess(res, subscription, "Subscription updated successfully");
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params as { id: string };
      await this.subscriptionService.deleteSubscription(userId, id);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  };
}
