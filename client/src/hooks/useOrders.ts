import { useState, useEffect, useCallback } from "react";
import { orderApi } from "../api/order.api";
import { clampPaginationLimit } from "../constants/pagination";
import type { Order } from "../types";

export function useOrders(page = 1, limit = 10) {
  const safeLimit = clampPaginationLimit(limit);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await orderApi.getAll(page, safeLimit);
      const data = res.data.data;
      setOrders(data.orders || []);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, safeLimit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, total, totalPages, isLoading, refetch: fetchOrders };
}
