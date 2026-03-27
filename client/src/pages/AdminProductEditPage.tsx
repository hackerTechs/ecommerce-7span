import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { categoryApi } from "../api/category.api";
import { productApi } from "../api/product.api";
import { AdminProductForm, productToFormFields } from "../components/admin/AdminProductForm";
import { Loading } from "../components/common/Loading";
import type { Category, Product } from "../types";

export function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => setCategories(res.data.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!id || !Number.isFinite(productId) || productId < 1) {
      setLoadError("Invalid product");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    productApi
      .getById(productId)
      .then((res) => {
        if (!cancelled) setProduct(res.data.data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Product not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, productId]);

  const formInitial = useMemo(() => (product ? productToFormFields(product) : null), [product]);

  if (loading) {
    return <Loading />;
  }

  if (loadError || !product || !formInitial) {
    return (
      <div>
        <Link
          to="/admin/products"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          ← Back to products
        </Link>
        <p className="mt-6 text-gray-600">{loadError ?? "Could not load product."}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/admin/products"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          ← Back to products
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit product</h1>
      <p className="text-gray-600 text-sm mb-8">
        Update details for <span className="font-medium text-gray-800">{product.name}</span>.
      </p>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <AdminProductForm
          key={product.id}
          mode="edit"
          productId={product.id}
          initialValues={formInitial}
          categories={categories}
        />
      </div>
    </div>
  );
}
