import api from "./axios";
import type { ApiResponse, Product, PaginatedResponse } from "../types";

export interface ProductFilters {
  page?: number;
  limit?: number;
  categoryId?: number;
  search?: string;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: number;
  imageUrl?: string;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export const productApi = {
  getAll: (filters: ProductFilters = {}) => {
    const params: Record<string, string | number> = {};
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.search) params.search = filters.search;

    return api.get<ApiResponse<PaginatedResponse<Product>>>("/products", { params });
  },

  getById: (id: number) => api.get<ApiResponse<Product>>(`/products/${id}`),

  create: (data: CreateProductPayload) =>
    api.post<ApiResponse<Product>>("/admin/products", data),

  update: (id: number, data: UpdateProductPayload) =>
    api.put<ApiResponse<Product>>(`/admin/products/${id}`, data),

  remove: (id: number) => api.delete<ApiResponse<null>>(`/admin/products/${id}`),
};
