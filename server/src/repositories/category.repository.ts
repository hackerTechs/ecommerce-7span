import type { Category } from "@prisma/client";
import prisma from "../config/database";

export class CategoryRepository {
  static async findAll(): Promise<Category[]> {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  }
}
