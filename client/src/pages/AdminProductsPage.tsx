import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useProducts } from "../hooks/useProducts";
import { useDebounce } from "../hooks/useDebounce";
import { categoryApi } from "../api/category.api";
import { productApi } from "../api/product.api";
import { Loading } from "../components/common/Loading";
import { formatInr } from "../utils/formatCurrency";
import { Button, buttonClassNames, Input, Select } from "../components/ui";
import type { Category, Product } from "../types";

export function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);

  const debouncedSearch = useDebounce(searchTerm, 400);
  const limit = 10;

  const { products, totalPages, isLoading, refetch } = useProducts({
    page,
    limit,
    categoryId: categoryFilter,
    search: debouncedSearch || undefined,
  });

  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => setCategories(res.data.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryFilter]);

  async function handleDelete(p: Product) {
    if (!window.confirm(`Delete “${p.name}”? This cannot be undone.`)) return;
    try {
      await productApi.remove(p.id);
      toast.success("Product deleted");
      await refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || "Could not delete product");
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage products</h1>
        <Link
          to="/admin/products/new"
          className={`${buttonClassNames({ variant: "primary", size: "md" })} shrink-0 py-2.5`}
        >
          Add product
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search by name..."
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Price</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Stock</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No products match your filters.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        {p.description && (
                          <div className="text-gray-500 text-xs line-clamp-2 max-w-xs">{p.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.category?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatInr(p.price)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.stock}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-800 font-medium mr-3"
                        >
                          Edit
                        </Link>
                        <Button
                          type="button"
                          variant="dangerLink"
                          onClick={() => handleDelete(p)}
                        >
                          Delete
                        </Button>
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
