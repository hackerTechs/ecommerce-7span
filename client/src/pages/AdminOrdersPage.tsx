import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { orderApi } from "../api/order.api";
import { categoryApi } from "../api/category.api";
import { useDebounce } from "../hooks/useDebounce";
import { Loading } from "../components/common/Loading";
import { formatInr } from "../utils/formatCurrency";
import { Button, Input, Select } from "../components/ui";
import type { AdminOrder, Category, Order } from "../types";

const limit = 10;

export function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => setCategories(res.data.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryFilter]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await orderApi.adminList({
        page,
        limit,
        categoryId: categoryFilter,
        search: debouncedSearch.trim() || undefined,
      });
      const data = res.data.data;
      setOrders(data.orders || []);
      setTotalPages(data.totalPages);
    } catch {
      setOrders([]);
      toast.error("Could not load orders");
    } finally {
      setIsLoading(false);
    }
  }, [page, categoryFilter, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStatusChange(order: AdminOrder, next: Order["status"]) {
    if (order.status === next) return;
    setUpdatingId(order.id);
    try {
      await orderApi.adminUpdateStatus(order.id, next);
      toast.success("Order status updated");
      await load();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || "Could not update status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage orders</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search by customer name, email, or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-2.5 pl-10"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <Select
          value={categoryFilter ?? ""}
          onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : undefined)}
          className="min-w-[200px]"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Order</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Items</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No orders match your filters.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 align-top">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-900">#{o.id}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(o.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{o.user.name}</div>
                        <div className="text-gray-500 text-xs">{o.user.email}</div>
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <ul className="text-gray-700 text-xs space-y-1">
                          {o.items.map((line) => (
                            <li key={line.id}>
                              {line.product.name} × {line.quantity}
                              {line.product.category ? (
                                <span className="text-gray-400"> · {line.product.category.name}</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {formatInr(o.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          inputSize="sm"
                          value={o.status}
                          disabled={o.status === "CANCELLED" || updatingId === o.id}
                          onChange={(e) =>
                            handleStatusChange(o, e.target.value as Order["status"])
                          }
                          className="min-w-[8.5rem] py-1.5 disabled:opacity-60"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </Select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((x) => Math.max(1, x - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPage((x) => Math.min(totalPages, x + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
