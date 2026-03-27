import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { ApiResponse } from "../utils/api-response";
import { AuthService } from "../services/auth.service";
import { ApiError } from "../utils/api-error";
import { config } from "../config";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "../constants/auth-cookies";

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDurationToMs(expr: string): number {
  const m = /^(\d+)([smhd])$/i.exec(expr.trim());
  if (!m) return 15 * MS_PER_MINUTE;
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  switch (u) {
    case "s":
      return n * 1000;
    case "m":
      return n * MS_PER_MINUTE;
    case "h":
      return n * 60 * MS_PER_MINUTE;
    case "d":
      return n * MS_PER_DAY;
    default:
      return 15 * MS_PER_MINUTE;
  }
}

const accessMaxAge = parseDurationToMs(config.jwt.accessExpiresIn);
const refreshMaxAge = parseDurationToMs(config.jwt.refreshExpiresIn);

const cookieBase = {
  httpOnly: true,
  secure: config.nodeEnv === "production",
  sameSite: "lax" as const,
  path: "/",
};

const accessCookieOptions = { ...cookieBase, maxAge: accessMaxAge };
const refreshCookieOptions = { ...cookieBase, maxAge: refreshMaxAge };

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, accessCookieOptions);
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions);
}

function clearAuthCookies(res: Response) {
  const clearOpts = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    ...(config.nodeEnv === "production" ? { secure: true as const } : {}),
  };
  res.clearCookie(ACCESS_TOKEN_COOKIE, clearOpts);
  res.clearCookie(REFRESH_TOKEN_COOKIE, clearOpts);
}

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      return ApiResponse.created(res, { user: result.user });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      return ApiResponse.success(res, { user: result.user });
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
      if (!refreshToken) {
        return next(ApiError.unauthorized("Refresh token required"));
      }
      const result = await AuthService.refresh(refreshToken);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      return ApiResponse.success(res, { user: result.user });
    } catch (err) {
      next(err);
    }
  }

  static async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      clearAuthCookies(res);
      return ApiResponse.success(res, null, "Logged out successfully");
    } catch (err) {
      next(err);
    }
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      return ApiResponse.success(res, req.user);
    } catch (err) {
      next(err);
    }
  }
}
