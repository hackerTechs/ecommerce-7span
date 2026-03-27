import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { validate } from "../middleware/validate.middleware";
import { getProductsSchema, getProductByIdSchema } from "../validators/product.validator";

const router = Router();

router.get("/", validate(getProductsSchema), ProductController.getAll);
router.get("/:id", validate(getProductByIdSchema), ProductController.getById);

export default router;
