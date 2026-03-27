import { Router } from "express";
import { AdminOrderController } from "../controllers/admin-order.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { adminListOrdersSchema, adminUpdateOrderStatusSchema } from "../validators/order.validator";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN));

router.get("/", validate(adminListOrdersSchema), AdminOrderController.list);
router.patch(
  "/:id/status",
  validate(adminUpdateOrderStatusSchema),
  AdminOrderController.updateStatus,
);

export default router;
