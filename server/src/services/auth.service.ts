import { UserRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/api-error";
import { hashPassword, comparePassword } from "../utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

function issueTokenPair(user: { id: number; email: string; role: "ADMIN" | "CUSTOMER" }) {
  const payload = { userId: user.id, email: user.email, role: user.role };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(user.id),
  };
}

export class AuthService {
  static async register(data: { email: string; password: string; name: string }) {
    const existing = await UserRepository.findByEmail(data.email);
    if (existing) {
      throw ApiError.conflict("Email already registered");
    }

    const hashed = await hashPassword(data.password);
    const user = await UserRepository.create({
      email: data.email,
      password: hashed,
      name: data.name,
    });

    const { password: _, ...userWithoutPassword } = user;
    const tokens = issueTokenPair(user);

    return { user: userWithoutPassword, ...tokens };
  }

  static async login(data: { email: string; password: string }) {
    const user = await UserRepository.findByEmail(data.email);
    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const valid = await comparePassword(data.password, user.password);
    if (!valid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const { password: _, ...userWithoutPassword } = user;
    const tokens = issueTokenPair(user);

    return { user: userWithoutPassword, ...tokens };
  }

  /**
   * Validates a refresh token, ensures the user still exists, and issues a new pair (rotation).
   */
  static async refresh(refreshToken: string) {
    let userId: number;
    try {
      ({ userId } = verifyRefreshToken(refreshToken));
    } catch {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    const { password: _, ...userWithoutPassword } = user;
    const tokens = issueTokenPair(user);

    return { user: userWithoutPassword, ...tokens };
  }
}
