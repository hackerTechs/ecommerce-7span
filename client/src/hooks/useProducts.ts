import { useState, useEffect, useCallback } from "react";
import { productApi } from "../api/product.api";
import { clampPaginationLimit } from "../constants/pagination";
import { useSocket } from "./useSocket";
import type { Product } from "../types";

interface UseProductsOptions {
  page?: number;
  limit?: number;
  categoryId?: number;
  search?: string;
}

export function useProducts({ page = 1, limit = 10, categoryId, search }: UseProductsOptions = {}) {
  const safeLimit = clampPaginationLimit(limit);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { stockUpdates } = useSocket();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await productApi.getAll({ page, limit: safeLimit, categoryId, search });
      const data = res.data.data;
      setProducts(data.products || []);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, safeLimit, categoryId, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (stockUpdates.length === 0) return;
    const map = new Map(stockUpdates.map((u) => [u.id, u.stock]));
    setProducts((prev) =>
      prev.map((p) => (map.has(p.id) ? { ...p, stock: map.get(p.id)! } : p)),
    );
  }, [stockUpdates]);

  return { products, total, totalPages, isLoading, refetch: fetchProducts };
}
