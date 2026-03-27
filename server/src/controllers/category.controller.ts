import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/api-response";
import { CategoryService } from "../services/category.service";

export class CategoryController {
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryService.getAll();
      return ApiResponse.success(res, categories);
    } catch (err) {
      next(err);
    }
  }
}
