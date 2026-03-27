import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
} from "../validators/cart.validator";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);
router.use(authorize(Role.CUSTOMER));

router.get("/", CartController.getCart);
router.post("/items", validate(addToCartSchema), CartController.addItem);
router.patch("/items/:itemId", validate(updateCartItemSchema), CartController.updateItem);
router.delete("/items/:itemId", validate(removeCartItemSchema), CartController.removeItem);

export default router;
