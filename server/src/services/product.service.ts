import { ProductRepository } from "../repositories/product.repository";
import { ApiError } from "../utils/api-error";
import prisma from "../config/database";
import {
  bumpCatalogCache,
  cacheGetJson,
  cacheSetJson,
  getCatalogEpoch,
  listCacheKey,
  LIST_TTL_SEC,
  productCacheKey,
  PRODUCT_TTL_SEC,
} from "../utils/catalog-cache";

export class ProductService {
  static async getAll(
    page: number,
    limit: number,
    filters?: { categoryId?: number; search?: string },
  ) {
    const epoch = await getCatalogEpoch();
    const cacheKey = listCacheKey(epoch, page, limit, filters?.categoryId, filters?.search);

    type ListResult = {
      products: Awaited<ReturnType<typeof ProductRepository.findAll>>["products"];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };

    const cached = await cacheGetJson<ListResult>(cacheKey);
    if (cached) return cached;

    const { products, total } = await ProductRepository.findAll(page, limit, filters);
    const totalPages = Math.ceil(total / limit) || 0;

    const result: ListResult = {
      products,
      total,
      page,
      limit,
      totalPages,
    };

    await cacheSetJson(cacheKey, result, LIST_TTL_SEC);
    return result;
  }

  static async getById(id: number) {
    const epoch = await getCatalogEpoch();
    const key = productCacheKey(epoch, id);

    const cached = await cacheGetJson<Awaited<ReturnType<typeof ProductRepository.findById>>>(key);
    if (cached) return cached;

    const product = await ProductRepository.findById(id);
    if (!product) {
      throw ApiError.notFound("Product not found");
    }

    await cacheSetJson(key, product, PRODUCT_TTL_SEC);
    return product;
  }

  static async create(data: {
    name: string;
    description?: string;
    price: number;
    stock: number;
    categoryId: number;
    imageUrl?: string;
  }) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw ApiError.badRequest("Category not found");
    }
    const created = await ProductRepository.create(data);
    await bumpCatalogCache();
    return created;
  }

  static async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      price?: number;
      stock?: number;
      categoryId?: number;
      imageUrl?: string;
    },
  ) {
    const product = await ProductRepository.findById(id);
    if (!product) {
      throw ApiError.notFound("Product not found");
    }
    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        throw ApiError.badRequest("Category not found");
      }
    }
    const updated = await ProductRepository.update(id, data);
    await bumpCatalogCache();
    return updated;
  }

  static async delete(id: number) {
    const product = await ProductRepository.findById(id);
    if (!product) {
      throw ApiError.notFound("Product not found");
    }
    const removed = await ProductRepository.delete(id);
    await bumpCatalogCache();
    return removed;
  }
}
