import { CartRepository } from "../repositories/cart.repository";
import { ProductRepository } from "../repositories/product.repository";
import { ApiError } from "../utils/api-error";

export class CartService {
  static async getCart(userId: number) {
    let cart = await CartRepository.findByUserId(userId);
    if (!cart) {
      await CartRepository.findOrCreate(userId);
      cart = await CartRepository.findByUserId(userId);
    }
    return cart!;
  }

  static async addItem(userId: number, productId: number, quantity: number) {
    const product = await ProductRepository.findById(productId);
    if (!product) {
      throw ApiError.notFound("Product not found");
    }
    if (product.stock < quantity) {
      throw ApiError.badRequest("Insufficient stock");
    }

    const cart = await CartRepository.findOrCreate(userId);
    await CartRepository.addItem(cart.id, productId, quantity);

    const updated = await CartRepository.findByUserId(userId);
    return updated!;
  }

  static async updateItem(userId: number, itemId: number, quantity: number) {
    const cart = await CartRepository.findByUserId(userId);
    if (!cart) {
      throw ApiError.notFound("Cart not found");
    }

    const belongs = cart.items.some((i) => i.id === itemId);
    if (!belongs) {
      throw ApiError.notFound("Cart item not found");
    }

    await CartRepository.updateItem(itemId, quantity);

    const updated = await CartRepository.findByUserId(userId);
    return updated!;
  }

  static async removeItem(userId: number, itemId: number) {
    const cart = await CartRepository.findByUserId(userId);
    if (!cart) {
      throw ApiError.notFound("Cart not found");
    }

    const belongs = cart.items.some((i) => i.id === itemId);
    if (!belongs) {
      throw ApiError.notFound("Cart item not found");
    }

    await CartRepository.removeItem(itemId);

    const updated = await CartRepository.findByUserId(userId);
    return updated!;
  }
}
