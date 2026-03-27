import api from "./axios";
import type { ApiResponse, Cart } from "../types";

export const cartApi = {
  getCart: () => api.get<ApiResponse<Cart>>("/cart"),

  addItem: (productId: number, quantity: number) =>
    api.post<ApiResponse<Cart>>("/cart/items", { productId, quantity }),

  updateItem: (itemId: number, quantity: number) =>
    api.patch<ApiResponse<Cart>>(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: number) =>
    api.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`),
};
