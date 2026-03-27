import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { ApiResponse } from "../utils/api-response";
import { CartService } from "../services/cart.service";

export class CartController {
  static async getCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await CartService.getCart(req.user!.userId);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async addItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { productId, quantity } = req.body;
      const data = await CartService.addItem(
        req.user!.userId,
        Number(productId),
        Number(quantity),
      );
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async updateItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const itemId = Number(req.params.itemId);
      const { quantity } = req.body;
      const data = await CartService.updateItem(req.user!.userId, itemId, Number(quantity));
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async removeItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const itemId = Number(req.params.itemId);
      const data = await CartService.removeItem(req.user!.userId, itemId);
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }
}
