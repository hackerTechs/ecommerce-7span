import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { ApiResponse } from "../utils/api-response";
import { OrderService } from "../services/order.service";
import { clampPaginationLimit, DEFAULT_PAGINATION_LIMIT } from "../constants/pagination";

export class OrderController {
  static async placeOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await OrderService.placeOrder(req.user!.userId);
      return ApiResponse.created(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pageRaw = Number(req.query.page);
      const limitRaw = Number(req.query.limit);
      const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.trunc(pageRaw) : 1;
      const limit = clampPaginationLimit(
        Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : DEFAULT_PAGINATION_LIMIT,
      );

      const data = await OrderService.getOrders(req.user!.userId, page, limit);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async getOrderById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = await OrderService.getOrderById(id, req.user!.userId);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async cancelOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = await OrderService.cancelOrder(id, req.user!.userId);
      return ApiResponse.success(res, data, "Order cancelled successfully");
    } catch (err) {
      next(err);
    }
  }
}
