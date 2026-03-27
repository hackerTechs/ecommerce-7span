import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { useDebounce } from "../hooks/useDebounce";
import { categoryApi } from "../api/category.api";
import { ProductList } from "../components/products/ProductList";
import { Loading } from "../components/common/Loading";
import { Button, Input, Select } from "../components/ui";
import type { Category } from "../types";

const limit = 12;

function parsePage(params: URLSearchParams): number {
  const raw = params.get("page");
  if (raw == null || raw === "") return 1;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function parseCategoryId(params: URLSearchParams): number | undefined {
  const raw = params.get("category");
  if (raw == null || raw === "") return undefined;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") ?? "");
  const [categories, setCategories] = useState<Category[]>([]);

  const page = useMemo(() => parsePage(searchParams), [searchParams]);
  const categoryId = useMemo(() => parseCategoryId(searchParams), [searchParams]);

  const debouncedSearch = useDebounce(searchTerm, 400);
  const debouncedTrimmed = debouncedSearch.trim();
  
  // Don't wait for debounce, if input cleared.
  const searchForApi =
    searchTerm.trim() === "" ? undefined : debouncedTrimmed || undefined;

  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => setCategories(res.data.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setSearchTerm(searchParams.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const urlSearch = (searchParams.get("search") ?? "").trim();
    const termTrimmed = searchTerm.trim();

    // Input cleared but debounce still holds old text — don't write stale value back to URL
    if (termTrimmed === "") {
      if (urlSearch !== "") {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete("search");
            next.set("page", "1");
            return next;
          },
          { replace: true },
        );
      }
      return;
    }

    if (debouncedTrimmed === urlSearch) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedTrimmed) next.set("search", debouncedTrimmed);
        else next.delete("search");
        next.set("page", "1");
        return next;
      },
      { replace: true },
    );
  }, [debouncedTrimmed, searchTerm, searchParams, setSearchParams]);

  const { products, totalPages, isLoading } = useProducts({
    page,
    limit,
    categoryId,
    search: searchForApi,
  });

  const hasActiveFilters = Boolean(
    (searchParams.get("search") ?? "").trim() || (searchParams.get("category") ?? "").trim(),
  );

  const setPageInUrl = useCallback(
    (nextPage: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (nextPage <= 1) next.delete("page");
          else next.set("page", String(nextPage));
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const setCategoryInUrl = useCallback(
    (id: number | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id != null) next.set("category", String(id));
          else next.delete("category");
          next.set("page", "1");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Products</h1>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-2.5 pl-10 focus:border-transparent"
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

          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <Select
              value={categoryId ?? ""}
              onChange={(e) =>
                setCategoryInUrl(e.target.value ? Number(e.target.value) : undefined)
              }
              className="min-w-[180px] focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={clearFilters}
                className="whitespace-nowrap py-2.5"
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <ProductList products={products} />

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPageInUrl(Math.max(1, page - 1))}
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
                onClick={() => setPageInUrl(Math.min(totalPages, page + 1))}
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
