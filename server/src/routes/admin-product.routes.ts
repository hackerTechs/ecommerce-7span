import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
} from "../validators/product.validator";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN));

router.post("/", validate(createProductSchema), ProductController.create);
router.put("/:id", validate(updateProductSchema), ProductController.update);
router.delete("/:id", validate(deleteProductSchema), ProductController.remove);

export default router;
