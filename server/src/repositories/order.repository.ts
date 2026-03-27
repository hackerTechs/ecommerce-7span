import type { Order, OrderItem } from "@prisma/client";
import { Prisma } from "@prisma/client";
import prisma from "../config/database";

type OrderWithItemsAndProducts = Prisma.OrderGetPayload<{
  include: { items: { include: { product: true } } };
}>;

export type OrderWithUserItemsProducts = Prisma.OrderGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
    items: { include: { product: { include: { category: true } } } };
  };
}>;

export class OrderRepository {
  static async create(
    data: {
      userId: number;
      totalAmount: number;
      items: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
      }>;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Order & { items: OrderItem[] }> {
    const client = tx ?? prisma;
    return client.order.create({
      data: {
        userId: data.userId,
        totalAmount: data.totalAmount,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });
  }

  static async findByUserId(
    userId: number,
    page: number,
    limit: number,
  ): Promise<{ orders: OrderWithItemsAndProducts[]; total: number }> {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: { product: true },
          },
        },
      }),
      prisma.order.count({ where: { userId } }),
    ]);
    return { orders, total };
  }

  static async findById(
    id: number,
    userId: number,
  ): Promise<OrderWithItemsAndProducts | null> {
    return prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  }

  /**
   * Admin list: all orders with customer + line items. Optional filter by product category
   * and search (customer name/email or product name on any line).
   */
  static async findAllAdmin(
    page: number,
    limit: number,
    filters?: { categoryId?: number; search?: string },
  ): Promise<{ orders: OrderWithUserItemsProducts[]; total: number }> {
    const skip = (page - 1) * limit;
    const search = filters?.search?.trim();

    const clauses: Prisma.OrderWhereInput[] = [];
    if (filters?.categoryId) {
      clauses.push({
        items: { some: { product: { categoryId: filters.categoryId } } },
      });
    }
    if (search) {
      const q = search;
      const useFts = q.length >= 3;
      const textMatch = useFts
        ? { search: q }
        : { contains: q };
      clauses.push({
        OR: [
          { user: { name: textMatch } },
          { user: { email: textMatch } },
          { items: { some: { product: { name: textMatch } } } },
        ],
      });
    }
    const where: Prisma.OrderWhereInput = clauses.length > 0 ? { AND: clauses } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { include: { category: true } },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  static async findByIdForAdmin(id: number): Promise<OrderWithUserItemsProducts | null> {
    return prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { include: { category: true } },
          },
        },
      },
    });
  }
}
