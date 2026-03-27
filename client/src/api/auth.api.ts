import api from "./axios";
import type { ApiResponse, AuthResponse, User } from "../types";

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post<ApiResponse<AuthResponse>>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>("/auth/login", data),

  logout: () => api.post("/auth/logout"),

  refresh: () => api.post<ApiResponse<AuthResponse>>("/auth/refresh"),

  getMe: () => api.get<ApiResponse<User>>("/auth/me"),
};
