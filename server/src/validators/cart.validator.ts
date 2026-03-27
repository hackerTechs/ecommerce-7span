import { z } from "zod";

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.number().positive(),
    quantity: z.number().int().min(1),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    itemId: z.coerce.number(),
  }),
  body: z.object({
    quantity: z.number().int().min(1),
  }),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    itemId: z.coerce.number(),
  }),
});
