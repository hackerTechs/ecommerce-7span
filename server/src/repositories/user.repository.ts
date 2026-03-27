import type { User } from "@prisma/client";
import prisma from "../config/database";

export class UserRepository {
  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  static async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  static async create(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<User> {
    return prisma.user.create({ data });
  }
}
