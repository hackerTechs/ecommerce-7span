import { OrderStatus } from "@prisma/client";
import { z } from "zod";
import { MAX_PAGINATION_LIMIT } from "../constants/pagination";

export const getOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(MAX_PAGINATION_LIMIT).optional(),
  }),
});

export const getOrderByIdSchema = z.object({
  params: z.object({
    id: z.coerce.number(),
  }),
});

export const cancelOrderSchema = z.object({
  params: z.object({
    id: z.coerce.number(),
  }),
});

export const adminListOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(MAX_PAGINATION_LIMIT).optional(),
    categoryId: z.coerce.number().optional(),
    search: z.string().optional(),
  }),
});

export const adminUpdateOrderStatusSchema = z.object({
  params: z.object({
    id: z.coerce.number(),
  }),
  body: z.object({
    status: z.enum(Object.values(OrderStatus) as [string, ...string[]]),
  }),
});
