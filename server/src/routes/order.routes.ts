import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getOrdersSchema,
  getOrderByIdSchema,
  cancelOrderSchema,
} from "../validators/order.validator";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);
router.use(authorize(Role.CUSTOMER));

router.post("/", OrderController.placeOrder);
router.get("/", validate(getOrdersSchema), OrderController.getOrders);
router.get("/:id", validate(getOrderByIdSchema), OrderController.getOrderById);
router.patch("/:id/cancel", validate(cancelOrderSchema), OrderController.cancelOrder);

export default router;
