import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { productApi, type CreateProductPayload } from "../../api/product.api";
import type { Category } from "../../types";
import { Button, buttonClassNames, Input, Label, Select, Textarea } from "../ui";

export type ProductFormFields = {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  imageUrl: string;
};

export const emptyProductFormFields: ProductFormFields = {
  name: "",
  description: "",
  price: "",
  stock: "",
  categoryId: "",
  imageUrl: "",
};

export function productToFormFields(p: {
  name: string;
  description: string | null;
  price: string;
  stock: number;
  categoryId: number;
  imageUrl: string | null;
}): ProductFormFields {
  return {
    name: p.name,
    description: p.description ?? "",
    price: String(p.price),
    stock: String(p.stock),
    categoryId: String(p.categoryId),
    imageUrl: p.imageUrl ?? "",
  };
}

function buildPayload(form: ProductFormFields): CreateProductPayload | null {
  const name = form.name.trim();
  if (!name) {
    toast.error("Name is required");
    return null;
  }
  const price = parseFloat(form.price);
  if (!Number.isFinite(price) || price <= 0) {
    toast.error("Enter a valid positive price");
    return null;
  }
  const stock = parseInt(form.stock, 10);
  if (!Number.isFinite(stock) || stock < 0) {
    toast.error("Stock must be a non-negative integer");
    return null;
  }
  const categoryId = parseInt(form.categoryId, 10);
  if (!Number.isFinite(categoryId) || categoryId < 1) {
    toast.error("Select a category");
    return null;
  }
  const payload: CreateProductPayload = {
    name,
    price,
    stock,
    categoryId,
  };
  const desc = form.description.trim();
  if (desc) payload.description = desc;
  const img = form.imageUrl.trim();
  if (img) payload.imageUrl = img;
  return payload;
}

interface AdminProductFormProps {
  mode: "create" | "edit";
  productId?: number;
  initialValues: ProductFormFields;
  categories: Category[];
  listPath?: string;
}

export function AdminProductForm({
  mode,
  productId,
  initialValues,
  categories,
  listPath = "/admin/products",
}: AdminProductFormProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = buildPayload(form);
    if (!payload) return;

    setSubmitting(true);
    try {
      if (mode === "edit" && productId != null) {
        await productApi.update(productId, payload);
        toast.success("Product updated");
      } else {
        await productApi.create(payload);
        toast.success("Product created");
      }
      navigate(listPath);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || "Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="product-name" className="block mb-1">
          Name
        </Label>
        <Input
          id="product-name"
          inputSize="sm"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="product-description" className="block mb-1">
          Description
        </Label>
        <Textarea
          id="product-description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="product-price" className="block mb-1">
          Price (INR)
        </Label>
        <Input
          id="product-price"
          inputSize="sm"
          type="number"
          step="0.01"
          min="0.01"
          value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="product-stock" className="block mb-1">
          Stock
        </Label>
        <Input
          id="product-stock"
          inputSize="sm"
          type="number"
          min="0"
          step="1"
          value={form.stock}
          onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="product-category" className="block mb-1">
          Category
        </Label>
        <Select
          id="product-category"
          inputSize="sm"
          required
          value={form.categoryId}
          onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="product-image-url" className="block mb-1">
          Image URL (optional)
        </Label>
        <Input
          id="product-image-url"
          inputSize="sm"
          type="url"
          placeholder="https://..."
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
        />
      </div>
      <div className="sm:col-span-2 flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting} variant="primary" size="md">
          {submitting ? "Saving…" : mode === "edit" ? "Save changes" : "Create product"}
        </Button>
        <Link
          to={listPath}
          className={buttonClassNames({ variant: "secondary", size: "md" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
