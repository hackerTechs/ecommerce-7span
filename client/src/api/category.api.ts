import api from "./axios";
import type { ApiResponse, Category } from "../types";

export const categoryApi = {
  getAll: () => api.get<ApiResponse<Category[]>>("/categories"),
};
