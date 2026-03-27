import {
  cacheGetJson,
  cacheSetJson,
  CATEGORIES_CACHE_KEY,
  CATEGORIES_TTL_SEC,
} from "../utils/catalog-cache";
import type { Category } from "@prisma/client";
import { CategoryRepository } from "../repositories/category.repository";

export class CategoryService {
  static async getAll(): Promise<Category[]> {
    const cached = await cacheGetJson<Category[]>(CATEGORIES_CACHE_KEY);
    if (cached) return cached;

    const categories = await CategoryRepository.findAll();
    await cacheSetJson(CATEGORIES_CACHE_KEY, categories, CATEGORIES_TTL_SEC);
    return categories;
  }
}
