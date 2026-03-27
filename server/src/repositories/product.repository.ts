import type { Product } from "@prisma/client";
import { Prisma } from "@prisma/client";
import prisma from "../config/database";

export class ProductRepository {
  static async findAll(
    page: number,
    limit: number,
    filters?: { categoryId?: number; search?: string },
  ): Promise<{ products: Product[]; total: number }> {
    const where: Prisma.ProductWhereInput = {};

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters?.search) {
      const q = filters.search.trim();
      if (q.length !== 0) {
        if (q.length >= 3) {
          where.name = { search: q };
        } else {
          where.name = { contains: q };
        }
      }
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { category: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);
    return { products, total };
  }

  static async findById(id: number): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  static async create(data: {
    name: string;
    description?: string;
    price: number;
    stock: number;
    categoryId: number;
    imageUrl?: string;
  }): Promise<Product> {
    return prisma.product.create({
      data,
      include: { category: true },
    }) as unknown as Product;
  }

  static async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      price?: number;
      stock?: number;
      categoryId?: number;
      imageUrl?: string;
    },
  ): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    }) as unknown as Product;
  }

  static async delete(id: number): Promise<Product> {
    return prisma.product.delete({ where: { id } });
  }

  static async updateStock(
    id: number,
    quantity: number,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx ?? prisma;
    return client.$executeRaw`
      UPDATE products
      SET stock = stock - ${quantity}
      WHERE id = ${id} AND stock >= ${quantity}
    `;
  }

  static async restoreStock(
    id: number,
    quantity: number,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx ?? prisma;
    return client.$executeRaw`
      UPDATE products
      SET stock = stock + ${quantity}
      WHERE id = ${id}
    `;
  }

  /**
   * Restores stock for multiple products in a single query using
   * a CASE expression. O(1) round trips instead of O(N).
   *
   * Generates:
   *   UPDATE products
   *   SET stock = stock + CASE id
   *     WHEN 1 THEN 5
   *     WHEN 2 THEN 3
   *     ELSE 0 END
   *   WHERE id IN (1, 2)
   */
  static async restoreStockBulk(
    items: Array<{ productId: number; quantity: number }>,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    if (items.length === 0) return 0;

    const client = tx ?? prisma;
    const caseClauses = items.map((i) => `WHEN ${Number(i.productId)} THEN ${Number(i.quantity)}`).join(" ");
    const ids = items.map((i) => Number(i.productId)).join(",");

    return client.$executeRawUnsafe(
      `UPDATE products SET stock = stock + CASE id ${caseClauses} ELSE 0 END WHERE id IN (${ids})`,
    );
  }
}
