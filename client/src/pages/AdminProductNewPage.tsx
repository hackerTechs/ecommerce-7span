import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { categoryApi } from "../api/category.api";
import {
  AdminProductForm,
  emptyProductFormFields,
} from "../components/admin/AdminProductForm";
import { Loading } from "../components/common/Loading";
import type { Category } from "../types";

export function AdminProductNewPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => setCategories(res.data.data))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Loading />;
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Add product</h1>
      <p className="text-gray-600 text-sm mb-8">Create a new catalog item and assign it to a category.</p>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <AdminProductForm
          mode="create"
          initialValues={emptyProductFormFields}
          categories={categories}
        />
      </div>
    </div>
  );
}
