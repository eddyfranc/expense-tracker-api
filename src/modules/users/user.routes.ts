import { Router } from "express";
import { UserController } from "./user.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import { updateProfileSchema, changePasswordSchema } from "./user.schema.js";

const router = Router();
const userController = new UserController();

router.use(authenticate);

router.get("/me", userController.getProfile);
router.patch("/me", validateRequest({ body: updateProfileSchema }), userController.updateProfile);
router.post("/me/change-password", validateRequest({ body: changePasswordSchema }), userController.changePassword);

export default router;
