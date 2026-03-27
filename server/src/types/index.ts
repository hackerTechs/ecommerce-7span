import { Request } from "express";

export interface AuthPayload {
  userId: number;
  email: string;
  role: "ADMIN" | "CUSTOMER";
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface ApiResponseBody<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}
