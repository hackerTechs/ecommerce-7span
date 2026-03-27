import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/api-response";
import { ProductService } from "../services/product.service";
import { clampPaginationLimit, DEFAULT_PAGINATION_LIMIT } from "../constants/pagination";

export class ProductController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pageRaw = Number(req.query.page);
      const limitRaw = Number(req.query.limit);
      const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.trunc(pageRaw) : 1;
      const limit = clampPaginationLimit(
        Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : DEFAULT_PAGINATION_LIMIT,
      );

      const categoryId = Number(req.query.categoryId);
      const search = req.query.search as string | undefined;

      const filters = {
        categoryId: Number.isFinite(categoryId) && categoryId > 0 ? categoryId : undefined,
        search: search?.trim() || undefined,
      };

      const data = await ProductService.getAll(page, limit, filters);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = await ProductService.getById(id);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.create(req.body);
      return ApiResponse.created(res, product, "Product created successfully");
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const product = await ProductService.update(id, req.body);
      return ApiResponse.success(res, product, "Product updated successfully");
    } catch (err) {
      next(err);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await ProductService.delete(id);
      return ApiResponse.success(res, null, "Product deleted successfully");
    } catch (err) {
      next(err);
    }
  }
}
