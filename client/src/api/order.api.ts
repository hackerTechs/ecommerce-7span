import api from "./axios";
import type { AdminOrder, ApiResponse, Order, PaginatedResponse } from "../types";

export const orderApi = {
  placeOrder: () => api.post<ApiResponse<Order>>("/orders"),

  getAll: (page = 1, limit = 10) =>
    api.get<ApiResponse<PaginatedResponse<Order>>>("/orders", {
      params: { page, limit },
    }),

  getById: (id: number) => api.get<ApiResponse<Order>>(`/orders/${id}`),

  cancel: (id: number) => api.patch<ApiResponse<Order>>(`/orders/${id}/cancel`),

  adminList: (params: {
    page?: number;
    limit?: number;
    categoryId?: number;
    search?: string;
  }) =>
    api.get<ApiResponse<PaginatedResponse<AdminOrder>>>("/admin/orders", { params }),

  adminUpdateStatus: (id: number, status: Order["status"]) =>
    api.patch<ApiResponse<AdminOrder>>(`/admin/orders/${id}/status`, { status }),
};
