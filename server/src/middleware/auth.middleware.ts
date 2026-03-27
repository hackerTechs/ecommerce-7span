import { Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { ApiError } from "../utils/api-error";
import { AuthRequest } from "../types";
import { ACCESS_TOKEN_COOKIE } from "../constants/auth-cookies";

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.[ACCESS_TOKEN_COOKIE];

    if (!token) {
      throw ApiError.unauthorized("Authentication required");
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized("Invalid or expired token"));
    }
  }
}

export function authorize(...roles: Array<"ADMIN" | "CUSTOMER">) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }
    next();
  };
}
