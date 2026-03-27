import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api-error";
import { ApiResponse } from "../utils/api-response";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof ApiError) {
    return ApiResponse.error(res, err.message, err.statusCode, err.errors);
  }

  console.error("Unhandled error:", err);
  return ApiResponse.error(res, "Internal server error", 500);
}
