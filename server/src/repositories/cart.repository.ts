import type { Cart, CartItem } from "@prisma/client";
import { Prisma } from "@prisma/client";
import prisma from "../config/database";

type CartWithItemsAndProducts = Prisma.CartGetPayload<{
  include: { items: { include: { product: true } } };
}>;

export class CartRepository {
  static async findByUserId(
    userId: number,
  ): Promise<CartWithItemsAndProducts | null> {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  }

  static async findOrCreate(userId: number): Promise<Cart> {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  static async addItem(
    cartId: number,
    productId: number,
    quantity: number,
  ): Promise<CartItem> {
    return prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId, productId },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        cartId,
        productId,
        quantity,
      },
    });
  }

  static async updateItem(itemId: number, quantity: number): Promise<CartItem> {
    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  static async removeItem(itemId: number): Promise<CartItem> {
    return prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  static async clearCart(cartId: number): Promise<Prisma.BatchPayload> {
    return prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }
}
