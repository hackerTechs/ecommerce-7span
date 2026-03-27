import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthPayload } from "../types";

export interface RefreshTokenPayload {
  userId: number;
  type: "refresh";
}

export function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions);
}

export function generateRefreshToken(userId: number): string {
  const payload: RefreshTokenPayload = { userId, type: "refresh" };
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, config.jwt.accessSecret) as AuthPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
  if (decoded.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return decoded;
}
