import { z } from "zod";
import { MAX_PAGINATION_LIMIT } from "../constants/pagination";

export const getProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(MAX_PAGINATION_LIMIT).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    search: z.string().optional(),
  }),
});

export const getProductByIdSchema = z.object({
  params: z.object({
    id: z.coerce.number(),
  }),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(255),
    description: z.string().optional(),
    price: z.number().positive("Price must be positive"),
    stock: z.number().int().min(0, "Stock cannot be negative"),
    categoryId: z.number().int().positive("Category ID is required"),
    imageUrl: z.string().url("Must be a valid URL").optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.coerce.number(),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    price: z.number().positive("Price must be positive").optional(),
    stock: z.number().int().min(0, "Stock cannot be negative").optional(),
    categoryId: z.number().int().positive().optional(),
    imageUrl: z.string().url("Must be a valid URL").optional(),
  }),
});

export const deleteProductSchema = z.object({
  params: z.object({
    id: z.coerce.number(),
  }),
});
