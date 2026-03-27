import { OrderStatus } from "@prisma/client";
import prisma from "../config/database";
import { OrderRepository } from "../repositories/order.repository";
import { ProductRepository } from "../repositories/product.repository";
import { ApiError } from "../utils/api-error";
import { broadcastStockUpdate } from "../config/socket";
import { bumpCatalogCache } from "../utils/catalog-cache";

export class OrderService {
  private static async emitStockUpdate(productIds: number[]) {
    if (productIds.length === 0) return;
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stock: true },
    });

    broadcastStockUpdate(products);
  }

  static async placeOrder(userId: number) {
    const order = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw ApiError.badRequest("Cart is empty");
      }

      for (const item of cart.items) {
        const product = item.product;
        if (!product) {
          throw ApiError.notFound("Product not found");
        }
        if (product.stock < item.quantity) {
          throw ApiError.badRequest("Insufficient stock for one or more items");
        }
      }

      let totalAmount = 0;
      for (const item of cart.items) {
        const unit = Number(item.product.price);
        totalAmount += unit * item.quantity;
      }

      for (const item of cart.items) {
        const rowsAffected = await ProductRepository.updateStock(
          item.productId,
          item.quantity,
          tx,
        );
        if (rowsAffected !== 1) {
          throw ApiError.badRequest("Insufficient stock for one or more items");
        }
      }

      const created = await OrderRepository.create(
        {
          userId,
          totalAmount,
          items: cart.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: Number(i.product.price),
          })),
        },
        tx,
      );

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    const productIds = order.items.map((i: { productId: number }) => i.productId);
    await this.emitStockUpdate(productIds);
    await bumpCatalogCache();

    return order;
  }

  static async getOrders(userId: number, page: number, limit: number) {
    const { orders, total } = await OrderRepository.findByUserId(userId, page, limit);
    const totalPages = Math.ceil(total / limit) || 0;

    return {
      orders,
      total,
      page,
      limit,
      totalPages,
    };
  }

  static async getOrderById(id: number, userId: number) {
    const order = await OrderRepository.findById(id, userId);
    if (!order) {
      throw ApiError.notFound("Order not found");
    }
    return order;
  }

  static async cancelOrder(id: number, userId: number) {
    const cancelled = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, userId },
        include: { items: true },
      });

      if (!order) {
        throw ApiError.notFound("Order not found");
      }
      if (order.status !== "PENDING") {
        throw ApiError.badRequest("Only pending orders can be cancelled");
      }

      await ProductRepository.restoreStockBulk(order.items, tx);

      const updated = await tx.order.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      return updated;
    });

    const productIds = cancelled.items.map((i: { productId: number }) => i.productId);
    await this.emitStockUpdate(productIds);
    await bumpCatalogCache();

    return cancelled;
  }

  static async getAllForAdmin(
    page: number,
    limit: number,
    filters?: { categoryId?: number; search?: string },
  ) {
    const { orders, total } = await OrderRepository.findAllAdmin(page, limit, filters);
    const totalPages = Math.ceil(total / limit) || 0;
    return { orders, total, page, limit, totalPages };
  }

  /**
   * Admin status change. Moving to CANCELLED restores inventory (from PENDING or CONFIRMED).
   * Cancelled orders cannot be changed.
   */
  static async updateOrderStatusByAdmin(orderId: number, newStatus: OrderStatus) {
    const meta = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw ApiError.notFound("Order not found");
      }
      if (order.status === OrderStatus.CANCELLED) {
        throw ApiError.badRequest("Cancelled orders cannot be updated");
      }
      if (order.status === newStatus) {
        return { unchanged: true as const, productIds: [] as number[], didRestoreStock: false };
      }
      if (newStatus === OrderStatus.CANCELLED) {
        await ProductRepository.restoreStockBulk(order.items, tx);
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      return {
        unchanged: false as const,
        productIds: order.items.map((i) => i.productId),
        didRestoreStock: newStatus === OrderStatus.CANCELLED,
      };
    });

    if (!meta.unchanged && meta.didRestoreStock) {
      await this.emitStockUpdate(meta.productIds);
      await bumpCatalogCache();
    }

    const full = await OrderRepository.findByIdForAdmin(orderId);
    if (!full) {
      throw ApiError.notFound("Order not found");
    }
    return full;
  }
}
