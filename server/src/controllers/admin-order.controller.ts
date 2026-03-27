import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { ApiResponse } from "../utils/api-response";
import { OrderService } from "../services/order.service";
import { OrderStatus } from "@prisma/client";
import { clampPaginationLimit, DEFAULT_PAGINATION_LIMIT } from "../constants/pagination";

export class AdminOrderController {
  static async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pageRaw = Number(req.query.page);
      const limitRaw = Number(req.query.limit);
      const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.trunc(pageRaw) : 1;
      const limit = clampPaginationLimit(
        Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : DEFAULT_PAGINATION_LIMIT,
      );

      const categoryIdRaw = Number(req.query.categoryId);
      const search = req.query.search as string | undefined;

      const filters = {
        categoryId:
          Number.isFinite(categoryIdRaw) && categoryIdRaw > 0 ? categoryIdRaw : undefined,
        search: search?.trim() || undefined,
      };

      const data = await OrderService.getAllForAdmin(page, limit, filters);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { status } = req.body as { status: string };
      const data = await OrderService.updateOrderStatusByAdmin(
        id,
        status as OrderStatus,
      );
      return ApiResponse.success(res, data, "Order status updated");
    } catch (err) {
      next(err);
    }
  }
}
